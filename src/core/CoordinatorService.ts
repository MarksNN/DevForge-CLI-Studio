import { agentRegistry } from './AgentRegistry';
import { independentAuditor } from './IndependentAuditor';
import { memoryManager } from './MemoryManager';
import { projectManager } from './ProjectManager';
import type { AgentDescriptor, UniversalTask } from './types';

export interface CoordinationPlan {
  planId: string;
  projectId: string;
  userPrompt: string;
  selectedAgents: AgentDescriptor[];
  decomposedTasks: UniversalTask[];
  overallStatus: 'PLANEJADO' | 'EXECUTANDO' | 'CONCLUÍDO' | 'REPROVADO_POR_AUDITORIA';
  consolidatedResponse?: string;
  createdAt: string;
}

export class CoordinatorService {
  /**
   * Agente 00 — Coordenador Universal (Claude Code)
   * Recebe solicitações em linguagem natural, seleciona a equipe mínima necessária e orquestra a execução.
   */
  public planMission(input: string, explicitProjectId?: string): CoordinationPlan {
    const project = explicitProjectId
      ? projectManager.listProjects().find(p => p.id === explicitProjectId) || projectManager.getActiveProject()
      : projectManager.getActiveProject();

    // 1. Recuperar contexto de memórias relevantes M1 (usuário) e M4 (projeto)
    const projectMemories = memoryManager.query({
      project_id: project.id,
      approvedOnly: true,
    });
    const userPreferences = memoryManager.query({
      scope: 'user',
    });

    // 2. Classificação de intenção e seleção da menor equipe capaz (Agente 00)
    const lower = input.toLowerCase();
    const selectedAgentIds: string[] = ['00']; // Coordenador sempre lidera

    if (lower.includes('banco') || lower.includes('database') || lower.includes('schema') || lower.includes('postgres') || lower.includes('prisma')) {
      selectedAgentIds.push('01'); // Arquiteto
      selectedAgentIds.push('01A'); // Guardião de Dados
    }
    if (lower.includes('ui') || lower.includes('design') || lower.includes('layout') || lower.includes('css') || lower.includes('tela') || lower.includes('acessibilidade')) {
      selectedAgentIds.push('03'); // Designer de Experiência
    }
    if (lower.includes('api') || lower.includes('contrato') || lower.includes('endpoint') || lower.includes('swagger') || lower.includes('openapi')) {
      selectedAgentIds.push('18'); // Arquiteto de Contratos
    }
    if (lower.includes('integra') || lower.includes('webhook') || lower.includes('conector') || lower.includes('stripe')) {
      selectedAgentIds.push('06'); // Integrações
    }
    if (lower.includes('mobile') || lower.includes('android') || lower.includes('ios') || lower.includes('app')) {
      selectedAgentIds.push('09'); // Mobile
    }
    if (lower.includes('teste') || lower.includes('test') || lower.includes('qa') || lower.includes('bug')) {
      selectedAgentIds.push('08'); // Engenheiro de QA
    }
    if (lower.includes('git') || lower.includes('commit') || lower.includes('branch') || lower.includes('deploy') || lower.includes('pr')) {
      selectedAgentIds.push('08A'); // Git e Deploy
    }
    if (lower.includes('segurança') || lower.includes('vulnerabilidade') || lower.includes('secret') || lower.includes('token') || lower.includes('audit')) {
      selectedAgentIds.push('15'); // Segurança
    }
    if (lower.includes('pesquisa') || lower.includes('comparar') || lower.includes('biblioteca') || lower.includes('artigo')) {
      selectedAgentIds.push('19'); // Pesquisa Técnica
    }

    // Se nenhuma especialidade técnica específica foi acionada além de texto geral, associar 02 (Produto) e 01 (Engenharia)
    if (selectedAgentIds.length === 1) {
      selectedAgentIds.push('02');
      selectedAgentIds.push('01');
    }

    // O Agente 24 (Auditor Independente) é OBRIGATÓRIO no fluxo de entrega
    if (!selectedAgentIds.includes('24')) {
      selectedAgentIds.push('24');
    }

    const selectedAgents = selectedAgentIds
      .map(id => agentRegistry.getAgent(id))
      .filter((a): a is AgentDescriptor => Boolean(a));

    // 3. Decomposição em tarefas formais com critérios de aceitação
    const now = new Date().toISOString();
    const tasks: UniversalTask[] = selectedAgents
      .filter(a => a.id !== '00' && a.id !== '24') // Especialistas executores
      .map((agent, idx) => ({
        task_id: `task_${Date.now()}_${idx}`,
        project_id: project.id,
        agent_id: agent.id,
        objective: `Executar análise/implementação da especialidade [${agent.name}] para: ${input}`,
        context_references: [`Project: ${project.name}`, `Memories count: ${projectMemories.length + userPreferences.length}`],
        allowed_paths: ['src/', 'docs/', '.agents/'],
        permissions: ['read', 'write:scoped'],
        dependencies: idx > 0 ? [`task_${Date.now()}_${idx - 1}`] : [],
        expected_artifacts: ['código', 'relatório ou teste'],
        acceptance_criteria: [
          `Resolver requisitos de ${agent.name}`,
          'Não violar isolamento ou permissões',
          'Apresentar evidências verificáveis',
        ],
        timeout_seconds: 60,
        budget_limit: 10000,
        review_required: true,
        status: 'PENDENTE',
        created_at: now,
      }));

    return {
      planId: `plan_${Date.now()}`,
      projectId: project.id,
      userPrompt: input,
      selectedAgents,
      decomposedTasks: tasks,
      overallStatus: 'PLANEJADO',
      createdAt: now,
    };
  }

  /**
   * Executa a governança de consolidação com revisão obrigatória do Agente 24
   */
  public consolidateExecution(plan: CoordinationPlan): string {
    const auditReports = plan.decomposedTasks.map(t => independentAuditor.auditTask(t));
    const allApproved = auditReports.every(r => r.decision === 'APROVADO');

    if (!allApproved) {
      plan.overallStatus = 'REPROVADO_POR_AUDITORIA';
      const failures = auditReports.filter(r => r.decision !== 'APROVADO');
      return [
        `[COORDENADOR 00]: A missão foi submetida ao Agente 24 (Auditor Independente) e NÃO pôde ser validada.`,
        `Motivo(s) da não aprovação:`,
        ...failures.map(f => `- Agente ${f.auditedAgentId}: ${f.findings.join('; ')}`),
        `Ação: Correções devem ser executadas pelos especialistas antes de nova homologação.`,
      ].join('\n');
    }

    plan.overallStatus = 'CONCLUÍDO';
    return [
      `[COORDENADOR 00]: Missão para o projeto "${plan.projectId}" executada e homologada com sucesso.`,
      `Especialistas mobilizados: ${plan.selectedAgents.map(a => `${a.id} (${a.persona})`).join(', ')}.`,
      `Parecer do Agente 24 (Auditor Independente): APROVADO sem pendências críticas.`,
      `Memórias e evidências registradas no repositório universal.`,
    ].join('\n');
  }
}

export const coordinatorService = new CoordinatorService();
