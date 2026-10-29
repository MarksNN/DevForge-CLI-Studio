import { AGENT_REGISTRY, getAgent } from './registry';
import type { AgentId, ProviderHealth } from './types';

const PLACEHOLDER_MARKERS = ['MY_', 'your_api_key', 'changeme'];

export function isSecretConfigured(
  keys: string[],
  env: Record<string, string | undefined>
): boolean {
  return keys.some((key) => {
    const value = env[key]?.trim();
    if (!value) return false;
    const upper = value.toUpperCase();
    return !PLACEHOLDER_MARKERS.some((marker) => upper.includes(marker.toUpperCase()));
  });
}

export function probeProviderHealth(
  env: Record<string, string | undefined> = process.env
): ProviderHealth[] {
  return AGENT_REGISTRY.map((agent) => {
    const apiConfigured = isSecretConfigured(agent.envKeys, env);
    const modelEnv: Record<AgentId, string | undefined> = {
      grok: env.XAI_MODEL,
      gemini: env.GEMINI_MODEL,
      codex: env.OPENAI_MODEL,
      claude: env.ANTHROPIC_MODEL,
      gh: undefined,
    };
    const execution =
      agent.id !== 'gh' && apiConfigured ? 'provider-api' : 'local-engine';
    return {
      id: agent.id,
      company: agent.company,
      companyName: agent.companyName,
      name: agent.name,
      code: agent.code,
      binary: agent.binary,
      model: modelEnv[agent.id]?.trim() || agent.defaultModel,
      envKeys: agent.envKeys,
      apiConfigured,
      execution,
    };
  });
}

export function healthFor(
  id: AgentId,
  health: ProviderHealth[]
): ProviderHealth {
  return (
    health.find((item) => item.id === id) ?? {
      ...(() => {
        const agent = getAgent(id);
        return {
          id: agent.id,
          company: agent.company,
          companyName: agent.companyName,
          name: agent.name,
          code: agent.code,
          binary: agent.binary,
          model: agent.defaultModel,
          envKeys: agent.envKeys,
          apiConfigured: false,
          execution: 'local-engine' as const,
        };
      })(),
    }
  );
}

export function applyGrokCredential(
  health: ProviderHealth[],
  source: 'session' | 'env' | null
): ProviderHealth[] {
  return health.map((item) => {
    if (item.id !== 'grok') return item;
    if (!source) return { ...item, authSource: 'none' };
    return {
      ...item,
      apiConfigured: true,
      execution: 'provider-api',
      authSource: source,
    };
  });
}

export function formatStatus(health: ProviderHealth[]): string {
  const lines = health.map((item) => {
    const mode =
      item.authSource === 'session'
        ? `sessão Grok pronta · ${item.model}`
        : item.execution === 'provider-api'
          ? `API pronta · ${item.model}`
          : item.apiConfigured
            ? 'credencial presente · execução ainda no motor local'
            : `motor local · defina ${item.envKeys.join(' ou ')} no servidor`;
    return `${item.code} ${item.companyName} ${item.name} (${item.binary}) — ${mode}`;
  });
  return ['Agentes sob o plano de controle DevForge:', ...lines].join('\n');
}
