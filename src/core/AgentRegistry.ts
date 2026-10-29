import fs from 'fs';
import path from 'path';
import type { AgentDescriptor } from './types';

export class AgentRegistry {
  private agents: Map<string, AgentDescriptor> = new Map();
  private systemCorePrompt: string = '';
  private initialized: boolean = false;

  constructor() {
    this.init();
  }

  private init(): void {
    if (this.initialized) return;

    try {
      const corePath = path.resolve(process.cwd(), '.agents', 'prompts', 'SYSTEM_CORE.md');
      if (fs.existsSync(corePath)) {
        this.systemCorePrompt = fs.readFileSync(corePath, 'utf8');
      }

      const registryPath = path.resolve(process.cwd(), '.agents', 'registry', 'agents.json');
      if (fs.existsSync(registryPath)) {
        const raw = fs.readFileSync(registryPath, 'utf8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.agents)) {
          for (const item of parsed.agents) {
            this.agents.set(item.id, {
              id: item.id,
              persona: item.persona,
              name: item.name,
              role: item.role,
              specialty: item.specialty,
              primaryCli: item.primaryCli,
              intendedModel: item.intendedModel,
              fallbackCli: item.fallbackCli || 'Gemini CLI',
              promptFile: item.promptFile,
              cliStatus: item.cliStatus || 'NÃO VERIFICADO',
              approvalRate: item.approvalRate ?? null,
              totalExecutions: item.totalExecutions || 0,
              learnedLessonsCount: item.learnedLessonsCount || 0,
            });
          }
        }
      }
      this.initialized = true;
    } catch (err) {
      console.error('[AgentRegistry] Failed to initialize agents:', err);
    }
  }

  public getAgent(id: string): AgentDescriptor | undefined {
    return this.agents.get(id);
  }

  public getAllAgents(): AgentDescriptor[] {
    return Array.from(this.agents.values());
  }

  public updateAgentStatus(id: string, updates: Partial<AgentDescriptor>): boolean {
    const existing = this.agents.get(id);
    if (!existing) return false;
    this.agents.set(id, { ...existing, ...updates });
    return true;
  }

  public getSystemCorePrompt(): string {
    return this.systemCorePrompt;
  }

  public getFullPrompt(agentId: string, projectContext?: string, taskMission?: string): string {
    const agent = this.agents.get(agentId);
    let specializedPrompt = '';

    if (agent && agent.promptFile) {
      const pPath = path.resolve(process.cwd(), agent.promptFile);
      if (fs.existsSync(pPath)) {
        specializedPrompt = fs.readFileSync(pPath, 'utf8');
      }
    }

    return [
      this.systemCorePrompt,
      '---',
      specializedPrompt,
      '---',
      projectContext ? `### CONTEXTO DO PROJETO\n${projectContext}` : '### CONTEXTO DO PROJETO\nProjeto Universal DevFlow',
      '---',
      taskMission ? `### MISSÃO ATUAL\n${taskMission}` : '### MISSÃO ATUAL\nCoordenação e execução da solicitação do usuário.',
    ].join('\n\n');
  }
}

export const agentRegistry = new AgentRegistry();
