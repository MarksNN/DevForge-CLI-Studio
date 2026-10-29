import test from 'node:test';
import assert from 'node:assert/strict';
import { executeOrchestrator } from './executeOrchestrator';

test('devforge status keeps the company list after enrichment', async () => {
  const run = await executeOrchestrator({
    input: 'devforge status',
    activeFilePath: 'src/auth/tokenGuard.ts',
    branch: 'feat/cli-orchestrator',
  });
  assert.equal(run.plan.mode, 'status');
  assert.match(run.synthesis, /Agentes sob o plano de controle DevForge/);
  assert.match(run.synthesis, /xAI/);
  assert.match(run.synthesis, /Anthropic/);
  assert.equal(run.results.length, 0);
});
