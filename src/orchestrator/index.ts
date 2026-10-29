export { formatRun, formatSynthesis } from './format';
export { applyGrokCredential, formatStatus, isSecretConfigured, probeProviderHealth } from './health';
export { executePlanLocally } from './localEngine';
export { AGENT_REGISTRY, agentByBinary, getAgent, isAgentId } from './registry';
export { buildOrchestratorPlan } from './router';
export type {
  AgentId,
  Capability,
  ExecutionTransport,
  LocalRunContext,
  OrchestratorPlan,
  OrchestratorRun,
  PlanMode,
  ProviderHealth,
  RouteContext,
  StepResult,
} from './types';
