import { agentByBinary, complementAgent, getAgent, isAgentId } from './registry';
import type {
  AgentId,
  Capability,
  OrchestratorPlan,
  OrchestratorStep,
  RouteContext,
} from './types';

interface Signal {
  agent: AgentId;
  capability: Capability;
  words: string[];
}

const SIGNALS: Signal[] = [
  {
    agent: 'grok',
    capability: 'security-audit',
    words: ['seguranca', 'security', 'vulner', 'race', 'token', 'concorr', 'audit', 'skew', 'grok', 'xai'],
  },
  {
    agent: 'gh',
    capability: 'git',
    words: ['pull request', 'merge', 'release', 'workflow', 'github', 'commit', 'ci/cd', 'pipeline'],
  },
  {
    agent: 'codex',
    capability: 'tests',
    words: ['teste', 'testes', 'coverage', 'cobertura', 'suite', 'codex'],
  },
  {
    agent: 'codex',
    capability: 'codegen',
    words: ['patch', 'refactor', 'implement', 'codigo', 'corrig', 'openai'],
  },
  {
    agent: 'gemini',
    capability: 'docs',
    words: ['jsdoc', 'document', 'readme', 'especifica', 'gemini'],
  },
  {
    agent: 'gemini',
    capability: 'architecture',
    words: ['arquitet', 'contexto', 'explica', 'google'],
  },
  {
    agent: 'claude',
    capability: 'review',
    words: ['trade-off', 'tradeoff', 'objec', 'critica', 'claude', 'anthropic', 'desenho'],
  },
];

function normalize(text: string): string {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function tokenize(input: string): string[] {
  return input.match(/(?:[^\s"]+|"[^"]*")+/g)?.map((token) => token.replace(/^"|"$/g, '')) ?? [];
}

function wordIndex(text: string, word: string): number {
  const haystack = normalize(text);
  const needle = normalize(word);
  if (needle.length <= 4) {
    const match = new RegExp(`(?:^|[^a-z0-9])${needle}(?:[^a-z0-9]|$)`).exec(haystack);
    return match ? match.index : -1;
  }
  return haystack.indexOf(needle);
}

function detectSignals(text: string): Signal[] {
  const hits: Array<Signal & { index: number }> = [];
  for (const signal of SIGNALS) {
    let index = -1;
    for (const word of signal.words) {
      const found = wordIndex(text, word);
      if (found >= 0 && (index === -1 || found < index)) index = found;
    }
    if (index >= 0) hits.push({ ...signal, index });
  }
  hits.sort((a, b) => a.index - b.index);
  const unique: Signal[] = [];
  for (const hit of hits) {
    if (!unique.some((item) => item.agent === hit.agent)) {
      unique.push({ agent: hit.agent, capability: hit.capability, words: hit.words });
    }
  }
  return unique.slice(0, 3);
}

function fileFrom(args: string[], fallback: string): string {
  return args.find((arg) => !arg.startsWith('-') && (arg.includes('/') || arg.includes('.'))) || fallback;
}

function capabilityForCommand(agent: AgentId, subcommand: string): Capability {
  if (subcommand === 'docs' || subcommand === 'explain') return subcommand === 'explain' ? 'architecture' : 'docs';
  if (subcommand === 'test' || subcommand === 'synthesize-test' || subcommand === 'coverage') return 'tests';
  if (subcommand === 'analyze' || subcommand === 'audit') return 'security-audit';
  if (subcommand === 'pr' || subcommand === 'workflow' || subcommand === 'release') return 'git';
  if (subcommand === 'review') return 'review';
  if (subcommand === 'patch') return 'codegen';
  return getAgent(agent).capabilities[0];
}

function commandFor(agent: AgentId, capability: Capability, file: string): string {
  const binary = getAgent(agent).binary;
  switch (capability) {
    case 'security-audit':
      return `${binary} analyze ${file} --security`;
    case 'docs':
      return `${binary} docs ${file} --write-jsdoc`;
    case 'architecture':
      return `${binary} explain ${file} --architecture`;
    case 'tests':
      return `${binary} test ${file} --coverage`;
    case 'codegen':
      return `${binary} patch ${file} --apply-fixes`;
    case 'git':
      return `${binary} pr list --state open`;
    case 'ci':
      return `${binary} workflow run ci-pipeline.yml`;
    case 'review':
      return `${binary} review ${file} --design`;
    default:
      return `${binary} ask --file ${file}`;
  }
}

function makeStep(agent: AgentId, capability: Capability, command: string, reason: string, index: number): OrchestratorStep {
  return {
    id: `step-${index + 1}`,
    agent,
    capability,
    command,
    reason,
  };
}

function statusPlan(intent: string): OrchestratorPlan {
  return {
    intent,
    mode: 'status',
    primary: 'grok',
    steps: [],
  };
}

function planFromSignals(
  intent: string,
  file: string,
  signals: Signal[],
  mode: 'single' | 'fanout'
): OrchestratorPlan {
  const selected = mode === 'single' ? signals.slice(0, 1) : signals;
  const working = [...selected];
  if (mode === 'fanout' && working.length === 1) {
    const extra = complementAgent(working[0].agent);
    working.push({
      agent: extra,
      capability: getAgent(extra).capabilities[0],
      words: [],
    });
  }
  if (working.length === 0) {
    working.push({
      agent: 'grok',
      capability: 'security-audit',
      words: [],
    });
  }
  const steps = working.map((signal, index) =>
    makeStep(
      signal.agent,
      signal.capability,
      commandFor(signal.agent, signal.capability, file),
      index === 0
        ? getAgent(signal.agent).routeReason
        : `Handoff após ${getAgent(working[0].agent).companyName}: ${getAgent(signal.agent).routeReason}`,
      index
    )
  );
  return {
    intent,
    mode: steps.length > 1 ? 'fanout' : 'single',
    primary: steps[0].agent,
    steps,
  };
}

function classify(
  intent: string,
  file: string,
  forceFanout: boolean,
  allowAutoFanout: boolean
): OrchestratorPlan {
  const signals = detectSignals(intent);
  const fanout = forceFanout || (allowAutoFanout && signals.length > 1);
  return planFromSignals(intent, file, signals, fanout ? 'fanout' : 'single');
}

function hintedPlan(agent: AgentId, intent: string, file: string): OrchestratorPlan {
  const capability = getAgent(agent).capabilities[0];
  return {
    intent,
    mode: 'single',
    primary: agent,
    steps: [
      makeStep(
        agent,
        capability,
        `${getAgent(agent).binary} ask --file ${file}`,
        `Pedido direto para ${getAgent(agent).companyName}. ${intent}`,
        0
      ),
    ],
  };
}

export function buildOrchestratorPlan(rawInput: string, ctx: RouteContext = {}): OrchestratorPlan {
  const input = rawInput.trim();
  const file = ctx.activeFilePath || 'src/core/orderProcessor.ts';
  if (!input) return statusPlan('devforge status');

  const tokens = tokenize(input);
  const binary = (tokens[0] || '').toLowerCase();

  if (binary === 'devforge') {
    const sub = (tokens[1] || 'status').toLowerCase();
    const restTokens = tokens.slice(2);
    const rest = restTokens.join(' ').trim();
    if (sub === 'status' || sub === 'agents' || !tokens[1]) return statusPlan(input);
    if (sub === 'handoff') {
      const from = (restTokens[0] || '').toLowerCase();
      const to = (restTokens[1] || '').toLowerCase();
      const note = restTokens.slice(2).join(' ').trim() || 'Sem nota de handoff.';
      if (!isAgentId(from) || !isAgentId(to)) {
        return {
          intent: input,
          mode: 'handoff',
          primary: 'grok',
          steps: [
            makeStep(
              'grok',
              'review',
              input,
              'Handoff rejeitado: origem e destino precisam ser grok, gemini, codex, claude ou gh.',
              0
            ),
          ],
        };
      }
      return {
        intent: input,
        mode: 'handoff',
        primary: from,
        steps: [
          makeStep(from, getAgent(from).capabilities[0], `${from} handoff-out`, `Origem ${getAgent(from).companyName} prepara o pacote.`, 0),
          makeStep(to, getAgent(to).capabilities[0], `${to} handoff-in`, note, 1),
        ],
      };
    }
    if (sub === 'route') return classify(rest || input, file, false, false);
    if (sub === 'fanout') return classify(rest || input, file, true, true);
    if (sub === 'run') return classify(rest || input, file, false, true);
    return classify([sub, rest].filter(Boolean).join(' '), file, false, true);
  }

  const direct = agentByBinary(binary);
  if (direct) {
    const subcommand = (tokens[1] || '').toLowerCase();
    const capability = capabilityForCommand(direct.id, subcommand);
    return {
      intent: input,
      mode: 'single',
      primary: direct.id,
      steps: [
        makeStep(
          direct.id,
          capability,
          input,
          `${getAgent(direct.id).companyName} recebeu o comando direto \`${direct.binary} ${subcommand}\`.`,
          0
        ),
      ],
    };
  }

  if (ctx.hintAgent) return hintedPlan(ctx.hintAgent, input, fileFrom(tokens, file));
  return classify(input, fileFrom(tokens, file), false, true);
}
