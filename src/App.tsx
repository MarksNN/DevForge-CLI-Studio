import React, { useState, useEffect } from 'react';
import {
  Play,
  Save,
  Sparkles,
  Menu,
  Terminal,
} from 'lucide-react';
import {
  createInitialWorkspaceState,
  parseCliCommand,
  applyDependencyToPackageJson,
  injectJsDocHeaders,
  analyzeCodeLocally,
  synthesizeUnitTestForFile,
  getCliAutocompleteSuggestions,
  INITIAL_CHATBOOK_MESSAGES,
  ChatbookMessage,
  CliProviderId,
  DevTask,
  WorkspaceState,
} from './utils/cliEngine';
import { TerminalHubView } from './components/TerminalHubView';
import { LocalEditorView } from './components/LocalEditorView';
import { GitGithubView } from './components/GitGithubView';
import { TasksAndCiView } from './components/TasksAndCiView';
import { ChatbookView } from './components/ChatbookView';
import { CompanyLogoSvg } from './components/CompanyLogos';
import {
  Sidebar,
  SidebarTabType,
  SIDEBAR_ITEM_METADATA,
  OperationBrand,
} from './components/Sidebar';

type ActiveWorkspaceTab = 'terminal' | 'editor' | 'github' | 'tasks' | 'chatbook';

const STORAGE_KEY = 'devforge_workspace_state_v2';
const CHATBOOK_STORAGE_KEY = 'devforge_chatbook_state_v2';

function formatCurrentTime(): string {
  const now = new Date();
  return now.toTimeString().slice(0, 8);
}

function loadPersistedWorkspace(): WorkspaceState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.files) && Array.isArray(parsed.cliTools)) {
        return parsed;
      }
    }
  } catch {
    // Ignore storage errors
  }
  return createInitialWorkspaceState();
}

function loadPersistedChatbook(): ChatbookMessage[] {
  try {
    const raw = localStorage.getItem(CHATBOOK_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // Ignore storage errors
  }
  return INITIAL_CHATBOOK_MESSAGES.map((m) => ({ ...m }));
}

export default function App() {
  const [workspace, setWorkspace] = useState<WorkspaceState>(() => loadPersistedWorkspace());
  const [chatbookMessages, setChatbookMessages] = useState<ChatbookMessage[]>(() =>
    loadPersistedChatbook()
  );
  const [activeTab, setActiveTab] = useState<ActiveWorkspaceTab>('terminal');
  const [activeSidebarTab, setActiveSidebarTab] = useState<SidebarTabType>('dashboard');
  const [activeBrand, setActiveBrand] = useState<OperationBrand>('atlasgr');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [activeFilePath, setActiveFilePath] = useState<string>('src/core/orderProcessor.ts');
  const [quickCliInput, setQuickCliInput] = useState<string>('');
  const [lastSavedAt, setLastSavedAt] = useState<string>('10:00:00');
  const [saveToast, setSaveToast] = useState<string | null>(null);
  const [isExecutingCli, setIsExecutingCli] = useState(false);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [isRunningPipeline, setIsRunningPipeline] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(workspace));
    } catch {
      // Ignore quota errors
    }
  }, [workspace]);

  useEffect(() => {
    try {
      localStorage.setItem(CHATBOOK_STORAGE_KEY, JSON.stringify(chatbookMessages));
    } catch {
      // Ignore quota errors
    }
  }, [chatbookMessages]);

  const activeFile =
    workspace.files.find((f) => f.path === activeFilePath) || workspace.files[0];

  const currentModuleMeta = SIDEBAR_ITEM_METADATA[activeSidebarTab];

  const quickAutocompleteList = getCliAutocompleteSuggestions(
    quickCliInput,
    workspace.files,
    workspace.activeBranch
  );

  const handleSelectTopView = (view: ActiveWorkspaceTab) => {
    setActiveTab(view);
    const defaultSidebarMap: Record<ActiveWorkspaceTab, SidebarTabType> = {
      terminal: 'dashboard',
      editor: 'editor',
      github: 'crm',
      tasks: 'activities',
      chatbook: 'chatbook',
    };
    setActiveSidebarTab(defaultSidebarMap[view]);
  };

  const handleSelectSidebarTab = (tab: SidebarTabType) => {
    setActiveSidebarTab(tab);
    const meta = SIDEBAR_ITEM_METADATA[tab];
    if (meta) {
      setActiveTab(meta.workspaceView);
    }
  };

  const handleGlobalSaveWorkspace = () => {
    const timeStr = formatCurrentTime();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(workspace));
      localStorage.setItem(CHATBOOK_STORAGE_KEY, JSON.stringify(chatbookMessages));
    } catch {
      // Ignore quota errors
    }
    setLastSavedAt(timeStr);
    setSaveToast(`Workspace, arquivos locais e Chatbook salvos às ${timeStr}.`);
  };

  const appendTerminalLog = (
    provider: CliProviderId,
    command: string,
    output: string,
    exitCode = 0
  ) => {
    setWorkspace((prev) => ({
      ...prev,
      cliTools: prev.cliTools.map((tool) =>
        tool.id === provider
          ? { ...tool, commandsExecuted: tool.commandsExecuted + 1 }
          : tool
      ),
      terminalLogs: [
        ...prev.terminalLogs,
        {
          id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          timestamp: formatCurrentTime(),
          provider,
          command,
          output,
          exitCode,
        },
      ],
    }));
  };

  const handleExportExtractorReport = () => {
    const timeStr = formatCurrentTime();
    appendTerminalLog(
      'gh',
      'gh api /repos/devforge/core-engine/releases --export bitrix24-snapshot.json',
      `[Extrator Bitrix24 & CLI] Snapshot exportado às ${timeStr} (${workspace.files.length} arquivos, ${workspace.tasks.length} tarefas, ${workspace.pullRequests.length} PRs).`
    );
    setSaveToast(
      `Extrator Bitrix24 & CLI: Relatório JSON sincronizado e salvo no workspace às ${timeStr}.`
    );
  };

  const handleResetWorkspace = () => {
    const fresh = createInitialWorkspaceState();
    setWorkspace(fresh);
    setChatbookMessages(INITIAL_CHATBOOK_MESSAGES.map((m) => ({ ...m })));
    setActiveFilePath('src/core/orderProcessor.ts');
    setActiveSidebarTab('dashboard');
    setActiveTab('terminal');
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(CHATBOOK_STORAGE_KEY);
    } catch {
      // Ignore
    }
  };

  const handleSaveFileContent = (path: string, newContent: string) => {
    const timeStr = formatCurrentTime();
    setLastSavedAt(timeStr);
    setWorkspace((prev) => ({
      ...prev,
      files: prev.files.map((f) =>
        f.path === path
          ? { ...f, content: newContent, modified: true, lastUpdated: 'Agora' }
          : f
      ),
      stagedFiles: prev.stagedFiles.includes(path)
        ? prev.stagedFiles
        : [...prev.stagedFiles, path],
    }));
  };

  const handleAppendToReadme = (markdownBlock: string) => {
    setWorkspace((prev) => ({
      ...prev,
      files: prev.files.map((f) =>
        f.path === 'README.md'
          ? {
              ...f,
              content: `${f.content.trim()}\n\n${markdownBlock}\n`,
              modified: true,
              lastUpdated: 'Agora',
            }
          : f
      ),
      stagedFiles: prev.stagedFiles.includes('README.md')
        ? prev.stagedFiles
        : [...prev.stagedFiles, 'README.md'],
    }));
    appendTerminalLog(
      'gemini',
      'gemini docs --append README.md',
      'Bloco de documentação técnica Markdown anexado ao README.md.'
    );
  };

  const handleCreateNewFile = (path: string, content: string) => {
    const parts = path.split('/');
    const name = parts[parts.length - 1];
    const folder = parts.length > 1 ? parts.slice(0, -1).join('/') : '/';
    const language = name.endsWith('.json')
      ? 'json'
      : name.endsWith('.md')
      ? 'markdown'
      : 'typescript';

    setWorkspace((prev) => {
      const existing = prev.files.some((f) => f.path === path);
      const updatedFiles = existing
        ? prev.files.map((f) =>
            f.path === path ? { ...f, content, modified: true, lastUpdated: 'Agora' } : f
          )
        : [
            ...prev.files,
            {
              path,
              name,
              folder,
              language,
              content,
              modified: true,
              lastUpdated: 'Agora',
              coveragePct: 90,
            } as const,
          ];
      return {
        ...prev,
        files: updatedFiles,
        stagedFiles: prev.stagedFiles.includes(path)
          ? prev.stagedFiles
          : [...prev.stagedFiles, path],
      };
    });
    setActiveFilePath(path);
    appendTerminalLog('system', `touch ${path}`, `Arquivo local registrado e selecionado: ${path}`);
  };

  const handleInstallDependency = (pkgSpec: string, isDev: boolean) => {
    setWorkspace((prev) => {
      const pkgFile = prev.files.find((f) => f.path === 'package.json');
      if (!pkgFile) return prev;
      try {
        const { updatedContent, pkgName, pkgVersion } = applyDependencyToPackageJson(
          pkgFile.content,
          pkgSpec,
          isDev
        );
        return {
          ...prev,
          files: prev.files.map((f) =>
            f.path === 'package.json'
              ? { ...f, content: updatedContent, modified: true, lastUpdated: 'Agora' }
              : f
          ),
          stagedFiles: prev.stagedFiles.includes('package.json')
            ? prev.stagedFiles
            : [...prev.stagedFiles, 'package.json'],
          terminalLogs: [
            ...prev.terminalLogs,
            {
              id: `log-npm-${Date.now()}`,
              timestamp: formatCurrentTime(),
              provider: 'system',
              command: `npm install ${isDev ? '-D ' : ''}${pkgSpec}`,
              output: `+ ${pkgName}@${pkgVersion.replace('^', '')}\nadicionado 1 pacote e auditado em 410ms · package.json salvo.`,
              exitCode: 0,
            },
          ],
        };
      } catch {
        return prev;
      }
    });
  };

  const handleExecuteCommand = async (
    rawCommand: string,
    forcedProvider?: CliProviderId
  ) => {
    const parsed = parseCliCommand(rawCommand);
    const provider = forcedProvider || parsed.provider;

    if (
      parsed.binary === 'npm' &&
      (parsed.subcommand === 'i' || parsed.subcommand === 'install')
    ) {
      const pkgArg = parsed.args.find((a) => !a.startsWith('-')) || 'axios';
      const isDev = parsed.args.includes('-D') || parsed.args.includes('--save-dev');
      handleInstallDependency(pkgArg, isDev);
      return;
    }

    if (provider === 'gemini' && parsed.subcommand === 'docs') {
      const targetPath =
        parsed.args.find((a) => !a.startsWith('-')) || activeFile.path;
      const targetFile =
        workspace.files.find((f) => f.path === targetPath) || activeFile;
      const docResult = injectJsDocHeaders(targetFile.content, targetFile.path);
      handleSaveFileContent(targetFile.path, docResult.documentedCode);
      appendTerminalLog(
        'gemini',
        rawCommand,
        `[Gemini CLI 1.2] Documentação JSDoc injetada em ${targetFile.path} (${docResult.functionsDocumented} funções atualizadas).`
      );
      return;
    }

    if (provider === 'gh' && parsed.subcommand === 'pr' && parsed.args[0] === 'list') {
      const openPrs = workspace.pullRequests
        .filter((p) => p.status === 'Open')
        .map(
          (p) =>
            `#${p.number}  ${p.title}  [${p.sourceBranch} -> ${p.targetBranch}] (${p.checks})`
        )
        .join('\n');
      appendTerminalLog(
        'gh',
        rawCommand,
        openPrs || 'Nenhum Pull Request aberto no momento.'
      );
      return;
    }

    if (provider === 'grok' && parsed.subcommand === 'analyze') {
      const targetPath =
        parsed.args.find((a) => !a.startsWith('-')) || activeFile.path;
      const targetFile =
        workspace.files.find((f) => f.path === targetPath) || activeFile;
      const issues = analyzeCodeLocally(targetFile);
      const summary = issues
        .map((iss) => `[${iss.severity}] L${iss.line} (${iss.rule}): ${iss.message}`)
        .join('\n');
      appendTerminalLog(
        'grok',
        rawCommand,
        `[Grok CLI 1.1] Diagnóstico para ${targetFile.path}:\n${summary}`
      );
      return;
    }

    if (provider === 'codex' && parsed.subcommand === 'test') {
      handleRunTestSuite();
      return;
    }

    setIsExecutingCli(true);
    try {
      const response = await fetch('/api/ai/cli', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command: rawCommand,
          provider,
          activeFilePath: activeFile.path,
          activeFileContent: activeFile.content,
          branch: workspace.activeBranch,
        }),
      });
      const data = await response.json();
      if (!data.usedFallback && data.output) {
        appendTerminalLog(provider, rawCommand, data.output);
      } else {
        appendTerminalLog(
          provider,
          rawCommand,
          `[${provider.toUpperCase()} CLI] Comando "${rawCommand}" executado na branch ${workspace.activeBranch} (foco: ${activeFile.path}). Status: OK.`
        );
      }
    } catch {
      appendTerminalLog(
        provider,
        rawCommand,
        `[${provider.toUpperCase()} CLI] Execução local concluída para "${rawCommand}".`
      );
    } finally {
      setIsExecutingCli(false);
    }
  };

  const handleQuickCliSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = quickCliInput.trim();
    if (!cmd) return;
    setQuickCliInput('');
    await handleExecuteCommand(cmd);
  };

  const handleSendChatbookMessage = async (
    agent: Exclude<CliProviderId, 'system'>,
    promptText: string
  ) => {
    const userEntry: ChatbookMessage = {
      id: `cb-user-${Date.now()}`,
      agent,
      role: 'user',
      title: `Você → ${agent.toUpperCase()} CLI`,
      content: promptText,
      timestamp: formatCurrentTime().slice(0, 5),
      saved: false,
    };

    const replySnippetMap: Record<Exclude<CliProviderId, 'system'>, string> = {
      grok: `// Patch de Segurança Grok CLI 1.1\nexport const MAX_CLOCK_SKEW_MS = 5000;`,
      gemini: `/**\n * Documentado automaticamente por Gemini CLI 1.2\n * Arquivo alvo: ${activeFile.path}\n */`,
      codex: `// Asserção gerada por Codex CLI 1.3\nassert.equal(typeof processOrderBatch, 'function');`,
      gh: `# Workflow GitHub CLI 1.4\ngh pr create --base main --head ${workspace.activeBranch} --fill`,
    };

    const replyCmdMap: Record<Exclude<CliProviderId, 'system'>, string> = {
      grok: `grok analyze ${activeFile.path} --security`,
      gemini: `gemini docs ${activeFile.path} --write-jsdoc`,
      codex: `codex test ${activeFile.path} --coverage`,
      gh: `gh pr list --state open`,
    };

    const assistantEntry: ChatbookMessage = {
      id: `cb-ai-${Date.now() + 1}`,
      agent,
      role: 'assistant',
      title: `Resposta ${agent.toUpperCase()} CLI · Foco: ${activeFile.name}`,
      content: `Análise concluída para "${promptText}" na branch ${workspace.activeBranch}. Abaixo está o trecho recomendado pronto para inserção no editor ou execução no terminal.`,
      codeSnippet: replySnippetMap[agent],
      suggestedCommand: replyCmdMap[agent],
      timestamp: formatCurrentTime().slice(0, 5),
      saved: true,
    };

    setChatbookMessages((prev) => [assistantEntry, userEntry, ...prev]);
    appendTerminalLog(
      agent,
      `chatbook ask --agent ${agent} "${promptText}"`,
      assistantEntry.content
    );
  };

  const handleToggleSaveChatbookMessage = (msgId: string) => {
    setChatbookMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, saved: !m.saved } : m))
    );
  };

  const handleInsertSnippetToEditor = (codeSnippet: string) => {
    const updated = `${activeFile.content.trimEnd()}\n\n${codeSnippet}\n`;
    handleSaveFileContent(activeFile.path, updated);
    handleSelectTopView('editor');
    setSaveToast(`Trecho do Chatbook inserido e salvo em ${activeFile.path}.`);
  };

  const handleSwitchBranch = (branch: string) => {
    setWorkspace((prev) => ({ ...prev, activeBranch: branch }));
    appendTerminalLog('gh', `git checkout ${branch}`, `Switched to branch '${branch}'`);
  };

  const handleCreateBranch = (newBranch: string) => {
    setWorkspace((prev) => ({
      ...prev,
      branches: prev.branches.includes(newBranch)
        ? prev.branches
        : [newBranch, ...prev.branches],
      activeBranch: newBranch,
    }));
    appendTerminalLog(
      'gh',
      `git checkout -b ${newBranch}`,
      `Switched to a new branch '${newBranch}'`
    );
  };

  const handleToggleStageFile = (filePath: string) => {
    setWorkspace((prev) => {
      const exists = prev.stagedFiles.includes(filePath);
      return {
        ...prev,
        stagedFiles: exists
          ? prev.stagedFiles.filter((p) => p !== filePath)
          : [...prev.stagedFiles, filePath],
      };
    });
  };

  const handleCreateCommit = (message: string) => {
    const newHash = Math.random().toString(16).slice(2, 9);
    const changedCount = Math.max(1, workspace.stagedFiles.length);
    setWorkspace((prev) => ({
      ...prev,
      commits: [
        {
          hash: newHash,
          message,
          author: 'markshzinho',
          branch: prev.activeBranch,
          timestamp: 'Agora',
          filesChanged: changedCount,
        },
        ...prev.commits,
      ],
      files: prev.files.map((f) =>
        prev.stagedFiles.includes(f.path) ? { ...f, modified: false } : f
      ),
      stagedFiles: [],
    }));
    appendTerminalLog(
      'gh',
      `git commit -m "${message}"`,
      `[${workspace.activeBranch} ${newHash}] ${message}\n ${changedCount} file(s) changed.`
    );
  };

  const handlePushBranch = () => {
    appendTerminalLog(
      'gh',
      `git push -u origin ${workspace.activeBranch}`,
      `Enumerating objects: 9, done.\nTo github.com:devforge/core-engine.git\n   a8f4c21..HEAD  ${workspace.activeBranch} -> ${workspace.activeBranch}`
    );
  };

  const handleCreatePullRequest = (
    title: string,
    description: string,
    targetBranch: string
  ) => {
    const nextNumber =
      Math.max(40, ...workspace.pullRequests.map((p) => p.number)) + 1;
    setWorkspace((prev) => ({
      ...prev,
      pullRequests: [
        {
          number: nextNumber,
          title,
          sourceBranch: prev.activeBranch,
          targetBranch,
          status: 'Open',
          checks: 'Passing',
          reviewerAgent: 'Gemini CLI + Codex CLI',
          createdAt: 'Agora',
          description,
        },
        ...prev.pullRequests,
      ],
    }));
    appendTerminalLog(
      'gh',
      `gh pr create --base ${targetBranch} --head ${workspace.activeBranch} --title "${title}"`,
      `Pull Request #${nextNumber} criado com sucesso: https://github.com/devforge/core-engine/pull/${nextNumber}`
    );
  };

  const handleMergePullRequest = (prNumber: number) => {
    setWorkspace((prev) => ({
      ...prev,
      pullRequests: prev.pullRequests.map((pr) =>
        pr.number === prNumber ? { ...pr, status: 'Merged' } : pr
      ),
    }));
    appendTerminalLog(
      'gh',
      `gh pr merge ${prNumber} --squash --delete-branch`,
      `✓ Squashed and merged pull request #${prNumber} into main.`
    );
  };

  const handleAddTask = (
    title: string,
    cliAgent: Exclude<CliProviderId, 'system'>,
    priority: 'High' | 'Medium' | 'Low',
    linkedFile: string,
    automatedCommand: string
  ) => {
    const nextIdx = workspace.tasks.length + 101;
    setWorkspace((prev) => ({
      ...prev,
      tasks: [
        {
          id: `tsk-${Date.now()}`,
          key: `DEV-${nextIdx}`,
          title,
          status: 'In Progress',
          priority,
          cliAgent,
          branch: prev.activeBranch,
          linkedFile,
          automatedCommand,
          updatedAt: 'Agora',
        },
        ...prev.tasks,
      ],
    }));
  };

  const handleAdvanceTaskStatus = (taskId: string) => {
    const order: DevTask['status'][] = [
      'Backlog',
      'In Progress',
      'In Review',
      'Completed',
    ];
    setWorkspace((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => {
        if (t.id !== taskId) return t;
        const idx = order.indexOf(t.status);
        const nextStatus = order[(idx + 1) % order.length];
        return { ...t, status: nextStatus, updatedAt: 'Agora' };
      }),
    }));
  };

  const handleRunTaskCommand = (task: DevTask) => {
    handleExecuteCommand(task.automatedCommand, task.cliAgent);
    setWorkspace((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) =>
        t.id === task.id ? { ...t, status: 'Completed', updatedAt: 'Agora' } : t
      ),
    }));
  };

  const handleSynthesizeNewTest = (filePath: string) => {
    const targetFile =
      workspace.files.find((f) => f.path === filePath) || activeFile;
    const { newTestResult, generatedTestCode } = synthesizeUnitTestForFile(
      targetFile,
      workspace.testResults.length
    );
    setWorkspace((prev) => ({
      ...prev,
      testResults: [newTestResult, ...prev.testResults],
    }));
    appendTerminalLog(
      'codex',
      `codex synthesize-test ${targetFile.path}`,
      `[Codex CLI 1.3] Nova suíte gerada (${newTestResult.suite}):\n${generatedTestCode}`
    );
  };

  const handleRunTestSuite = () => {
    setIsRunningTests(true);
    setWorkspace((prev) => ({
      ...prev,
      testResults: prev.testResults.map((t) => ({
        ...t,
        status: 'Pass',
        durationMs: Math.max(4, t.durationMs - 1),
      })),
    }));
    appendTerminalLog(
      'codex',
      'codex test --coverage && npm test',
      `✔ ${workspace.testResults.length} suítes aprovadas · Cobertura de linhas: 91.3% · Zero regressões.`
    );
    setTimeout(() => setIsRunningTests(false), 180);
  };

  const handleRunCiPipeline = () => {
    setIsRunningPipeline(true);
    setWorkspace((prev) => ({
      ...prev,
      pipelineStages: prev.pipelineStages.map((s) => ({
        ...s,
        status: 'Passed',
      })),
    }));
    appendTerminalLog(
      'gh',
      `gh workflow run ci-pipeline.yml --ref ${workspace.activeBranch}`,
      `✔ Pipeline CI/CD concluído (4/4 etapas aprovadas: Lint, Gemini/Grok Audit, Codex Tests, GitHub Release).`
    );
    setTimeout(() => setIsRunningPipeline(false), 200);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-[#0284C7]">
      {/* Top Bar / Sidebar Superior (Modo Light) */}
      <header className="flex items-center justify-between gap-6 px-6 py-3.5 border-b border-[#E5E0D8] bg-[#FFFDF9] sticky top-0 z-30">
        {/* Zone 1: Mobile Menu Trigger + Single Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setMobileSidebarOpen((prev) => !prev)}
            aria-label="Alternar Sidebar Lateral"
            className="lg:hidden p-1.5 rounded-lg border border-[#E5E0D8] text-[#B83314] hover:bg-[#F3EFE6]"
          >
            <Menu size={18} />
          </button>
          <a
            href="#terminal"
            onClick={(e) => {
              e.preventDefault();
              handleSelectTopView('terminal');
            }}
            className="text-lg font-bold tracking-tight text-[#B83314] font-display whitespace-nowrap shrink-0"
          >
            DevForge CLI Studio
          </a>
        </div>

        {/* Zone 2: 5 concise single-line text navigation links */}
        <nav
          aria-label="Sidebar Superior Principal"
          className="hidden md:flex items-center gap-6 text-sm font-semibold"
        >
          <a
            href="#terminal"
            onClick={(e) => {
              e.preventDefault();
              handleSelectTopView('terminal');
            }}
            className={`transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
              activeTab === 'terminal'
                ? 'text-[#B83314] border-b-2 border-[#B83314]'
                : 'text-[#57534E] hover:text-[#0284C7]'
            }`}
          >
            Painel Central & CLIs
          </a>
          <a
            href="#editor"
            onClick={(e) => {
              e.preventDefault();
              handleSelectTopView('editor');
            }}
            className={`transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
              activeTab === 'editor'
                ? 'text-[#B83314] border-b-2 border-[#B83314]'
                : 'text-[#57534E] hover:text-[#0284C7]'
            }`}
          >
            Editor & IA
          </a>
          <a
            href="#github"
            onClick={(e) => {
              e.preventDefault();
              handleSelectTopView('github');
            }}
            className={`transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
              activeTab === 'github'
                ? 'text-[#B83314] border-b-2 border-[#B83314]'
                : 'text-[#57534E] hover:text-[#0284C7]'
            }`}
          >
            Pipeline Git & PRs
          </a>
          <a
            href="#tasks"
            onClick={(e) => {
              e.preventDefault();
              handleSelectTopView('tasks');
            }}
            className={`transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
              activeTab === 'tasks'
                ? 'text-[#B83314] border-b-2 border-[#B83314]'
                : 'text-[#57534E] hover:text-[#0284C7]'
            }`}
          >
            Agenda & CI/CD
          </a>
          <a
            href="#chatbook"
            onClick={(e) => {
              e.preventDefault();
              handleSelectTopView('chatbook');
            }}
            className={`transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
              activeTab === 'chatbook'
                ? 'text-[#E11D74] border-b-2 border-[#E11D74]'
                : 'text-[#57534E] hover:text-[#E11D74]'
            }`}
          >
            Chatbook IA
          </a>
        </nav>

        {/* Zone 3: 1 primary action button */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={handleGlobalSaveWorkspace}
            className="px-4 py-2 text-xs font-bold text-[#FFF4D6] bg-[#B83314] hover:bg-[#9E2B10] rounded-xl shadow-xs transition-colors whitespace-nowrap shrink-0"
          >
            Salvar Workspace
          </button>
        </div>
      </header>

      {/* Sub-Barra / Sidebar Superior de Ações Rápidas, SVGs das Empresas & Autocompletar */}
      <div
        aria-label="Barra Superior Multi-CLI e Autocompletar"
        className="px-6 py-2.5 border-b border-[#E5E0D8] bg-[#F3EFE6] flex flex-wrap items-center justify-between gap-4"
      >
        {/* Company SVG Badges in Top Sidebar */}
        <div className="flex flex-wrap items-center gap-2.5">
          {workspace.cliTools.map((tool) => (
            <button
              key={tool.id}
              type="button"
              onClick={() => {
                setQuickCliInput(`${tool.binary} `);
              }}
              className="px-2.5 py-1 rounded-lg border border-[#E5E0D8] bg-[#FFFDF9] hover:border-[#0284C7] text-xs font-mono text-[#0284C7] hover:text-[#B45309] transition-colors flex items-center gap-1.5 whitespace-nowrap"
            >
              <CompanyLogoSvg provider={tool.id} className="w-4 h-4 shrink-0" />
              <span className="font-semibold">
                {tool.code} {tool.name}
              </span>
              <span className="text-[#E11D74]">({tool.avgLatencyMs}ms)</span>
            </button>
          ))}
        </div>

        {/* Global Quick CLI Input with Live Autocomplete */}
        <form
          onSubmit={handleQuickCliSubmit}
          className="flex-1 min-w-[280px] max-w-xl flex items-center gap-2"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#D97706] shrink-0" />
          <input
            type="text"
            value={quickCliInput}
            onChange={(e) => setQuickCliInput(e.target.value)}
            aria-label="Comando rápido com autocompletar"
            placeholder="Autocompletar rápido: digite grok, gemini, codex ou gh..."
            className="w-full bg-[#FFFDF9] border border-[#E5E0D8] rounded-lg px-3 py-1.5 text-xs font-mono text-[#0284C7] placeholder:text-[#78716C] focus:outline-none focus:border-[#0284C7]"
          />
          <button
            type="submit"
            disabled={isExecutingCli}
            className="px-3.5 py-1.5 bg-[#0284C7]/12 hover:bg-[#0284C7]/20 border border-[#0284C7]/40 text-[#0284C7] text-xs font-bold rounded-lg flex items-center gap-1 whitespace-nowrap shrink-0"
          >
            <Play className="w-3 h-3 text-[#E11D74]" />
            <span>Executar</span>
          </button>
        </form>

        {/* Save Status Indicator */}
        <div className="text-xs font-mono font-semibold text-[#B45309] tabular-nums flex items-center gap-2 whitespace-nowrap shrink-0">
          <Save className="w-3.5 h-3.5 text-[#0284C7]" />
          <span>Salvo: {lastSavedAt}</span>
        </div>
      </div>

      {/* Live Autocomplete Dropdown strip when typing in Top Bar */}
      {quickCliInput.trim().length > 0 && quickAutocompleteList.length > 0 && (
        <div className="px-6 py-2 bg-[#FFFDF9] border-b border-[#D97706]/35 flex flex-wrap items-center gap-2">
          <span className="text-xs font-mono font-semibold text-[#B45309]">
            Sugestões Autocompletar:
          </span>
          {quickAutocompleteList.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setQuickCliInput('');
                handleExecuteCommand(item.command, item.provider);
              }}
              className="px-2.5 py-1 rounded-lg border border-[#E11D74]/40 bg-[#F3EFE6] text-xs font-mono text-[#0284C7] hover:text-[#B83314] flex items-center gap-1.5"
            >
              <CompanyLogoSvg provider={item.provider} className="w-3.5 h-3.5" />
              <span>{item.command}</span>
            </button>
          ))}
        </div>
      )}

      {saveToast && (
        <div
          role="status"
          className="px-6 py-2 bg-[#FFFDF9] border-b border-[#D97706]/40 text-xs font-mono text-[#B45309] flex items-center justify-between"
        >
          <span>{saveToast}</span>
          <button
            type="button"
            onClick={() => setSaveToast(null)}
            className="text-[#E11D74] hover:text-[#DC2626] font-bold"
          >
            Fechar
          </button>
        </div>
      )}

      {/* Main Workspace Canvas: Sidebar Lateral Light Mode + Main Content Viewport */}
      <div className="flex-1 flex flex-col lg:flex-row">
        <Sidebar
          activeTab={activeSidebarTab}
          onSelectTab={handleSelectSidebarTab}
          activeBrand={activeBrand}
          onToggleBrand={() =>
            setActiveBrand((prev) => (prev === 'atlasgr' ? 'totaltrack' : 'atlasgr'))
          }
          cliTools={workspace.cliTools}
          files={workspace.files}
          activeFilePath={activeFilePath}
          onSelectFile={(path) => setActiveFilePath(path)}
          onSaveWorkspace={handleGlobalSaveWorkspace}
          onResetWorkspace={handleResetWorkspace}
          onExportExtractorReport={handleExportExtractorReport}
          mobileOpen={mobileSidebarOpen}
          onCloseMobile={() => setMobileSidebarOpen(false)}
        />

        {/* Main Content Viewport */}
        <main className="flex-1 p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {/* Contextual Active Sidebar Module Header */}
          <div className="rounded-xl border border-[#E5E0D8] bg-[#FFFDF9] p-4 flex flex-wrap items-center justify-between gap-4 shadow-2xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5 text-xs font-mono">
                <span className="text-[#B83314] font-bold uppercase tracking-widest">
                  {currentModuleMeta.section}
                </span>
                <span className="text-[#78716C]">•</span>
                <span className="text-[#B45309] font-semibold">
                  Operação: {activeBrand === 'atlasgr' ? 'AtlasGR' : 'Total Trac'}
                </span>
                <span className="text-[#78716C]">•</span>
                <span className="text-[#0284C7] font-semibold">
                  Branch: {workspace.activeBranch}
                </span>
              </div>
              <h2 className="text-lg font-bold text-[#B83314] font-display">
                {currentModuleMeta.label}
              </h2>
              <p className="text-xs text-[#57534E]">{currentModuleMeta.description}</p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => handleExecuteCommand(currentModuleMeta.defaultCliCommand)}
                className="px-3.5 py-2 rounded-xl bg-[#B83314]/12 hover:bg-[#B83314]/20 border border-[#B83314]/40 text-xs font-mono font-bold text-[#B83314] flex items-center gap-2 transition-colors"
              >
                <Terminal className="w-3.5 h-3.5 text-[#0284C7]" />
                <span>Executar CLI: {currentModuleMeta.defaultCliCommand}</span>
              </button>
              <button
                type="button"
                onClick={handleGlobalSaveWorkspace}
                className="px-3 py-2 rounded-xl bg-[#0284C7]/12 hover:bg-[#0284C7]/20 border border-[#0284C7]/40 text-xs font-bold text-[#0284C7] flex items-center gap-1.5 transition-colors"
              >
                <Save className="w-3.5 h-3.5 text-[#B45309]" />
                <span>Salvar Módulo</span>
              </button>
            </div>
          </div>

          {activeTab === 'terminal' && (
            <TerminalHubView
              cliTools={workspace.cliTools}
              terminalLogs={workspace.terminalLogs}
              activeBranch={workspace.activeBranch}
              activeFile={activeFile}
              files={workspace.files}
              isExecutingCli={isExecutingCli}
              onExecuteCommand={handleExecuteCommand}
              onClearLogs={() =>
                setWorkspace((prev) => ({ ...prev, terminalLogs: [] }))
              }
              onSaveWorkspaceSnapshot={handleGlobalSaveWorkspace}
              onNavigateView={(view) => handleSelectTopView(view)}
            />
          )}

          {activeTab === 'editor' && (
            <LocalEditorView
              files={workspace.files}
              activeFilePath={activeFilePath}
              onSelectFile={(path) => setActiveFilePath(path)}
              onSaveFileContent={handleSaveFileContent}
              onCreateNewFile={handleCreateNewFile}
              onInstallDependency={handleInstallDependency}
              onAppendToReadme={handleAppendToReadme}
              onLogTerminal={(provider, cmd, output) =>
                appendTerminalLog(provider, cmd, output)
              }
            />
          )}

          {activeTab === 'github' && (
            <GitGithubView
              activeBranch={workspace.activeBranch}
              branches={workspace.branches}
              stagedFiles={workspace.stagedFiles}
              files={workspace.files}
              commits={workspace.commits}
              pullRequests={workspace.pullRequests}
              onSwitchBranch={handleSwitchBranch}
              onCreateBranch={handleCreateBranch}
              onToggleStageFile={handleToggleStageFile}
              onCreateCommit={handleCreateCommit}
              onPushBranch={handlePushBranch}
              onCreatePullRequest={handleCreatePullRequest}
              onMergePullRequest={handleMergePullRequest}
            />
          )}

          {activeTab === 'tasks' && (
            <TasksAndCiView
              tasks={workspace.tasks}
              testResults={workspace.testResults}
              pipelineStages={workspace.pipelineStages}
              isRunningTests={isRunningTests}
              isRunningPipeline={isRunningPipeline}
              onAddTask={handleAddTask}
              onAdvanceTaskStatus={handleAdvanceTaskStatus}
              onRunTaskCommand={handleRunTaskCommand}
              onRunTestSuite={handleRunTestSuite}
              onSynthesizeNewTest={handleSynthesizeNewTest}
              onRunCiPipeline={handleRunCiPipeline}
            />
          )}

          {activeTab === 'chatbook' && (
            <ChatbookView
              messages={chatbookMessages}
              activeFile={activeFile}
              activeBranch={workspace.activeBranch}
              files={workspace.files}
              onSendMessage={handleSendChatbookMessage}
              onToggleSaveMessage={handleToggleSaveChatbookMessage}
              onSaveAllChatbook={handleGlobalSaveWorkspace}
              onInsertSnippetToEditor={handleInsertSnippetToEditor}
              onExecuteSuggestedCommand={(cmd, agent) =>
                handleExecuteCommand(cmd, agent)
              }
            />
          )}
        </main>
      </div>
    </div>
  );
}
