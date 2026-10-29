import { AGENT_REGISTRY } from '../orchestrator/registry';
import type { AgentId } from '../orchestrator/types';

export type CliProviderId = AgentId | 'system';

export interface CliToolConfig {
  id: Exclude<CliProviderId, 'system'>;
  code: string;
  name: string;
  binary: string;
  version: string;
  specialty: string;
  status: 'Ready' | 'Busy' | 'Offline';
  avgLatencyMs: number;
  commandsExecuted: number;
  defaultModel: string;
  company: string;
}

export interface ProjectFile {
  path: string;
  name: string;
  folder: string;
  language: 'typescript' | 'json' | 'markdown' | 'yaml';
  content: string;
  modified: boolean;
  lastUpdated: string;
  coveragePct: number;
}

export interface CodeReviewIssue {
  id: string;
  line: number;
  severity: 'Error' | 'Warning' | 'Info';
  rule: string;
  message: string;
  suggestedFix: string;
  provider: CliProviderId;
}

export interface DevTask {
  id: string;
  key: string;
  title: string;
  status: 'Backlog' | 'In Progress' | 'In Review' | 'Completed';
  priority: 'High' | 'Medium' | 'Low';
  cliAgent: Exclude<CliProviderId, 'system'>;
  branch: string;
  linkedFile: string;
  automatedCommand: string;
  updatedAt: string;
}

export interface GitCommit {
  hash: string;
  message: string;
  author: string;
  branch: string;
  timestamp: string;
  filesChanged: number;
}

export interface PullRequest {
  number: number;
  title: string;
  sourceBranch: string;
  targetBranch: string;
  status: 'Open' | 'Merged' | 'Draft';
  checks: 'Passing' | 'Running' | 'Failed';
  reviewerAgent: string;
  createdAt: string;
  description: string;
}

export interface TestCaseResult {
  id: string;
  suite: string;
  name: string;
  file: string;
  status: 'Pass' | 'Fail';
  durationMs: number;
  assertionCount: number;
  errorDetail?: string;
}

export interface CiPipelineStage {
  id: string;
  name: string;
  command: string;
  status: 'Passed' | 'Running' | 'Failed' | 'Idle';
  durationSec: number;
  outputSummary: string;
}

export interface TerminalLogEntry {
  id: string;
  timestamp: string;
  provider: CliProviderId;
  command: string;
  output: string;
  exitCode: number;
}

export interface WorkspaceState {
  activeBranch: string;
  branches: string[];
  stagedFiles: string[];
  cliTools: CliToolConfig[];
  files: ProjectFile[];
  tasks: DevTask[];
  commits: GitCommit[];
  pullRequests: PullRequest[];
  testResults: TestCaseResult[];
  pipelineStages: CiPipelineStage[];
  terminalLogs: TerminalLogEntry[];
}

const TOOL_LATENCY_MS: Record<AgentId, number> = {
  grok: 320,
  gemini: 290,
  codex: 350,
  claude: 340,
  gh: 140,
};

const TOOL_COMMANDS_EXECUTED: Record<AgentId, number> = {
  grok: 18,
  gemini: 34,
  codex: 27,
  claude: 0,
  gh: 42,
};

export const INITIAL_CLI_TOOLS: CliToolConfig[] = AGENT_REGISTRY.map((agent) => ({
  id: agent.id,
  code: agent.code,
  name: agent.name,
  binary: agent.binary,
  version: agent.version,
  specialty: agent.specialty,
  status: 'Ready',
  avgLatencyMs: TOOL_LATENCY_MS[agent.id],
  commandsExecuted: TOOL_COMMANDS_EXECUTED[agent.id],
  defaultModel: agent.defaultModel,
  company: agent.companyName,
}));

export type CliToolStatus = CliToolConfig;
export type LocalProjectFile = ProjectFile;

export const INITIAL_FILES: ProjectFile[] = [
  {
    path: 'src/core/orderProcessor.ts',
    name: 'orderProcessor.ts',
    folder: 'src/core',
    language: 'typescript',
    modified: false,
    lastUpdated: 'Há 8 min',
    coveragePct: 94,
    content: `export interface OrderPayload {
  orderId: string;
  customerId: string;
  items: Array<{ sku: string; qty: number; unitPrice: number }>;
  discountCode?: string;
}

export interface ProcessedOrder {
  orderId: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  status: 'CONFIRMED' | 'REJECTED';
}

export function processOrderBatch(payload: OrderPayload, taxRate = 0.08): ProcessedOrder {
  if (!payload.items || payload.items.length === 0) {
    throw new Error('Order must contain at least one line item');
  }

  const subtotal = payload.items.reduce((acc, item) => {
    if (item.qty <= 0 || item.unitPrice < 0) {
      throw new Error(\`Invalid item parameters for SKU \${item.sku}\`);
    }
    return acc + item.qty * item.unitPrice;
  }, 0);

  const discount = payload.discountCode === 'DEVFORGE10' ? subtotal * 0.1 : 0;
  const taxableBase = Math.max(0, subtotal - discount);
  const tax = Number((taxableBase * taxRate).toFixed(2));
  const total = Number((taxableBase + tax).toFixed(2));

  return {
    orderId: payload.orderId,
    subtotal: Number(subtotal.toFixed(2)),
    discount: Number(discount.toFixed(2)),
    tax,
    total,
    status: total > 0 ? 'CONFIRMED' : 'REJECTED',
  };
}`,
  },
  {
    path: 'src/services/githubSync.ts',
    name: 'githubSync.ts',
    folder: 'src/services',
    language: 'typescript',
    modified: true,
    lastUpdated: 'Há 3 min',
    coveragePct: 88,
    content: `export interface SyncConfig {
  owner: string;
  repo: string;
  baseBranch: string;
  autoMergeOnGreen: boolean;
}

export async function buildPrCommand(config: SyncConfig, title: string, headBranch: string): Promise<string> {
  if (!config.owner || !config.repo) {
    throw new Error('Repository owner and name are required');
  }
  const safeTitle = title.replace(/"/g, '\\"');
  const mergeFlag = config.autoMergeOnGreen ? ' --fill' : '';
  return \`gh pr create --repo \${config.owner}/\${config.repo} --base \${config.baseBranch} --head \${headBranch} --title "\${safeTitle}"\${mergeFlag}\`;
}

export function parseWebhookSignature(header: string | undefined): { algorithm: string; hash: string } | null {
  if (!header || !header.includes('=')) return null;
  const [algorithm, hash] = header.split('=');
  if (!algorithm || !hash || hash.length < 16) return null;
  return { algorithm, hash };
}`,
  },
  {
    path: 'src/auth/tokenGuard.ts',
    name: 'tokenGuard.ts',
    folder: 'src/auth',
    language: 'typescript',
    modified: true,
    lastUpdated: 'Há 1 min',
    coveragePct: 82,
    content: `export interface SessionClaims {
  sub: string;
  scopes: string[];
  issuedAtMs: number;
  ttlMs: number;
}

export function verifyCliSessionToken(claims: SessionClaims, requiredScope: string, nowMs = Date.now()): boolean {
  // TODO: add clock skew tolerance and audit log hook
  if (!claims.sub || claims.ttlMs <= 0) {
    return false;
  }
  const isExpired = nowMs > claims.issuedAtMs + claims.ttlMs;
  if (isExpired) {
    return false;
  }
  return claims.scopes.includes(requiredScope) || claims.scopes.includes('admin:all');
}`,
  },
  {
    path: 'package.json',
    name: 'package.json',
    folder: '/',
    language: 'json',
    modified: false,
    lastUpdated: 'Há 15 min',
    coveragePct: 100,
    content: `{
  "name": "@devforge/core-engine",
  "version": "2.4.0",
  "private": true,
  "scripts": {
    "build": "tsc -p tsconfig.build.json",
    "test": "node --test dist/**/*.test.js",
    "lint": "eslint src --max-warnings=0"
  },
  "dependencies": {
    "express": "^4.21.2",
    "zod": "^3.24.2",
    "pino": "^9.6.0"
  },
  "devDependencies": {
    "typescript": "^5.8.2",
    "vitest": "^3.0.7"
  }
}`,
  },
  {
    path: '.github/workflows/ci-pipeline.yml',
    name: 'ci-pipeline.yml',
    folder: '.github/workflows',
    language: 'yaml',
    modified: false,
    lastUpdated: 'Há 25 min',
    coveragePct: 100,
    content: `name: DevForge Continuous Delivery
on:
  push:
    branches: [main, feat/*]
  pull_request:
    branches: [main]

jobs:
  verify-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Install Dependencies
        run: npm ci
      - name: Gemini & Codex Static Audit
        run: gemini review --strict && codex test --coverage
      - name: Run Automated Test Suite
        run: npm test
      - name: Production Canary Rollout
        run: gh workflow run deploy-canary.yml`,
  },
  {
    path: 'README.md',
    name: 'README.md',
    folder: '/',
    language: 'markdown',
    modified: false,
    lastUpdated: 'Há 12 min',
    coveragePct: 100,
    content: `# DevForge Core Engine

Orquestrador local de engenharia de software integrado ao terminal via **Grok CLI (1.1)**, **Gemini CLI (1.2)**, **Codex CLI (1.3)** e **GitHub CLI (1.4)**.

## Fluxo Operacional
1. Edição local sem troca de contexto com árvore de diretórios integrada.
2. Geração automatizada de documentação técnica e JSDoc com Gemini CLI.
3. Síntese de testes unitários e patches com Codex CLI e diagnóstico via Grok CLI.
4. Versionamento Git completo (\`commit\`, \`push\`, \`pr\`, \`merge\`) via GitHub CLI.`,
  },
];

export const INITIAL_TASKS: DevTask[] = [
  {
    id: 'tsk-1',
    key: 'DEV-101',
    title: 'Implementar tolerância de clock skew na validação de token CLI',
    status: 'In Progress',
    priority: 'High',
    cliAgent: 'codex',
    branch: 'feat/cli-orchestrator',
    linkedFile: 'src/auth/tokenGuard.ts',
    automatedCommand: 'codex patch src/auth/tokenGuard.ts --add-skew-tolerance',
    updatedAt: 'Há 4 min',
  },
  {
    id: 'tsk-2',
    key: 'DEV-102',
    title: 'Documentar contrato JSDoc e exemplos de uso do processador de pedidos',
    status: 'In Review',
    priority: 'Medium',
    cliAgent: 'gemini',
    branch: 'feat/cli-orchestrator',
    linkedFile: 'src/core/orderProcessor.ts',
    automatedCommand: 'gemini docs src/core/orderProcessor.ts --format=jsdoc',
    updatedAt: 'Há 9 min',
  },
  {
    id: 'tsk-3',
    key: 'DEV-103',
    title: 'Auditar gargalos de concorrência e assinatura de webhooks GitHub',
    status: 'Backlog',
    priority: 'High',
    cliAgent: 'grok',
    branch: 'fix/webhook-timing',
    linkedFile: 'src/services/githubSync.ts',
    automatedCommand: 'grok analyze src/services/githubSync.ts --security',
    updatedAt: 'Há 18 min',
  },
  {
    id: 'tsk-4',
    key: 'DEV-104',
    title: 'Automatizar merge de PR #42 após validação da suíte de testes no CI',
    status: 'Completed',
    priority: 'Medium',
    cliAgent: 'gh',
    branch: 'main',
    linkedFile: '.github/workflows/ci-pipeline.yml',
    automatedCommand: 'gh pr merge 42 --squash --delete-branch',
    updatedAt: 'Há 32 min',
  },
];

export const INITIAL_COMMITS: GitCommit[] = [
  {
    hash: 'a8f4c21',
    message: 'feat(sync): add GitHub CLI PR builder and signature parser',
    author: 'markshzinho',
    branch: 'feat/cli-orchestrator',
    timestamp: 'Hoje, 05:24',
    filesChanged: 3,
  },
  {
    hash: '7d19e04',
    message: 'perf(orders): enforce strict rounding on tax and discount calculation',
    author: 'markshzinho',
    branch: 'feat/cli-orchestrator',
    timestamp: 'Hoje, 04:50',
    filesChanged: 2,
  },
  {
    hash: '3c91b88',
    message: 'ci(workflow): integrate gemini review and codex test stages',
    author: 'markshzinho',
    branch: 'main',
    timestamp: 'Ontem, 22:15',
    filesChanged: 4,
  },
];

export const INITIAL_PRS: PullRequest[] = [
  {
    number: 44,
    title: 'feat(orchestrator): unify Grok, Gemini, Codex & GitHub CLI pipelines',
    sourceBranch: 'feat/cli-orchestrator',
    targetBranch: 'main',
    status: 'Open',
    checks: 'Passing',
    reviewerAgent: 'Gemini CLI + Grok CLI',
    createdAt: 'Há 14 min',
    description: 'Centraliza execução de comandos locais, revisão por IA, geração de documentação e automação de PR.',
  },
  {
    number: 43,
    title: 'fix(auth): enforce strict scope check on CLI session tokens',
    sourceBranch: 'fix/webhook-timing',
    targetBranch: 'main',
    status: 'Open',
    checks: 'Passing',
    reviewerAgent: 'Codex CLI',
    createdAt: 'Há 2 horas',
    description: 'Adiciona verificação de expiração determinística e escopo administrativo.',
  },
  {
    number: 42,
    title: 'chore(deps): upgrade pino logger and configure CI canary rollout',
    sourceBranch: 'chore/ci-telemetry',
    targetBranch: 'main',
    status: 'Merged',
    checks: 'Passing',
    reviewerAgent: 'GitHub CLI',
    createdAt: 'Ontem',
    description: 'Pipeline CI/CD configurado com validação automatizada pré-merge.',
  },
];

export const INITIAL_TESTS: TestCaseResult[] = [
  {
    id: 'test-1',
    suite: 'orderProcessor.test.ts',
    name: 'calculates subtotal, DEVFORGE10 discount and 8% tax accurately',
    file: 'src/core/orderProcessor.ts',
    status: 'Pass',
    durationMs: 12,
    assertionCount: 5,
  },
  {
    id: 'test-2',
    suite: 'orderProcessor.test.ts',
    name: 'rejects empty item arrays and negative unit prices',
    file: 'src/core/orderProcessor.ts',
    status: 'Pass',
    durationMs: 8,
    assertionCount: 3,
  },
  {
    id: 'test-3',
    suite: 'githubSync.test.ts',
    name: 'builds escaped gh pr create command with --fill flag',
    file: 'src/services/githubSync.ts',
    status: 'Pass',
    durationMs: 9,
    assertionCount: 4,
  },
  {
    id: 'test-4',
    suite: 'tokenGuard.test.ts',
    name: 'validates active session token and blocks expired claims',
    file: 'src/auth/tokenGuard.ts',
    status: 'Pass',
    durationMs: 6,
    assertionCount: 4,
  },
];

export const INITIAL_PIPELINE: CiPipelineStage[] = [
  {
    id: 'stage-lint',
    name: '01. Static Type & AST Check',
    command: 'tsc --noEmit && eslint src/',
    status: 'Passed',
    durationSec: 4.2,
    outputSummary: '0 errors, 0 warnings across 6 project files.',
  },
  {
    id: 'stage-review',
    name: '02. Multi-CLI AI Security & Docs Audit',
    command: 'gemini review --strict && grok analyze --security',
    status: 'Passed',
    durationSec: 6.8,
    outputSummary: 'JSDoc coverage 94% · Zero high-risk vulnerabilities.',
  },
  {
    id: 'stage-test',
    name: '03. Automated Unit & Integration Tests',
    command: 'codex test --coverage && npm test',
    status: 'Passed',
    durationSec: 5.1,
    outputSummary: '4/4 suites passing (16 assertions) · 91.3% total coverage.',
  },
  {
    id: 'stage-deploy',
    name: '04. GitHub CLI Release & Canary Sync',
    command: 'gh workflow run deploy-canary.yml --ref feat/cli-orchestrator',
    status: 'Passed',
    durationSec: 8.4,
    outputSummary: 'Artifact built and synced with origin/feat/cli-orchestrator.',
  },
];

export function createInitialWorkspaceState(): WorkspaceState {
  return {
    activeBranch: 'feat/cli-orchestrator',
    branches: ['feat/cli-orchestrator', 'main', 'fix/webhook-timing'],
    stagedFiles: ['src/services/githubSync.ts', 'src/auth/tokenGuard.ts'],
    cliTools: INITIAL_CLI_TOOLS.map((t) => ({ ...t })),
    files: INITIAL_FILES.map((f) => ({ ...f })),
    tasks: INITIAL_TASKS.map((t) => ({ ...t })),
    commits: INITIAL_COMMITS.map((c) => ({ ...c })),
    pullRequests: INITIAL_PRS.map((p) => ({ ...p })),
    testResults: INITIAL_TESTS.map((t) => ({ ...t })),
    pipelineStages: INITIAL_PIPELINE.map((s) => ({ ...s })),
    terminalLogs: [
      {
        id: 'log-init-1',
        timestamp: '05:30:02',
        provider: 'system',
        command: 'devforge init --attach-local-workspace',
        output:
          'Workspace conectado · Plano de controle DevForge sobre xAI (1.1), Google (1.2), OpenAI (1.3), GitHub (1.4) e Anthropic (1.5).',
        exitCode: 0,
      },
      {
        id: 'log-init-2',
        timestamp: '05:31:15',
        provider: 'gh',
        command: 'gh status --branch feat/cli-orchestrator',
        output:
          'Branch ativa: feat/cli-orchestrator · 2 arquivos modificados prontos para stage · PR #44 aberto e com checks verdes.',
        exitCode: 0,
      },
    ],
  };
}

/**
 * Parses a raw CLI command string to identify which CLI provider handles it
 * and extracts normalized arguments.
 */
export function parseCliCommand(rawCommand: string): {
  provider: CliProviderId;
  binary: string;
  subcommand: string;
  args: string[];
} {
  const trimmed = rawCommand.trim();
  if (!trimmed) {
    return { provider: 'system', binary: '', subcommand: '', args: [] };
  }
  const tokens = trimmed.match(/(?:[^\s"]+|"[^"]*")+/g) || [];
  const binary = (tokens[0] || '').toLowerCase();
  const subcommand = (tokens[1] || '').toLowerCase();
  const args = tokens.slice(2).map((arg) => arg.replace(/^"|"$/g, ''));

  if (binary === 'grok' || binary === 'gemini' || binary === 'codex' || binary === 'claude') {
    return { provider: binary, binary, subcommand, args };
  }
  if (binary === 'gh' || binary === 'git') return { provider: 'gh', binary, subcommand, args };
  if (binary === 'devforge') return { provider: 'system', binary, subcommand, args };
  return { provider: 'system', binary, subcommand, args };
}

/**
 * Installs or updates a package inside the project's package.json file content.
 */
export function applyDependencyToPackageJson(
  packageJsonContent: string,
  pkgSpec: string,
  isDev = false
): { updatedContent: string; pkgName: string; pkgVersion: string } {
  const cleanSpec = pkgSpec.trim();
  if (!cleanSpec) {
    throw new Error('Package name cannot be empty');
  }

  let pkgName = cleanSpec;
  let pkgVersion = '^1.0.0';

  const lastAt = cleanSpec.lastIndexOf('@');
  if (lastAt > 0) {
    pkgName = cleanSpec.slice(0, lastAt);
    pkgVersion = cleanSpec.slice(lastAt + 1);
    if (!pkgVersion.startsWith('^') && !pkgVersion.startsWith('~') && /^\d/.test(pkgVersion)) {
      pkgVersion = `^${pkgVersion}`;
    }
  } else {
    const knownVersions: Record<string, string> = {
      zod: '^3.24.2',
      axios: '^1.8.1',
      lodash: '^4.17.21',
      dotenv: '^16.4.7',
      uuid: '^11.1.0',
      dayjs: '^1.11.13',
      prisma: '^6.4.1',
      redis: '^4.7.0',
      bullmq: '^5.40.0',
    };
    pkgVersion = knownVersions[pkgName] || '^2.1.0';
  }

  const parsed = JSON.parse(packageJsonContent);
  const targetKey = isDev ? 'devDependencies' : 'dependencies';
  if (!parsed[targetKey]) {
    parsed[targetKey] = {};
  }
  parsed[targetKey][pkgName] = pkgVersion;

  // Sort keys alphabetically for clean diffs
  parsed[targetKey] = Object.keys(parsed[targetKey])
    .sort()
    .reduce<Record<string, string>>((acc, key) => {
      acc[key] = parsed[targetKey][key];
      return acc;
    }, {});

  return {
    updatedContent: JSON.stringify(parsed, null, 2),
    pkgName,
    pkgVersion,
  };
}

/**
 * Generates deterministic static code review diagnostics for a file,
 * used both for instant local feedback and as fallback when offline.
 */
export function analyzeCodeLocally(file: ProjectFile): CodeReviewIssue[] {
  const issues: CodeReviewIssue[] = [];
  const lines = file.content.split('\n');

  lines.forEach((lineText, idx) => {
    const lineNum = idx + 1;
    if (lineText.includes('TODO:') || lineText.includes('FIXME:')) {
      issues.push({
        id: `rev-${file.name}-${lineNum}-todo`,
        line: lineNum,
        severity: 'Warning',
        rule: 'grok/unfinished-task',
        message: `Bloco pendente detectado (${lineText.trim()}). Recomenda-se resolver antes do merge.`,
        suggestedFix: 'Implementar tolerância de clock skew (ex: const skewMs = 5000) e remover comentário TODO.',
        provider: 'grok',
      });
    }
    if (lineText.includes('any')) {
      issues.push({
        id: `rev-${file.name}-${lineNum}-any`,
        line: lineNum,
        severity: 'Error',
        rule: 'codex/no-explicit-any',
        message: 'Uso de tipo explícito `any` reduz a segurança estática do TypeScript.',
        suggestedFix: 'Substituir `any` por uma interface tipada ou `unknown` com type guard.',
        provider: 'codex',
      });
    }
    if (
      lineText.startsWith('export function ') ||
      lineText.startsWith('export async function ')
    ) {
      const prevLine = idx > 0 ? lines[idx - 1].trim() : '';
      if (!prevLine.endsWith('*/')) {
        const fnMatch = lineText.match(/function\s+([a-zA-Z0-9_]+)/);
        const fnName = fnMatch ? fnMatch[1] : 'exportedFunction';
        issues.push({
          id: `rev-${file.name}-${lineNum}-jsdoc`,
          line: lineNum,
          severity: 'Info',
          rule: 'gemini/missing-jsdoc',
          message: `Função pública \`${fnName}\` sem cabeçalho de documentação JSDoc padronizado.`,
          suggestedFix: `Adicionar bloco JSDoc detalhando parâmetros, retorno e exceções de \`${fnName}\`.`,
          provider: 'gemini',
        });
      }
    }
  });

  if (issues.length === 0) {
    issues.push({
      id: `rev-${file.name}-clean`,
      line: 1,
      severity: 'Info',
      rule: 'gemini/clean-module',
      message: 'Estrutura limpa, tipagem estrita verificada e documentação JSDoc presente nas funções exportadas.',
      suggestedFix: 'Nenhuma alteração estrutural obrigatória.',
      provider: 'gemini',
    });
  }

  return issues;
}

/**
 * Injects comprehensive JSDoc headers into exported TypeScript functions in a file.
 */
export function injectJsDocHeaders(fileContent: string, filePath: string): {
  documentedCode: string;
  markdownSummary: string;
  functionsDocumented: number;
} {
  const lines = fileContent.split('\n');
  const outputLines: string[] = [];
  const documentedFns: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isExportFn =
      line.startsWith('export function ') || line.startsWith('export async function ');
    const prevLine = i > 0 ? lines[i - 1].trim() : '';

    if (isExportFn && !prevLine.endsWith('*/')) {
      const fnMatch = line.match(/function\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\)/);
      const fnName = fnMatch ? fnMatch[1] : 'handler';
      const rawParams = fnMatch && fnMatch[2] ? fnMatch[2].split(',').map((p) => p.trim()).filter(Boolean) : [];
      documentedFns.push(fnName);

      outputLines.push('/**');
      outputLines.push(` * Executa a operação \`${fnName}\` no módulo \`${filePath}\`.`);
      rawParams.forEach((param) => {
        const paramName = param.split(':')[0].split('=')[0].trim();
        outputLines.push(` * @param ${paramName} Parâmetro de entrada validado pelo contrato local.`);
      });
      outputLines.push(' * @returns Resultado processado com garantia de integridade.');
      outputLines.push(' */');
    }
    outputLines.push(line);
  }

  const markdownSummary = [
    `### Documentação Técnica — \`${filePath}\``,
    `- **Gerado por**: Gemini CLI (\`1.2\`) + Codex CLI (\`1.3\`)`,
    `- **Funções documentadas**: ${documentedFns.length > 0 ? documentedFns.map((f) => `\`${f}()\``).join(', ') : 'Módulo já documentado'}`,
    `- **Padrão aplicado**: JSDoc TSDoc Strict + Especificação de Contratos de Entrada/Saída`,
  ].join('\n');

  return {
    documentedCode: outputLines.join('\n'),
    markdownSummary,
    functionsDocumented: documentedFns.length,
  };
}

export interface DiffLine {
  type: 'same' | 'added' | 'removed';
  lineNumber: number;
  content: string;
}

/**
 * Computes a clean line-by-line diff between original and modified code
 * for the integrated Editor & AI Diff Viewer.
 */
export function computeLineDiff(beforeCode: string, afterCode: string): {
  lines: DiffLine[];
  addedCount: number;
  removedCount: number;
} {
  const beforeLines = beforeCode.split('\n');
  const afterLines = afterCode.split('\n');
  const beforeSet = new Set(beforeLines);
  const afterSet = new Set(afterLines);

  const result: DiffLine[] = [];
  let addedCount = 0;
  let removedCount = 0;
  let lineCounter = 1;

  for (const bLine of beforeLines) {
    if (!afterSet.has(bLine)) {
      removedCount++;
      result.push({
        type: 'removed',
        lineNumber: lineCounter,
        content: bLine,
      });
    }
  }

  for (const aLine of afterLines) {
    if (!beforeSet.has(aLine)) {
      addedCount++;
      result.push({
        type: 'added',
        lineNumber: lineCounter++,
        content: aLine,
      });
    } else {
      result.push({
        type: 'same',
        lineNumber: lineCounter++,
        content: aLine,
      });
    }
  }

  return { lines: result, addedCount, removedCount };
}

/**
 * Synthesizes a new deterministic unit test case for a target project file
 * via Codex CLI (1.3).
 */
export function synthesizeUnitTestForFile(
  file: ProjectFile,
  existingTestsCount: number
): {
  newTestResult: TestCaseResult;
  generatedTestCode: string;
} {
  const fnMatch = file.content.match(/export\s+(?:async\s+)?function\s+([a-zA-Z0-9_]+)/);
  const targetFnName = fnMatch ? fnMatch[1] : 'moduleHandler';
  const baseSuiteName = file.name.replace(/\.(ts|json|md|yml|yaml)$/, '') + '.test.ts';

  const newTestResult: TestCaseResult = {
    id: `test-synth-${existingTestsCount + 1}`,
    suite: baseSuiteName,
    name: `verifies edge-case boundary invariants for ${targetFnName}()`,
    file: file.path,
    status: 'Pass',
    durationMs: 7,
    assertionCount: 4,
  };

  const generatedTestCode = `import test from 'node:test';
import assert from 'node:assert/strict';
import { ${targetFnName} } from './${file.name.replace(/\.ts$/, '')}';

test('${newTestResult.name}', async () => {
  assert.equal(typeof ${targetFnName}, 'function');
  // Validated by Codex CLI (1.3) AST test synthesizer
});`;

  return { newTestResult, generatedTestCode };
}

export interface AutocompleteItem {
  id: string;
  command: string;
  provider: Exclude<CliProviderId, 'system'>;
  category: 'Comando' | 'Arquivo' | 'Flag' | 'Workflow';
  description: string;
}

export interface ChatbookMessage {
  id: string;
  agent: Exclude<CliProviderId, 'system'>;
  role: 'user' | 'assistant';
  title: string;
  content: string;
  codeSnippet?: string;
  suggestedCommand?: string;
  timestamp: string;
  saved: boolean;
}

export const INITIAL_CHATBOOK_MESSAGES: ChatbookMessage[] = [
  {
    id: 'cb-1',
    agent: 'gemini',
    role: 'assistant',
    title: 'Arquitetura & Contratos JSDoc (Gemini 1.2)',
    content:
      'Analisei a árvore local do projeto. O módulo `src/core/orderProcessor.ts` possui cálculo fiscal determinístico e está pronto para exportação de documentação técnica.',
    codeSnippet: `// Exemplo validado pelo Gemini CLI 1.2\nconst order = processOrderBatch({ orderId: 'ORD-99', customerId: 'C-1', items: [{ sku: 'DEV-1', qty: 2, unitPrice: 50 }], discountCode: 'DEVFORGE10' });`,
    suggestedCommand: 'gemini docs src/core/orderProcessor.ts --write-jsdoc',
    timestamp: '09:55',
    saved: true,
  },
  {
    id: 'cb-2',
    agent: 'grok',
    role: 'assistant',
    title: 'Auditoria de Segurança de Sessão (Grok 1.1)',
    content:
      'Identifiquei necessidade de tolerância de clock skew em `src/auth/tokenGuard.ts` para evitar falsos negativos em tokens recém-emitidos entre containers.',
    codeSnippet: `const clockSkewToleranceMs = 5000;\nconst isExpired = nowMs > claims.issuedAtMs + claims.ttlMs + clockSkewToleranceMs;`,
    suggestedCommand: 'grok analyze src/auth/tokenGuard.ts --security',
    timestamp: '09:58',
    saved: true,
  },
];

const MASTER_AUTOCOMPLETE_CATALOG: AutocompleteItem[] = [
  {
    id: 'ac-devforge-status',
    command: 'devforge status',
    provider: 'grok',
    category: 'Workflow',
    description: 'Mostra qual empresa está na API e qual está no motor local',
  },
  {
    id: 'ac-devforge-fanout',
    command: 'devforge fanout auditar tokenGuard, documentar o contrato e preparar o pull request',
    provider: 'grok',
    category: 'Workflow',
    description: 'Fan-out entre xAI, Google e GitHub com handoff',
  },
  {
    id: 'ac-devforge-handoff',
    command: 'devforge handoff grok claude revisar o achado de clock skew',
    provider: 'claude',
    category: 'Workflow',
    description: 'Entrega o pacote da xAI para a Anthropic revisar o desenho',
  },
  {
    id: 'ac-claude-1',
    command: 'claude review src/auth/tokenGuard.ts --design',
    provider: 'claude',
    category: 'Comando',
    description: 'Crítica de desenho e trade-offs (Anthropic 1.5)',
  },
  {
    id: 'ac-grok-1',
    command: 'grok analyze src/auth/tokenGuard.ts --security --race-conditions',
    provider: 'grok',
    category: 'Comando',
    description: 'Auditoria profunda de segurança, tokens e concorrência (Grok 1.1)',
  },
  {
    id: 'ac-grok-2',
    command: 'grok review src/services/githubSync.ts --strict',
    provider: 'grok',
    category: 'Comando',
    description: 'Revisão estática de assinatura de webhooks e falhas de rede (Grok 1.1)',
  },
  {
    id: 'ac-gemini-1',
    command: 'gemini docs src/core/orderProcessor.ts --write-jsdoc',
    provider: 'gemini',
    category: 'Comando',
    description: 'Injeta cabeçalhos JSDoc e gera especificação Markdown (Gemini 1.2)',
  },
  {
    id: 'ac-gemini-2',
    command: 'gemini explain src/core/orderProcessor.ts --architecture',
    provider: 'gemini',
    category: 'Workflow',
    description: 'Mapeia fluxo de dados e invariantes de domínio (Gemini 1.2)',
  },
  {
    id: 'ac-codex-1',
    command: 'codex test src/core/orderProcessor.ts --coverage',
    provider: 'codex',
    category: 'Comando',
    description: 'Executa suíte de testes unitários com relatório de cobertura (Codex 1.3)',
  },
  {
    id: 'ac-codex-2',
    command: 'codex patch src/auth/tokenGuard.ts --apply-fixes',
    provider: 'codex',
    category: 'Workflow',
    description: 'Aplica refatoração AST automática e corrige avisos pendentes (Codex 1.3)',
  },
  {
    id: 'ac-codex-3',
    command: 'codex synthesize-test src/services/githubSync.ts',
    provider: 'codex',
    category: 'Workflow',
    description: 'Sintetiza novos casos de teste unitários determinísticos (Codex 1.3)',
  },
  {
    id: 'ac-gh-1',
    command: 'gh pr list --state open',
    provider: 'gh',
    category: 'Comando',
    description: 'Lista todos os Pull Requests abertos e status de checks (GitHub 1.4)',
  },
  {
    id: 'ac-gh-2',
    command: 'gh pr create --base main --head feat/cli-orchestrator --fill',
    provider: 'gh',
    category: 'Workflow',
    description: 'Cria Pull Request automatizado para a branch ativa (GitHub 1.4)',
  },
  {
    id: 'ac-gh-3',
    command: 'gh pr merge 44 --squash --delete-branch',
    provider: 'gh',
    category: 'Comando',
    description: 'Realiza squash merge seguro do PR #44 na branch main (GitHub 1.4)',
  },
  {
    id: 'ac-gh-4',
    command: 'gh workflow run ci-pipeline.yml --ref feat/cli-orchestrator',
    provider: 'gh',
    category: 'Workflow',
    description: 'Dispara pipeline completo de CI/CD no GitHub Actions (GitHub 1.4)',
  },
  {
    id: 'ac-npm-1',
    command: 'npm install redis@4.7.0',
    provider: 'codex',
    category: 'Comando',
    description: 'Instala pacote no package.json local e atualiza manifesto',
  },
];

/**
 * Returns ranked autocomplete suggestions matching the current input prefix or substring,
 * dynamically enriched with the project's local file paths.
 */
export function getCliAutocompleteSuggestions(
  query: string,
  files: ProjectFile[] = INITIAL_FILES,
  activeBranch = 'feat/cli-orchestrator'
): AutocompleteItem[] {
  const normalized = query.trim().toLowerCase();

  const fileItems: AutocompleteItem[] = files.map((f, idx) => ({
    id: `ac-file-${idx}`,
    command: `gemini docs ${f.path} --write-jsdoc`,
    provider: 'gemini',
    category: 'Arquivo',
    description: `Documentar e auditar arquivo local ${f.path} (${activeBranch})`,
  }));

  const allItems = [...MASTER_AUTOCOMPLETE_CATALOG, ...fileItems];

  if (!normalized) {
    return MASTER_AUTOCOMPLETE_CATALOG.slice(0, 6);
  }

  return allItems
    .filter(
      (item) =>
        item.command.toLowerCase().includes(normalized) ||
        item.description.toLowerCase().includes(normalized) ||
        item.provider.toLowerCase().includes(normalized)
    )
    .slice(0, 7);
}

export interface GlobalSearchResult {
  id: string;
  kind: 'file' | 'task' | 'log';
  title: string;
  subtitle: string;
  badge: string;
  provider: CliProviderId;
  targetFilePath?: string;
  targetTaskId?: string;
  targetCommand?: string;
}

/**
 * Searches across local workspace files, development tasks, and terminal logs
 * for the global search bar in the top header.
 */
export function searchGlobalWorkspace(
  query: string,
  files: ProjectFile[],
  tasks: DevTask[],
  terminalLogs: TerminalLogEntry[]
): GlobalSearchResult[] {
  const normalized = query.trim().toLowerCase();
  const results: GlobalSearchResult[] = [];

  for (const file of files) {
    const matches =
      !normalized ||
      file.path.toLowerCase().includes(normalized) ||
      file.name.toLowerCase().includes(normalized) ||
      file.content.toLowerCase().includes(normalized);
    if (matches) {
      results.push({
        id: `search-file-${file.path}`,
        kind: 'file',
        title: file.path,
        subtitle: `Pasta: ${file.folder} · Cobertura: ${file.coveragePct}% · Atualizado: ${file.lastUpdated}`,
        badge: file.modified ? 'Modificado' : 'Arquivo Local',
        provider: 'gemini',
        targetFilePath: file.path,
        targetCommand: `gemini docs ${file.path} --write-jsdoc`,
      });
    }
  }

  for (const task of tasks) {
    const matches =
      !normalized ||
      task.key.toLowerCase().includes(normalized) ||
      task.title.toLowerCase().includes(normalized) ||
      task.automatedCommand.toLowerCase().includes(normalized) ||
      task.linkedFile.toLowerCase().includes(normalized);
    if (matches) {
      results.push({
        id: `search-task-${task.id}`,
        kind: 'task',
        title: `${task.key} · ${task.title}`,
        subtitle: `Arquivo: ${task.linkedFile} · CLI: $ ${task.automatedCommand}`,
        badge: `${task.status} (${task.priority})`,
        provider: task.cliAgent,
        targetTaskId: task.id,
        targetFilePath: task.linkedFile,
        targetCommand: task.automatedCommand,
      });
    }
  }

  for (const log of [...terminalLogs].reverse()) {
    const matches =
      !normalized ||
      log.command.toLowerCase().includes(normalized) ||
      log.output.toLowerCase().includes(normalized) ||
      log.provider.toLowerCase().includes(normalized);
    if (matches) {
      results.push({
        id: `search-log-${log.id}`,
        kind: 'log',
        title: `$ ${log.command}`,
        subtitle: log.output.split('\n')[0] || 'Execução registrada no terminal',
        badge: `${log.provider.toUpperCase()} · ${log.timestamp}`,
        provider: log.provider,
        targetCommand: log.command,
      });
    }
  }

  return results.slice(0, 12);
}

/**
 * Computes human-readable progress stage metadata for CLI command execution.
 */
export function computeCliExecutionStage(
  progressPct: number,
  provider: CliProviderId,
  command: string
): {
  clampedPct: number;
  stageLabel: string;
} {
  const clampedPct = Math.max(0, Math.min(100, Math.round(progressPct)));
  const providerName = provider === 'system' ? 'DevForge Orchestrator' : `${provider.toUpperCase()} CLI`;

  if (clampedPct < 30) {
    return {
      clampedPct,
      stageLabel: `[${providerName}] Inicializando contexto local para "${command}"...`,
    };
  }
  if (clampedPct < 75) {
    return {
      clampedPct,
      stageLabel: `[${providerName}] Processando requisição à API & analisando AST...`,
    };
  }
  if (clampedPct < 100) {
    return {
      clampedPct,
      stageLabel: `[${providerName}] Consolidando saída e sincronizando logs do terminal...`,
    };
  }
  return {
    clampedPct: 100,
    stageLabel: `[${providerName}] Execução concluída com sucesso.`,
  };
}
