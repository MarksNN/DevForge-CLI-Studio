import { memoryManager } from './MemoryManager';
import type { LearningEvent, MemoryRecord } from './types';

export class LearningManager {
  private memoryMgr: MemoryManager;

  constructor(memoryMgr?: MemoryManager) {
    this.memoryMgr = memoryMgr || memoryManager;
  }
  /**
   * Processa um LearningEvent emitido por um especialista,
   * aplicando a governança dos Agentes 13 (distribuição), 21 (privacidade) e 24 (auditoria).
   */
  public processLearningEvent(event: LearningEvent): MemoryRecord {
    // 1. Verificação de privacidade (Agente 21)
    const isSensitive = event.contextAllowed.includes('credential') ||
      event.contextAllowed.includes('secret') ||
      event.contextAllowed.includes('password');

    // 2. Classificação de escopo
    // Se o evento estiver restrito ao projeto, escopo é 'project'. Se for compartilhável com alta confiança, 'shared'.
    const scope = event.projectId && event.sharingRestrictions === 'project-only'
      ? 'project'
      : (event.requiresReview ? 'agent' : 'shared');

    // 3. Status de validação:
    // Se requer revisão de alto impacto (Agente 24), entra como 'proposed'. Se verificado, 'validated'.
    const status = event.requiresReview ? 'proposed' : 'validated';

    const memory = this.memoryMgr.createMemory({
      scope,
      owner_id: `agent_${event.originAgentId}`,
      agent_id: event.originAgentId,
      project_id: event.projectId,
      type: 'lesson',
      content: `[Lição Reutilizável]: ${event.reusableLesson} | Contexto: ${event.problem} -> Solução: ${event.solutionApplied}`,
      source_type: 'observation',
      source_reference: `Execution event from agent ${event.originAgentId}`,
      confidence: event.confidenceScore,
      status,
      expires_at: null,
      sensitive: isSensitive,
      approved_for_sharing: !isSensitive && !event.requiresReview,
    });

    return memory;
  }

  /**
   * Registra preferência declarada ou correção direta fornecida pelo usuário (M1)
   */
  public recordUserPreference(options: {
    content: string;
    projectId?: string | null;
    agentId?: string;
  }): MemoryRecord {
    return this.memoryMgr.createMemory({
      scope: options.projectId ? 'project' : 'user',
      owner_id: 'user_master',
      agent_id: options.agentId || '00',
      project_id: options.projectId || null,
      type: 'preference',
      content: options.content,
      source_type: 'user_feedback',
      source_reference: 'Interação direta no chatbook',
      confidence: 1.0,
      status: 'validated',
      expires_at: null,
      sensitive: false,
      approved_for_sharing: false,
    });
  }
}

export const learningManager = new LearningManager();
