import test from 'node:test';
import assert from 'node:assert/strict';
import { buildOrchestratorPlan } from './router';
import { executePlanLocally } from './localEngine';
import { probeProviderHealth } from './health';
import { formatRun } from './format';

const health = probeProviderHealth({});
const file = 'src/auth/tokenGuard.ts';
const content = `export function verifyCliSessionToken() {\n  // TODO: add clock skew\n  return true;\n}\n`;

test('direct grok command stays on xAI and does not fan out', () => {
  const plan = buildOrchestratorPlan('grok analyze src/auth/tokenGuard.ts --security');
  assert.equal(plan.mode, 'single');
  assert.equal(plan.primary, 'grok');
  assert.equal(plan.steps.length, 1);
  assert.equal(plan.steps[0].command, 'grok analyze src/auth/tokenGuard.ts --security');
  assert.equal(plan.steps[0].capability, 'security-audit');
});

test('free text routes to the companies named by the work, in mention order', () => {
  const plan = buildOrchestratorPlan(
    'Documente o módulo e gere testes antes do pull request',
    { activeFilePath: file }
  );
  assert.equal(plan.mode, 'fanout');
  assert.deepEqual(
    plan.steps.map((step) => step.agent),
    ['gemini', 'codex', 'gh']
  );
  assert.match(plan.steps[0].command, /gemini docs src\/auth\/tokenGuard\.ts/);
  assert.match(plan.steps[2].command, /gh pr list/);
});

test('devforge fanout adds a complement when only one company matches', () => {
  const plan = buildOrchestratorPlan('devforge fanout auditar token e race no tokenGuard', {
    activeFilePath: file,
  });
  assert.equal(plan.primary, 'grok');
  assert.deepEqual(
    plan.steps.map((step) => step.agent),
    ['grok', 'claude']
  );
});

test('devforge route keeps a single primary', () => {
  const plan = buildOrchestratorPlan('devforge route documentar o contrato e gerar testes', {
    activeFilePath: file,
  });
  assert.equal(plan.mode, 'single');
  assert.equal(plan.primary, 'gemini');
  assert.equal(plan.steps.length, 1);
});

test('devforge handoff builds a two-step package and rejects unknown agents', () => {
  const plan = buildOrchestratorPlan(
    'devforge handoff grok claude revisar o achado de clock skew'
  );
  assert.equal(plan.mode, 'handoff');
  assert.equal(plan.primary, 'grok');
  assert.equal(plan.steps[1].agent, 'claude');
  assert.match(plan.steps[1].reason, /clock skew/);

  const rejected = buildOrchestratorPlan('devforge handoff grok cursor nada');
  const run = executePlanLocally(rejected, {
    activeFilePath: file,
    activeFileContent: content,
    branch: 'feat/cli-orchestrator',
    health,
  });
  assert.equal(run.results[0].exitCode, 1);
  assert.match(run.results[0].output, /Handoff rejeitado/);
});

test('devforge status lists every company and never prints secret values', () => {
  const plan = buildOrchestratorPlan('devforge status');
  const run = executePlanLocally(plan, {
    activeFilePath: file,
    activeFileContent: content,
    branch: 'main',
    health: probeProviderHealth({
      XAI_API_KEY: 'super-secret-value',
      GEMINI_API_KEY: 'MY_GEMINI_API_KEY',
    }),
  });
  assert.equal(plan.mode, 'status');
  assert.equal(run.results.length, 0);
  assert.match(run.synthesis, /xAI/);
  assert.match(run.synthesis, /Google/);
  assert.match(run.synthesis, /OpenAI/);
  assert.match(run.synthesis, /Anthropic/);
  assert.match(run.synthesis, /GitHub/);
  assert.equal(run.synthesis.includes('super-secret-value'), false);
  assert.match(run.synthesis, /API pronta/);
  assert.match(formatRun(run), /Agentes sob o plano de controle/);
});

test('hinted chat lands on the requested company', () => {
  const plan = buildOrchestratorPlan('explique o risco deste arquivo', {
    hintAgent: 'claude',
    activeFilePath: file,
  });
  assert.equal(plan.primary, 'claude');
  assert.equal(plan.steps.length, 1);
  assert.match(plan.steps[0].command, /^claude ask/);
});

test('placeholder keys do not count as configured', () => {
  const probed = probeProviderHealth({
    GEMINI_API_KEY: 'MY_GEMINI_API_KEY',
    OPENAI_API_KEY: 'your_api_key',
    ANTHROPIC_API_KEY: 'sk-ant-real',
  });
  assert.equal(probed.find((item) => item.id === 'gemini')?.apiConfigured, false);
  assert.equal(probed.find((item) => item.id === 'codex')?.apiConfigured, false);
  assert.equal(probed.find((item) => item.id === 'claude')?.execution, 'provider-api');
  assert.equal(probed.find((item) => item.id === 'gh')?.execution, 'local-engine');
});
