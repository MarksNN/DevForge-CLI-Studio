import { GoogleGenAI } from '@google/genai';
import { formatSynthesis } from '../orchestrator/format';
import { getAgent } from '../orchestrator/registry';
import type { AgentId, OrchestratorRun, StepResult } from '../orchestrator/types';
import { resolveGrokCredential } from './grokSession';

interface PromptContext {
  activeFilePath: string;
  activeFileContent: string;
  branch: string;
}

const OUTPUT_CAP = 4000;

function withTimeout(ms: number): AbortSignal {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), ms);
  return controller.signal;
}

function clip(text: string): string {
  const trimmed = text.trim();
  if (trimmed.length <= OUTPUT_CAP) return trimmed;
  return `${trimmed.slice(0, OUTPUT_CAP)}\n…[saída truncada]`;
}

function extractResponseText(payload: unknown): string {
  if (!payload || typeof payload !== 'object') return '';
  const record = payload as {
    output_text?: unknown;
    output?: Array<{ content?: Array<{ text?: unknown }> }>;
  };
  if (typeof record.output_text === 'string' && record.output_text.trim()) {
    return record.output_text.trim();
  }
  const parts: string[] = [];
  for (const item of record.output ?? []) {
    if ((item as { type?: string }).type === 'reasoning') continue;
    for (const content of item.content ?? []) {
      if (typeof content.text === 'string' && content.text.trim()) parts.push(content.text);
    }
  }
  return parts.join('\n').trim();
}

async function errorDetail(response: Response): Promise<string> {
  const body = await response.text();
  return body.replace(/\s+/g, ' ').slice(0, 240);
}

function agentPrompt(result: StepResult, ctx: PromptContext, prior: string[]): string {
  const agent = getAgent(result.agent);
  return [
    `Você é ${agent.name}, agente de ${agent.companyName}, dentro do DevForge.`,
    'DevForge é o orquestrador. Você executa só a etapa desta empresa e devolve a parte dela.',
    `Tarefa: ${result.command}`,
    `Motivo do roteamento: ${result.output.split('\n').find((line) => line.startsWith('Motivo:')) || agent.routeReason}`,
    `Branch: ${ctx.branch}`,
    `Arquivo: ${ctx.activeFilePath}`,
    'Trecho:',
    ctx.activeFileContent.slice(0, 3500) || '(sem conteúdo)',
    prior.length > 0 ? `Pacote dos agentes anteriores:\n${prior.join('\n\n').slice(0, 2500)}` : 'Nenhum agente anterior.',
    'Responda em português, em até 14 linhas, com achados acionáveis. Não diga que executou um binário local.',
  ].join('\n');
}

async function callXai(prompt: string): Promise<string> {
  const credential = resolveGrokCredential();
  if (!credential) {
    throw new Error('Sessão do grok login ausente e XAI_API_KEY não definida');
  }
  const response = await fetch('https://api.x.ai/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${credential.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.XAI_MODEL?.trim() || 'grok-4.7',
      input: prompt,
    }),
    signal: withTimeout(25000),
  });
  if (!response.ok) {
    throw new Error(`xAI ${response.status}: ${await errorDetail(response)}`);
  }
  return clip(extractResponseText(await response.json()));
}

async function callGemini(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY ausente');
  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
  const response = await ai.models.generateContent({
    model: process.env.GEMINI_MODEL?.trim() || 'gemini-3.8-flash',
    contents: prompt,
  });
  return clip(response.text?.trim() || '');
}

async function callOpenAI(prompt: string): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL?.trim() || 'gpt-4.1',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 600,
    }),
    signal: withTimeout(25000),
  });
  if (!response.ok) {
    throw new Error(`OpenAI ${response.status}: ${await errorDetail(response)}`);
  }
  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return clip(payload.choices?.[0]?.message?.content || '');
}

async function callAnthropic(prompt: string): Promise<string> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': process.env.ANTHROPIC_API_KEY || '',
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL?.trim() || 'claude-sonnet-4-5',
      max_tokens: 600,
      messages: [{ role: 'user', content: prompt }],
    }),
    signal: withTimeout(25000),
  });
  if (!response.ok) {
    throw new Error(`Anthropic ${response.status}: ${await errorDetail(response)}`);
  }
  const payload = (await response.json()) as {
    content?: Array<{ text?: string }>;
  };
  return clip(payload.content?.map((item) => item.text || '').join('\n') || '');
}

async function callAgent(agent: AgentId, prompt: string): Promise<string> {
  switch (agent) {
    case 'grok':
      return callXai(prompt);
    case 'gemini':
      return callGemini(prompt);
    case 'codex':
      return callOpenAI(prompt);
    case 'claude':
      return callAnthropic(prompt);
    case 'gh':
      throw new Error('GitHub não tem chamada de modelo nesta fase');
    default:
      throw new Error(`Agente sem API: ${agent}`);
  }
}

export async function enrichRunWithApis(
  run: OrchestratorRun,
  ctx: PromptContext
): Promise<OrchestratorRun> {
  if (run.plan.mode === 'status') return run;

  const results: StepResult[] = [];
  const prior: string[] = [];

  for (const result of run.results) {
    const agent = getAgent(result.agent);
    const canCall =
      result.agent === 'grok'
        ? resolveGrokCredential() !== null
        : result.agent !== 'gh' &&
          agent.envKeys.some((key) => {
            const value = process.env[key]?.trim();
            return !!value && !value.toUpperCase().includes('MY_') && !value.toLowerCase().includes('your_api_key');
          });

    if (!canCall) {
      results.push(result);
      prior.push(result.output);
      continue;
    }

    try {
      const text = await callAgent(result.agent, agentPrompt(result, ctx, prior));
      const next: StepResult = {
        ...result,
        transport: 'provider-api',
        output: text || result.output,
      };
      results.push(next);
      prior.push(next.output);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'falha desconhecida';
      results.push({
        ...result,
        output: `${result.output}\n\nA API de ${agent.companyName} falhou (${message}). A saída acima é do motor local.`,
      });
      prior.push(result.output);
    }
  }

  let synthesis = formatSynthesis(run.plan, results);
  const grokReady = agentReady('grok');
  if (results.length > 1 && grokReady) {
    try {
      const brief = results
        .map((item) => `${getAgent(item.agent).companyName} [${item.transport}]\n${item.output.slice(0, 1200)}`)
        .join('\n\n');
      const text = await callXai(
        [
          'Você é o plano de controle DevForge, modelo grok-4.7 da xAI.',
          'Sintetize a entrega entre as empresas em até 8 linhas, em português.',
          'Diga o que cada empresa entregou e qual é o próximo comando.',
          'Não invente execução de binário.',
          brief,
        ].join('\n')
      );
      if (text) synthesis = text;
    } catch {
      synthesis = formatSynthesis(run.plan, results);
    }
  }

  return { plan: run.plan, results, synthesis };
}

function agentReady(agent: AgentId): boolean {
  if (agent === 'grok') return resolveGrokCredential() !== null;
  return getAgent(agent).envKeys.some((key) => {
    const value = process.env[key]?.trim();
    return !!value && !value.toUpperCase().includes('MY_') && !value.toLowerCase().includes('your_api_key');
  });
}
