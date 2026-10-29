export type AgentId = 'grok' | 'gemini' | 'codex' | 'claude' | 'gh';

export type CompanyId = 'xai' | 'google' | 'openai' | 'anthropic' | 'github';

export type Capability =
  | 'security-audit'
  | 'architecture'
  | 'docs'
  | 'codegen'
  | 'tests'
  | 'git'
  | 'ci'
  | 'review';

export type PlanMode = 'single' | 'fanout' | 'handoff' | 'status';

export type ExecutionTransport = 'provider-api' | 'local-engine';

export interface AgentDefinition {
  id: AgentId;
  company: CompanyId;
  companyName: string;
  code: string;
  name: string;
  binary: string;
  version: string;
  specialty: string;
  defaultModel: string;
  envKeys: string[];
  capabilities: Capability[];
  routeReason: string;
}

export interface OrchestratorStep {
  id: string;
  agent: AgentId;
  capability: Capability;
  command: string;
  reason: string;
}

export interface OrchestratorPlan {
  intent: string;
  mode: PlanMode;
  primary: AgentId;
  steps: OrchestratorStep[];
}

export interface ProviderHealth {
  id: AgentId;
  company: CompanyId;
  companyName: string;
  name: string;
  code: string;
  binary: string;
  model: string;
  envKeys: string[];
  apiConfigured: boolean;
  execution: ExecutionTransport;
  authSource?: 'session' | 'env' | 'none';
}

export interface StepResult {
  stepId: string;
  agent: AgentId;
  transport: ExecutionTransport;
  command: string;
  output: string;
  exitCode: number;
}

export interface OrchestratorRun {
  plan: OrchestratorPlan;
  results: StepResult[];
  synthesis: string;
}

export interface RouteContext {
  activeFilePath?: string;
  branch?: string;
  hintAgent?: AgentId;
}

export interface LocalRunContext {
  activeFilePath: string;
  activeFileContent: string;
  branch: string;
  health: ProviderHealth[];
}
