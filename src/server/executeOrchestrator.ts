import {
  applyGrokCredential,
  buildOrchestratorPlan,
  executePlanLocally,
  isAgentId,
  probeProviderHealth,
} from '../orchestrator';
import type { AgentId, OrchestratorRun, ProviderHealth } from '../orchestrator';
import { enrichRunWithApis } from './providerApis';
import { resolveGrokCredential } from './grokSession';

export function currentProviderHealth(): ProviderHealth[] {
  const credential = resolveGrokCredential();
  return applyGrokCredential(probeProviderHealth(), credential?.source ?? null);
}

export interface OrchestratorRequest {
  input: string;
  hintAgent?: AgentId;
  activeFilePath?: string;
  activeFileContent?: string;
  branch?: string;
}

export async function executeOrchestrator(request: OrchestratorRequest): Promise<OrchestratorRun> {
  const activeFilePath = request.activeFilePath?.trim() || 'src/core/orderProcessor.ts';
  const branch = request.branch?.trim() || 'main';
  const plan = buildOrchestratorPlan(request.input, {
    activeFilePath,
    branch,
    hintAgent: request.hintAgent,
  });
  const local = executePlanLocally(plan, {
    activeFilePath,
    activeFileContent: request.activeFileContent ?? '',
    branch,
    health: currentProviderHealth(),
  });
  return enrichRunWithApis(local, {
    activeFilePath,
    activeFileContent: request.activeFileContent ?? '',
    branch,
  });
}

export function readHintAgent(value: unknown): AgentId | undefined {
  return isAgentId(value) ? value : undefined;
}
