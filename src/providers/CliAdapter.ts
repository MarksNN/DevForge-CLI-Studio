import { spawn } from 'child_process';
import type { CliVerificationStatus } from '../core/types';

export interface DiscoveryResult {
  cliId: string;
  binaryName: string;
  found: boolean;
  absolutePath?: string;
  version?: string;
}

export interface VerificationResult {
  cliId: string;
  status: CliVerificationStatus;
  message: string;
  authValid?: boolean;
}

export interface ModelDescriptor {
  id: string;
  name: string;
  family: string;
  contextLimit?: number;
}

export interface AgentExecutionRequest {
  executionId: string;
  agentId: string;
  systemPrompt: string;
  userPrompt: string;
  workingDir: string;
  timeoutMs?: number;
}

export interface AgentExecutionResult {
  executionId: string;
  agentId: string;
  cliUsed: string;
  modelUsed: string;
  exitCode: number;
  stdout: string;
  stderr: string;
  durationMs: number;
  isFallback: boolean;
}

export interface CliAdapter {
  id: string;
  binaryName: string;
  discover(): Promise<DiscoveryResult>;
  verify(): Promise<VerificationResult>;
  listModels(): Promise<ModelDescriptor[]>;
  execute(request: AgentExecutionRequest): Promise<AgentExecutionResult>;
  cancel(executionId: string): Promise<void>;
  healthCheck(): Promise<{ ok: boolean; status: CliVerificationStatus }>;
}

export abstract class BaseCliAdapter implements CliAdapter {
  public abstract id: string;
  public abstract binaryName: string;

  public async discover(): Promise<DiscoveryResult> {
    const isWindows = process.platform === 'win32';
    const checkCmd = isWindows ? 'where' : 'which';

    return new Promise((resolve) => {
      const proc = spawn(checkCmd, [this.binaryName], { shell: true });
      let output = '';
      proc.stdout.on('data', (d) => { output += d.toString(); });
      proc.on('close', (code) => {
        if (code === 0 && output.trim()) {
          const firstLine = output.trim().split(/\r?\n/)[0];
          resolve({
            cliId: this.id,
            binaryName: this.binaryName,
            found: true,
            absolutePath: firstLine,
          });
        } else {
          resolve({
            cliId: this.id,
            binaryName: this.binaryName,
            found: false,
          });
        }
      });
      proc.on('error', () => {
        resolve({
          cliId: this.id,
          binaryName: this.binaryName,
          found: false,
        });
      });
    });
  }

  public async verify(): Promise<VerificationResult> {
    const disc = await this.discover();
    if (!disc.found) {
      return {
        cliId: this.id,
        status: 'INDISPONÍVEL',
        message: `Binário "${this.binaryName}" não foi localizado no ambiente operacional.`,
        authValid: false,
      };
    }

    return {
      cliId: this.id,
      status: 'PRONTO',
      message: `Binário "${this.binaryName}" localizado em ${disc.absolutePath}`,
      authValid: true,
    };
  }

  public async listModels(): Promise<ModelDescriptor[]> {
    return [
      { id: `${this.id}-default`, name: `${this.binaryName} standard model`, family: this.id },
    ];
  }

  public async cancel(_executionId: string): Promise<void> {
    // Interrupção tratada pelo gerenciador de processos
  }

  public async healthCheck(): Promise<{ ok: boolean; status: CliVerificationStatus }> {
    const ver = await this.verify();
    return {
      ok: ver.status === 'PRONTO' || ver.status === 'LIMITADO',
      status: ver.status,
    };
  }

  public abstract execute(request: AgentExecutionRequest): Promise<AgentExecutionResult>;
}
