import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { readGrokSessionToken, resolveGrokCredential } from './grokSession';
import { applyGrokCredential, formatStatus, probeProviderHealth } from '../orchestrator/health';

test('reads a live Grok session and ignores an expired one', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'devforge-grok-'));
  const authPath = path.join(dir, 'auth.json');
  const token = 'session-token-que-nao-pode-vazar';
  fs.writeFileSync(
    authPath,
    JSON.stringify({
      'https://auth.x.ai::test': {
        key: token,
        expires_at: '2099-01-01T00:00:00.000Z',
      },
    })
  );

  assert.equal(readGrokSessionToken(authPath, Date.parse('2026-10-28T00:00:00Z')), token);
  assert.equal(readGrokSessionToken(authPath, Date.parse('2100-01-01T00:00:00Z')), null);

  const credential = resolveGrokCredential({}, authPath, Date.parse('2026-10-28T00:00:00Z'));
  assert.equal(credential?.source, 'session');
  const status = formatStatus(applyGrokCredential(probeProviderHealth({}), credential?.source ?? null));
  assert.match(status, /sessão Grok pronta/);
  assert.equal(status.includes(token), false);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('falls back to XAI_API_KEY when the session file is missing', () => {
  const missing = path.join(os.tmpdir(), 'devforge-grok-missing', 'auth.json');
  const credential = resolveGrokCredential({ XAI_API_KEY: 'xai-test-key' }, missing);
  assert.equal(credential?.source, 'env');
  assert.equal(credential?.token, 'xai-test-key');
});
