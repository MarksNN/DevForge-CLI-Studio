import fs from 'fs';
import os from 'os';
import path from 'path';
import { isSecretConfigured } from '../orchestrator/health';

export interface GrokCredential {
  token: string;
  source: 'session' | 'env';
}

export function grokAuthPath(env: Record<string, string | undefined> = process.env): string {
  if (env.GROK_AUTH_PATH?.trim()) return env.GROK_AUTH_PATH.trim();
  if (env.GROK_HOME?.trim()) return path.join(env.GROK_HOME.trim(), 'auth.json');
  return path.join(os.homedir(), '.grok', 'auth.json');
}

export function readGrokSessionToken(authPath: string, nowMs = Date.now()): string | null {
  try {
    const raw = JSON.parse(fs.readFileSync(authPath, 'utf8')) as Record<string, unknown>;
    for (const value of Object.values(raw)) {
      if (!value || typeof value !== 'object') continue;
      const entry = value as { key?: unknown; expires_at?: unknown };
      if (typeof entry.key !== 'string' || entry.key.trim().length < 20) continue;
      if (typeof entry.expires_at === 'string') {
        const expiresAt = Date.parse(entry.expires_at);
        if (!Number.isNaN(expiresAt) && expiresAt <= nowMs) continue;
      }
      return entry.key.trim();
    }
  } catch {
    return null;
  }
  return null;
}

export function resolveGrokCredential(
  env: Record<string, string | undefined> = process.env,
  authPath = grokAuthPath(env),
  nowMs = Date.now()
): GrokCredential | null {
  const session = readGrokSessionToken(authPath, nowMs);
  if (session) return { token: session, source: 'session' };
  if (isSecretConfigured(['XAI_API_KEY'], env)) {
    return { token: env.XAI_API_KEY!.trim(), source: 'env' };
  }
  return null;
}
