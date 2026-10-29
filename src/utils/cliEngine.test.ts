import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseCliCommand,
  applyDependencyToPackageJson,
  analyzeCodeLocally,
  injectJsDocHeaders,
  createInitialWorkspaceState,
  computeLineDiff,
  synthesizeUnitTestForFile,
  getCliAutocompleteSuggestions,
  searchGlobalWorkspace,
  computeCliExecutionStage,
} from './cliEngine';

test('parseCliCommand routes grok, gemini, codex and gh commands accurately', () => {
  const grokCmd = parseCliCommand('grok analyze src/auth/tokenGuard.ts --security');
  assert.equal(grokCmd.provider, 'grok');
  assert.equal(grokCmd.binary, 'grok');
  assert.equal(grokCmd.subcommand, 'analyze');
  assert.deepEqual(grokCmd.args, ['src/auth/tokenGuard.ts', '--security']);

  const geminiCmd = parseCliCommand('gemini docs src/core/orderProcessor.ts');
  assert.equal(geminiCmd.provider, 'gemini');
  assert.equal(geminiCmd.subcommand, 'docs');

  const codexCmd = parseCliCommand('codex test --coverage');
  assert.equal(codexCmd.provider, 'codex');
  assert.equal(codexCmd.subcommand, 'test');

  const ghCmd = parseCliCommand('gh pr create --title "feat: new cli"');
  assert.equal(ghCmd.provider, 'gh');
  assert.equal(ghCmd.subcommand, 'pr');
  assert.deepEqual(ghCmd.args, ['create', '--title', 'feat: new cli']);

  const claudeCmd = parseCliCommand('claude review src/auth/tokenGuard.ts --design');
  assert.equal(claudeCmd.provider, 'claude');
  assert.equal(claudeCmd.subcommand, 'review');

  const forgeCmd = parseCliCommand('devforge fanout auditar token');
  assert.equal(forgeCmd.provider, 'system');
  assert.equal(forgeCmd.binary, 'devforge');
  assert.equal(forgeCmd.subcommand, 'fanout');
});

test('applyDependencyToPackageJson adds dependencies and preserves valid JSON', () => {
  const state = createInitialWorkspaceState();
  const pkgFile = state.files.find((f) => f.path === 'package.json')!;
  const { updatedContent, pkgName, pkgVersion } = applyDependencyToPackageJson(
    pkgFile.content,
    'redis@4.7.0',
    false
  );

  assert.equal(pkgName, 'redis');
  assert.equal(pkgVersion, '^4.7.0');
  const parsed = JSON.parse(updatedContent);
  assert.equal(parsed.dependencies.redis, '^4.7.0');
  assert.equal(parsed.dependencies.zod, '^3.24.2');
});

test('analyzeCodeLocally detects missing JSDoc and TODO comments', () => {
  const state = createInitialWorkspaceState();
  const authFile = state.files.find((f) => f.path === 'src/auth/tokenGuard.ts')!;
  const issues = analyzeCodeLocally(authFile);

  assert.ok(issues.length >= 2);
  assert.ok(issues.some((i) => i.rule === 'grok/unfinished-task'));
  assert.ok(issues.some((i) => i.rule === 'gemini/missing-jsdoc'));
});

test('injectJsDocHeaders inserts JSDoc blocks above undocumented exported functions', () => {
  const state = createInitialWorkspaceState();
  const orderFile = state.files.find((f) => f.path === 'src/core/orderProcessor.ts')!;
  const result = injectJsDocHeaders(orderFile.content, orderFile.path);

  assert.equal(result.functionsDocumented, 1);
  assert.ok(result.documentedCode.includes('* Executa a operação `processOrderBatch`'));
  assert.ok(result.documentedCode.includes('@param payload'));

  // Calling a second time should be idempotent (0 newly documented functions)
  const secondPass = injectJsDocHeaders(result.documentedCode, orderFile.path);
  assert.equal(secondPass.functionsDocumented, 0);
});

test('computeLineDiff counts added and removed lines accurately', () => {
  const before = 'const a = 1;\n// TODO: remove\nexport function run() {}';
  const after = 'const a = 1;\nconst skew = 5000;\n/** JSDoc */\nexport function run() {}';
  const diff = computeLineDiff(before, after);

  assert.equal(diff.removedCount, 1);
  assert.equal(diff.addedCount, 2);
  assert.ok(diff.lines.some((l) => l.type === 'added' && l.content.includes('skew')));
});

test('synthesizeUnitTestForFile creates passing test case and code snippet', () => {
  const state = createInitialWorkspaceState();
  const syncFile = state.files.find((f) => f.path === 'src/services/githubSync.ts')!;
  const synth = synthesizeUnitTestForFile(syncFile, state.testResults.length);

  assert.equal(synth.newTestResult.suite, 'githubSync.test.ts');
  assert.equal(synth.newTestResult.status, 'Pass');
  assert.ok(synth.generatedTestCode.includes('buildPrCommand'));
});

test('getCliAutocompleteSuggestions filters by query and returns matching commands', () => {
  const grokList = getCliAutocompleteSuggestions('grok');
  assert.ok(grokList.length >= 2);
  assert.ok(grokList.every((item) => item.provider === 'grok' || item.command.includes('grok')));

  const defaultList = getCliAutocompleteSuggestions('');
  assert.equal(defaultList.length, 6);
});

test('searchGlobalWorkspace finds matching files, tasks, and terminal logs', () => {
  const state = createInitialWorkspaceState();
  const fileHits = searchGlobalWorkspace('orderProcessor', state.files, state.tasks, state.terminalLogs);
  assert.ok(fileHits.some((item) => item.kind === 'file' && item.targetFilePath === 'src/core/orderProcessor.ts'));

  const taskHits = searchGlobalWorkspace('DEV-101', state.files, state.tasks, state.terminalLogs);
  assert.ok(taskHits.some((item) => item.kind === 'task' && item.title.includes('DEV-101')));

  const logHits = searchGlobalWorkspace('gh status', state.files, state.tasks, state.terminalLogs);
  assert.ok(logHits.some((item) => item.kind === 'log'));
});

test('computeCliExecutionStage clamps percentage and returns progressive stage labels', () => {
  const startStage = computeCliExecutionStage(15, 'grok', 'grok analyze src/auth/tokenGuard.ts');
  assert.equal(startStage.clampedPct, 15);
  assert.ok(startStage.stageLabel.includes('GROK CLI'));

  const midStage = computeCliExecutionStage(55, 'gemini', 'gemini docs');
  assert.equal(midStage.clampedPct, 55);
  assert.ok(midStage.stageLabel.includes('GEMINI CLI'));

  const doneStage = computeCliExecutionStage(110, 'gh', 'gh pr list');
  assert.equal(doneStage.clampedPct, 100);
  assert.ok(doneStage.stageLabel.includes('concluída'));
});

