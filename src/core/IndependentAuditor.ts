import fs from 'fs';
import path from 'path';
import type { AuditDecision, AuditReport, UniversalTask } from './types';

export class IndependentAuditor {
  /**
   * Agente 24 — Auditor Independente (SWE-agent CLI)
   * Avalia a conformidade da tarefa, critérios de aceitação e evidências antes do parecer final.
   */
  public auditTask(task: UniversalTask): AuditReport {
    const findings: string[] = [];
    const pendingItems: string[] = [];
    let evidenceVerified = false;

    // Regra 1: O Agente 24 nunca audita o próprio trabalho se for autor
    if (task.agent_id === '24') {
      return {
        auditId: `audit_${Date.now()}`,
        taskId: task.task_id,
        auditorAgentId: '24',
        auditedAgentId: task.agent_id,
        decision: 'BLOQUEADO',
        findings: ['Conflito de interesse: Agente 24 não pode auditar trabalho de sua própria autoria.'],
        evidenceVerified: false,
        riskAssessment: 'ALTO - Violação de governança independente.',
        pendingItems: ['Delegar tarefa a outro especialista para preservar independência.'],
        timestamp: new Date().toISOString(),
      };
    }

    // Regra 2: Verificação de evidências reais (Agente 22 / Verificador de Realidade)
    if (!task.evidence || task.evidence.length === 0) {
      findings.push('Ausência de evidências reais anexadas à entrega.');
      pendingItems.push('Executar testes ou verificações factuais comprovando o resultado.');
    } else {
      evidenceVerified = true;
    }

    // Regra 3: Análise de critérios de aceite
    for (const criterion of task.acceptance_criteria) {
      if (!criterion || criterion.trim().length === 0) {
        findings.push('Critério de aceitação vazio ou vago.');
      }
    }

    // Regra 4: Verificação de arquivos modificados e restrições de permissão
    for (const filePath of task.allowed_paths) {
      if (filePath.includes('..') || path.isAbsolute(filePath)) {
        findings.push(`Caminho fora do sandbox permitido detectado: ${filePath}`);
        pendingItems.push('Restringir alterações aos diretórios autorizados do projeto.');
      }
    }

    // Determina o parecer: APROVADO, REPROVADO ou BLOQUEADO
    let decision: AuditDecision = 'APROVADO';
    let riskAssessment = 'BAIXO - Conformidade total com critérios de aceite e evidências.';

    if (findings.some(f => f.includes('fora do sandbox') || f.includes('Conflito'))) {
      decision = 'BLOQUEADO';
      riskAssessment = 'CRÍTICO - Violação de limites de permissão ou integridade.';
    } else if (findings.length > 0 || !evidenceVerified) {
      decision = 'REPROVADO';
      riskAssessment = 'MÉDIO - Falta de comprovação empírica ou critérios pendentes.';
    }

    const report: AuditReport = {
      auditId: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      taskId: task.task_id,
      auditorAgentId: '24',
      auditedAgentId: task.agent_id,
      decision,
      findings,
      evidenceVerified,
      riskAssessment,
      pendingItems,
      timestamp: new Date().toISOString(),
    };

    return report;
  }
}

export const independentAuditor = new IndependentAuditor();
