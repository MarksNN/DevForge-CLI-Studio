export type MemoryScope = 'user' | 'agent' | 'shared' | 'project' | 'task';
export type MemoryType = 'preference' | 'lesson' | 'decision' | 'fact' | 'skill';
export type MemoryStatus = 'proposed' | 'validated' | 'rejected' | 'expired';
export type SourceType = 'user_feedback' | 'test' | 'audit' | 'observation';

export interface MemoryRecord {
  memory_id: string;
  scope: MemoryScope;
  owner_id: string; // user, agent NN, project ID
  agent_id: string; // "00".."25", "01A", "06A", "08A"
  project_id: string | null;
  type: MemoryType;
  content: string;
  source_type: SourceType;
  source_reference: string;
  confidence: number;
  status: MemoryStatus;
  created_at: string;
  updated_at: string;
  expires_at: string | null;
  version: number;
  sensitive: boolean;
  approved_for_sharing: boolean;
  history?: Array<{
    version: number;
    content: string;
    updated_at: string;
    reason?: string;
  }>;
}

export interface LearningEvent {
  originAgentId: string;
  specialty: string;
  projectId: string | null;
  problem: string;
  contextAllowed: string;
  hypothesis: string;
  solutionApplied: string;
  testsPerformed: string;
  observedResult: string;
  reusableLesson: string;
  confidenceScore: number;
  interestedAgentIds: string[];
  sharingRestrictions?: string;
  requiresReview: boolean;
}

export type CliVerificationStatus = 'PRONTO' | 'LIMITADO' | 'INDISPONÍVEL' | 'NÃO VERIFICADO';

export interface AgentDescriptor {
  id: string;
  persona: string;
  name: string;
  role: string;
  specialty: string;
  primaryCli: string;
  intendedModel: string;
  fallbackCli?: string;
  promptFile: string;
  cliStatus: CliVerificationStatus;
  currentMission?: string;
  approvalRate?: number | null;
  totalExecutions: number;
  learnedLessonsCount: number;
  lastExecutionAt?: string;
}

export type AuditDecision = 'APROVADO' | 'REPROVADO' | 'BLOQUEADO';

export interface AuditReport {
  auditId: string;
  taskId: string;
  auditorAgentId: '24';
  auditedAgentId: string;
  decision: AuditDecision;
  findings: string[];
  evidenceVerified: boolean;
  riskAssessment: string;
  pendingItems: string[];
  timestamp: string;
}

export interface UniversalTask {
  task_id: string;
  project_id: string;
  agent_id: string;
  objective: string;
  context_references: string[];
  allowed_paths: string[];
  permissions: string[];
  dependencies: string[];
  expected_artifacts: string[];
  acceptance_criteria: string[];
  timeout_seconds: number | null;
  budget_limit: number | null;
  review_required: boolean;
  status: 'PENDENTE' | 'EXECUTANDO' | 'EM_TESTE' | 'EM_REVISAO' | 'APROVADO' | 'REPROVADO' | 'BLOQUEADO';
  created_at: string;
  completed_at?: string;
  evidence?: string[];
  auditReport?: AuditReport;
}

export interface ProjectDescriptor {
  id: string;
  name: string;
  rootPath: string;
  description: string;
  stack: string[];
  isolatedMemoriesCount: number;
  active: boolean;
}
