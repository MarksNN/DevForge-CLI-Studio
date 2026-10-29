import type { AgentDefinition, AgentId } from './types';

export const AGENT_REGISTRY: AgentDefinition[] = [
  {
    id: 'grok',
    company: 'xai',
    companyName: 'xAI',
    code: '1.1',
    name: 'Grok',
    binary: 'grok',
    version: 'grok-4.7',
    specialty: 'Diagnóstico, segurança, concorrência e causa-raiz',
    defaultModel: 'grok-4.7',
    envKeys: ['XAI_API_KEY'],
    capabilities: ['security-audit', 'review'],
    routeReason: 'xAI cobre falha, risco e diagnóstico.',
  },
  {
    id: 'gemini',
    company: 'google',
    companyName: 'Google',
    code: '1.2',
    name: 'Gemini',
    binary: 'gemini',
    version: 'gemini-3.8-flash',
    specialty: 'Contexto amplo, documentação e arquitetura',
    defaultModel: 'gemini-3.8-flash',
    envKeys: ['GEMINI_API_KEY'],
    capabilities: ['docs', 'architecture', 'review'],
    routeReason: 'Google cobre documentação, contexto longo e arquitetura.',
  },
  {
    id: 'codex',
    company: 'openai',
    companyName: 'OpenAI',
    code: '1.3',
    name: 'Codex',
    binary: 'codex',
    version: 'codex',
    specialty: 'Implementação, patches e testes',
    defaultModel: 'gpt-4.1',
    envKeys: ['OPENAI_API_KEY'],
    capabilities: ['codegen', 'tests'],
    routeReason: 'OpenAI cobre geração de código e testes.',
  },
  {
    id: 'claude',
    company: 'anthropic',
    companyName: 'Anthropic',
    code: '1.5',
    name: 'Claude',
    binary: 'claude',
    version: 'claude-sonnet-4-5',
    specialty: 'Revisão de desenho, trade-offs e objeções',
    defaultModel: 'claude-sonnet-4-5',
    envKeys: ['ANTHROPIC_API_KEY'],
    capabilities: ['review', 'architecture'],
    routeReason: 'Anthropic cobre crítica de desenho e trade-offs.',
  },
  {
    id: 'gh',
    company: 'github',
    companyName: 'GitHub',
    code: '1.4',
    name: 'GitHub CLI',
    binary: 'gh',
    version: 'gh',
    specialty: 'Pull requests, merges, releases e CI',
    defaultModel: 'gh',
    envKeys: ['GH_TOKEN', 'GITHUB_TOKEN'],
    capabilities: ['git', 'ci'],
    routeReason: 'GitHub cobre a entrega: PR, merge e CI.',
  },
];

const COMPLEMENT: Record<AgentId, AgentId> = {
  grok: 'claude',
  gemini: 'codex',
  codex: 'grok',
  claude: 'codex',
  gh: 'gemini',
};

export function getAgent(id: AgentId): AgentDefinition {
  const agent = AGENT_REGISTRY.find((item) => item.id === id);
  if (!agent) {
    throw new Error(`Unknown agent: ${id}`);
  }
  return agent;
}

export function isAgentId(value: unknown): value is AgentId {
  return typeof value === 'string' && AGENT_REGISTRY.some((item) => item.id === value);
}

export function agentByBinary(binary: string): AgentDefinition | undefined {
  const normalized = binary.toLowerCase();
  return AGENT_REGISTRY.find((item) => item.binary === normalized);
}

export function complementAgent(id: AgentId): AgentId {
  return COMPLEMENT[id];
}
