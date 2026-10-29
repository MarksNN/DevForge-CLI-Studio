import { formatSynthesis } from './format';
import { formatStatus, healthFor } from './health';
import { getAgent } from './registry';
import type { LocalRunContext, OrchestratorPlan, OrchestratorRun, OrchestratorStep, StepResult } from './types';

function scanFindings(content: string): string[] {
  const lines = content.split('\n');
  const notes: string[] = [];
  lines.forEach((line, index) => {
    if (line.includes('TODO:') || line.includes('FIXME:')) {
      notes.push(`L${index + 1} pendência: ${line.trim()}`);
    }
    if (/\bany\b/.test(line)) {
      notes.push(`L${index + 1} tipo any enfraquece o contrato.`);
    }
  });
  const exported = [...content.matchAll(/export\s+(?:async\s+)?function\s+([A-Za-z0-9_]+)/g)].map(
    (match) => match[1]
  );
  if (exported.length > 0) notes.push(`Funções exportadas: ${exported.join(', ')}.`);
  if (notes.length === 0) notes.push('Nenhum TODO, FIXME ou any no trecho enviado.');
  return notes.slice(0, 8);
}

function bodyFor(step: OrchestratorStep, ctx: LocalRunContext): string {
  const findings = scanFindings(ctx.activeFileContent);
  switch (step.capability) {
    case 'security-audit':
      return ['Varredura local de risco:', ...findings].join('\n');
    case 'docs':
      return [
        'Contrato local pronto para documentação:',
        ...findings,
        'O comando gemini docs no editor ainda injeta JSDoc no arquivo aberto.',
      ].join('\n');
    case 'architecture':
      return ['Leitura de estrutura:', ...findings].join('\n');
    case 'tests':
      return [
        'Próxima suíte deve cobrir as funções exportadas e os ramos de erro.',
        ...findings,
      ].join('\n');
    case 'codegen':
      return ['Pontos que um patch deve tocar:', ...findings].join('\n');
    case 'git':
    case 'ci':
      return 'GitHub ainda responde pelo motor local. A fase seguinte executa gh e git com allowlist, no workspace real.';
    case 'review':
      return [
        'Perguntas de desenho para o handoff:',
        '- O contrato público precisa de clock skew e trilha de auditoria?',
        '- Qual empresa implementa o patch e qual só revisa?',
        ...findings,
      ].join('\n');
    default:
      return findings.join('\n');
  }
}

function outputFor(step: OrchestratorStep, ctx: LocalRunContext, prior: string): string {
  const agent = getAgent(step.agent);
  const health = healthFor(step.agent, ctx.health);
  const header = [
    `[motor local · ${agent.companyName} ${agent.name}]`,
    health.authSource === 'session'
      ? 'Sessão do grok login está ativa. Esta saída local só permanece se a chamada falhar.'
      : health.execution === 'provider-api'
        ? 'A API da empresa está configurada. Esta saída local só permanece se a chamada falhar.'
        : `Sem API nesta etapa. Variável no servidor: ${agent.envKeys.join(' ou ')}.`,
    `Tarefa: ${step.command}`,
    `Motivo: ${step.reason}`,
    `Branch: ${ctx.branch}`,
    `Arquivo: ${ctx.activeFilePath}`,
  ];
  if (prior) {
    header.push('', 'Pacote recebido do agente anterior:', prior.split('\n').slice(0, 6).join('\n'));
  }
  return [...header, '', bodyFor(step, ctx)].join('\n');
}

export function executePlanLocally(plan: OrchestratorPlan, ctx: LocalRunContext): OrchestratorRun {
  if (plan.mode === 'status') {
    return {
      plan,
      results: [],
      synthesis: formatStatus(ctx.health),
    };
  }

  const results: StepResult[] = [];
  let prior = '';
  for (const step of plan.steps) {
    const output = outputFor(step, ctx, prior);
    const result: StepResult = {
      stepId: step.id,
      agent: step.agent,
      transport: 'local-engine',
      command: step.command,
      output,
      exitCode: step.reason.startsWith('Handoff rejeitado') ? 1 : 0,
    };
    results.push(result);
    prior = output;
  }

  return {
    plan,
    results,
    synthesis: formatSynthesis(plan, results),
  };
}
