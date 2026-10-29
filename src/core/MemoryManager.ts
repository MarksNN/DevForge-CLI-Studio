import fs from 'fs';
import path from 'path';
import type { MemoryRecord, MemoryScope } from './types';

export class MemoryManager {
  private storagePath: string;
  private memories: Map<string, MemoryRecord> = new Map();

  constructor(customPath?: string) {
    this.storagePath = customPath || path.resolve(process.cwd(), 'data', 'memory_store.json');
    this.loadFromDisk();
  }

  private loadFromDisk(): void {
    try {
      if (fs.existsSync(this.storagePath)) {
        const raw = fs.readFileSync(this.storagePath, 'utf8');
        const list: MemoryRecord[] = JSON.parse(raw);
        this.memories.clear();
        for (const item of list) {
          this.memories.set(item.memory_id, item);
        }
      }
    } catch (err) {
      console.warn('[MemoryManager] Failed to read memory storage from disk:', err);
    }
  }

  private persistToDisk(): void {
    try {
      const dir = path.dirname(this.storagePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const data = Array.from(this.memories.values());
      fs.writeFileSync(this.storagePath, JSON.stringify(data, null, 2), 'utf8');
    } catch (err) {
      console.error('[MemoryManager] Failed to persist memory to disk:', err);
    }
  }

  public createMemory(data: Omit<MemoryRecord, 'memory_id' | 'created_at' | 'updated_at' | 'version'>): MemoryRecord {
    const memory_id = `mem_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const record: MemoryRecord = {
      ...data,
      memory_id,
      created_at: now,
      updated_at: now,
      version: 1,
      history: [
        {
          version: 1,
          content: data.content,
          updated_at: now,
          reason: 'Initial creation',
        },
      ],
    };

    this.memories.set(memory_id, record);
    this.persistToDisk();
    return record;
  }

  public updateMemory(memory_id: string, newContent: string, reason?: string): MemoryRecord | null {
    const existing = this.memories.get(memory_id);
    if (!existing) return null;

    const now = new Date().toISOString();
    const nextVersion = existing.version + 1;
    const history = existing.history || [];
    history.push({
      version: nextVersion,
      content: newContent,
      updated_at: now,
      reason: reason || 'Updated by user or learning agent',
    });

    const updated: MemoryRecord = {
      ...existing,
      content: newContent,
      version: nextVersion,
      updated_at: now,
      history,
    };

    this.memories.set(memory_id, updated);
    this.persistToDisk();
    return updated;
  }

  public deleteMemory(memory_id: string): boolean {
    const existed = this.memories.delete(memory_id);
    if (existed) {
      this.persistToDisk();
    }
    return existed;
  }

  public getMemory(memory_id: string): MemoryRecord | null {
    return this.memories.get(memory_id) || null;
  }

  /**
   * Recupera memórias respeitando rigorosamente o isolamento de projeto.
   * Não transfere dados de um projeto para outro.
   */
  public query(options: {
    scope?: MemoryScope;
    agent_id?: string;
    project_id?: string | null;
    queryText?: string;
    approvedOnly?: boolean;
  }): MemoryRecord[] {
    const results: MemoryRecord[] = [];
    const query = options.queryText?.toLowerCase();

    for (const record of this.memories.values()) {
      // Filtragem por status
      if (record.status === 'rejected' || record.status === 'expired') {
        continue;
      }

      // Regra de Isolamento de Projeto M4:
      // Se a consulta especifica um project_id, só aceita memórias daquele projeto OU memórias globais/compartilhadas sem project_id.
      // Se for de outro projeto, é estritamente ignorado.
      if (options.project_id !== undefined && record.project_id !== null && record.project_id !== options.project_id) {
        continue;
      }

      // Filtragem por escopo
      if (options.scope && record.scope !== options.scope) {
        continue;
      }

      // Filtragem por agente
      if (options.agent_id && record.agent_id !== options.agent_id) {
        continue;
      }

      // Se exigir apenas memórias aprovadas para compartilhamento quando for escopo compartilhado
      if (options.approvedOnly && !record.approved_for_sharing && record.scope === 'shared') {
        continue;
      }

      // Busca textual no conteúdo
      if (query && !record.content.toLowerCase().includes(query)) {
        continue;
      }

      results.push(record);
    }

    return results;
  }

  public getAll(): MemoryRecord[] {
    return Array.from(this.memories.values());
  }

  public clearAll(): void {
    this.memories.clear();
    this.persistToDisk();
  }
}

export const memoryManager = new MemoryManager();
