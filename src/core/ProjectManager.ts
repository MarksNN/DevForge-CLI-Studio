import fs from 'fs';
import path from 'path';
import type { ProjectDescriptor } from './types';

export class ProjectManager {
  private projects: Map<string, ProjectDescriptor> = new Map();
  private activeProjectId: string = 'devforge-default';

  constructor() {
    this.initDefaults();
  }

  private initDefaults(): void {
    const rootDir = process.cwd();
    this.projects.set('devforge-default', {
      id: 'devforge-default',
      name: 'DevForge CLI Studio',
      rootPath: rootDir,
      description: 'Plataforma Universal de Agentes e Estúdio de Linha de Comando',
      stack: ['TypeScript', 'Vite', 'React', 'Express', 'Tailwind'],
      isolatedMemoriesCount: 0,
      active: true,
    });
  }

  public getActiveProject(): ProjectDescriptor {
    return this.projects.get(this.activeProjectId) || Array.from(this.projects.values())[0];
  }

  public setActiveProject(id: string): boolean {
    if (this.projects.has(id)) {
      for (const p of this.projects.values()) {
        p.active = p.id === id;
      }
      this.activeProjectId = id;
      return true;
    }
    return false;
  }

  public listProjects(): ProjectDescriptor[] {
    return Array.from(this.projects.values());
  }

  public registerProject(project: Omit<ProjectDescriptor, 'isolatedMemoriesCount' | 'active'>): ProjectDescriptor {
    const newProj: ProjectDescriptor = {
      ...project,
      isolatedMemoriesCount: 0,
      active: false,
    };
    this.projects.set(project.id, newProj);
    return newProj;
  }
}

export const projectManager = new ProjectManager();
