import React, { useState, useEffect, useRef } from 'react';
import { Save, Terminal } from 'lucide-react';
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
import { buildOrchestratorPlan, executePlanLocally } from './orchestrator';
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
import { FloatingChatbook } from './components/FloatingChatbook';
import { TopBar, type TopView } from './components/TopBar';
import { useVoiceCommand } from './hooks/useVoiceCommand';
import { interpretVoiceCommand } from './voice/interpretVoice';

type ActiveWorkspaceTab = TopView;

const STORAGE_KEY = 'devforge_workspace_state_v2';
const CHATBOOK_STORAGE_KEY = 'devforge_chatbook_state_v2';

function formatCurrentTime(): string {
  const now = new Date();
  return now.toTimeString().slice(0, 8);
}

function loadPersistedWorkspace(): WorkspaceState {
  const fresh = createInitialWorkspaceState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as WorkspaceState;
      if (parsed && Array.isArray(parsed.files) && Array.isArray(parsed.cliTools)) {
        const savedById = new Map(parsed.cliTools.map((tool) => [tool.id, tool]));
        return {
          ...fresh,
          ...parsed,
          cliTools: fresh.cliTools.map((tool) => {
            const saved = savedById.get(tool.id);
            if (!saved) return tool;
            return {
              ...tool,
              commandsExecuted: saved.commandsExecuted ?? tool.commandsExecuted,
              status: saved.status ?? tool.status,
              avgLatencyMs: saved.avgLatencyMs ?? tool.avgLatencyMs,
            };
          }),
        };
      }
    }
  } catch {
    // Ignore storage errors
  }
  return fresh;
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
  const [chatbookOpen, setChatbookOpen] = useState(false);
  const [chatbookSource, setChatbookSource] = useState<SidebarTabType | null>(null);
  const [chatbookHint, setChatbookHint] = useState<string | null>(
    SIDEBAR_ITEM_METADATA.chatbook.description
  );
  const [voiceFeedback, setVoiceFeedback] = useState<string | null>(null);
  const [clock, setClock] = useState(formatCurrentTime);
  const voice = useVoiceCommand();
  const [activeFilePath, setActiveFilePath] = useState<string>('src/core/orderProcessor.ts');
  const [quickCliInput, setQuickCliInput] = useState<string>('');
  const [lastSavedAt, setLastSavedAt] = useState<string>('10:00:00');
  const [saveToast, setSaveToast] = useState<string | null>(null);
  const [isExecutingCli, setIsExecutingCli] = useState(false);
  const [agentHealth, setAgentHealth] = useState<
    Array<{
      id: string;
      apiConfigured: boolean;
      execution: 'provider-api' | 'local-engine';
      model: string;
      authSource?: 'session' | 'env' | 'none';
    }>
  >([]);
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

  useEffect(() => {
    let cancelled = false;
    fetch('/api/orchestrator/health')
      .then((response) => response.json())
      .then((data) => {
        if (!cancelled && Array.isArray(data.agents)) setAgentHealth(data.agents);
      })
      .catch(() => {
        // O motor local segue disponível sem o servidor.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => setClock(formatCurrentTime()), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!voiceFeedback && !voice.error) return;
    const id = window.setTimeout(() => {
      setVoiceFeedback(null);
      voice.clearError();
    }, 4600);
    return () => window.clearTimeout(id);
  }, [voiceFeedback, voice.error, voice.clearError]);

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
    };
    setActiveSidebarTab(defaultSidebarMap[view]);
  };

  const openChatbook = (source: SidebarTabType = 'chatbook') => {
    const meta = SIDEBAR_ITEM_METADATA[source];
    setChatbookOpen(true);
    setChatbookSource(source);
    setChatbookHint(meta?.description ?? null);
  };

  const toggleChatbook = () => {
    setChatbookOpen((open) => {
      if (open) return false;
      setChatbookSource('chatbook');
      setChatbookHint(SIDEBAR_ITEM_METADATA.chatbook.description);
      return true;
    });
  };

  const handleSelectSidebarTab = (tab: SidebarTabType) => {
    const meta = SIDEBAR_ITEM_METADATA[tab];
    if (meta?.workspaceView === 'chatbook') {
      if (chatbookOpen && chatbookSource === tab) {
        setChatbookOpen(false);
        return;
      }
      openChatbook(tab);
      return;
    }
    setActiveSidebarTab(tab);
    if (meta) setActiveTab(meta.workspaceView);
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

  const runOrchestrator = async (rawCommand: string, hintAgent?: Exclude<CliProviderId, 'system'>) => {
    setIsExecutingCli(true);
    try {
      const response = await fetch('/api/orchestrator/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: rawCommand,
          hintAgent,
          activeFilePath: activeFile.path,
          activeFileContent: activeFile.content,
          branch: workspace.activeBranch,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Falha do orquestrador');
      }
      const results = Array.isArray(data.results) ? data.results : [];
      if (results.length === 0) {
        appendTerminalLog('system', rawCommand, data.synthesis || data.output || 'Sem saída.');
        return;
      }
      for (const result of results) {
        appendTerminalLog(
          result.agent,
          result.command,
          `[${result.transport}]\n${result.output}`,
          result.exitCode ?? 0
        );
      }
      if (data.synthesis) appendTerminalLog('system', rawCommand, data.synthesis);
    } catch (error) {
      const plan = buildOrchestratorPlan(rawCommand, {
        activeFilePath: activeFile.path,
        branch: workspace.activeBranch,
        hintAgent,
      });
      const local = executePlanLocally(plan, {
        activeFilePath: activeFile.path,
        activeFileContent: activeFile.content,
        branch: workspace.activeBranch,
        health: [],
      });
      appendTerminalLog(
        'system',
        rawCommand,
        `${local.synthesis}\n\n${local.results.map((item) => item.output).join('\n\n')}\n\nServidor indisponível (${error instanceof Error ? error.message : 'erro'}).`
      );
    } finally {
      setIsExecutingCli(false);
    }
  };

  const handleExecuteCommand = async (
    rawCommand: string,
    forcedProvider?: CliProviderId
  ) => {
    const parsed = parseCliCommand(rawCommand);
    const provider = forcedProvider && forcedProvider !== 'system' ? forcedProvider : parsed.provider;

    if (parsed.binary === 'devforge') {
      await runOrchestrator(rawCommand);
      return;
    }

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

    const hint = provider === 'system' ? undefined : provider;
    await runOrchestrator(rawCommand, hint);
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

    setChatbookMessages((prev) => [userEntry, ...prev]);

    let content = '';
    let suggestedCommand = `${agent} ask --file ${activeFile.path}`;
    let codeSnippet: string | undefined;
    try {
      const response = await fetch('/api/orchestrator/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: promptText,
          hintAgent: agent,
          activeFilePath: activeFile.path,
          activeFileContent: activeFile.content,
          branch: workspace.activeBranch,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Falha do orquestrador');
      content = data.output || data.synthesis || 'Sem saída.';
      suggestedCommand = data.plan?.steps?.[0]?.command || suggestedCommand;
      const fenced = String(data.results?.[0]?.output || '').match(/```(?:[a-z]+)?\n([\s\S]*?)```/);
      codeSnippet = fenced?.[1]?.trim();
    } catch (error) {
      const plan = buildOrchestratorPlan(promptText, {
        hintAgent: agent,
        activeFilePath: activeFile.path,
        branch: workspace.activeBranch,
      });
      const local = executePlanLocally(plan, {
        activeFilePath: activeFile.path,
        activeFileContent: activeFile.content,
        branch: workspace.activeBranch,
        health: [],
      });
      content = `${local.synthesis}\n\n${local.results.map((item) => item.output).join('\n\n')}\n\nServidor indisponível (${error instanceof Error ? error.message : 'erro'}).`;
      suggestedCommand = plan.steps[0]?.command || suggestedCommand;
    }

    const assistantEntry: ChatbookMessage = {
      id: `cb-ai-${Date.now() + 1}`,
      agent,
      role: 'assistant',
      title: `Resposta ${agent.toUpperCase()} · Foco: ${activeFile.name}`,
      content,
      codeSnippet,
      suggestedCommand,
      timestamp: formatCurrentTime().slice(0, 5),
      saved: true,
    };

    setChatbookMessages((prev) => [assistantEntry, userEntry, ...prev.filter((item) => item.id !== userEntry.id)]);
    appendTerminalLog(agent, `devforge run --agent ${agent}`, content);
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

  const voiceApi = useRef({
    save: handleGlobalSaveWorkspace,
    execute: handleExecuteCommand,
    chat: handleSendChatbookMessage,
    navigate: handleSelectTopView,
  });
  voiceApi.current = {
    save: handleGlobalSaveWorkspace,
    execute: handleExecuteCommand,
    chat: handleSendChatbookMessage,
    navigate: handleSelectTopView,
  };

  useEffect(() => {
    const said = voice.transcript;
    if (!said) return;
    voice.clearTranscript();
    const action = interpretVoiceCommand(said);
    if (action.kind === 'save') {
      voiceApi.current.save();
      setVoiceFeedback('Workspace salvo por voz.');
      return;
    }
    if (action.kind === 'open-chat') {
      openChatbook('chatbook');
      setVoiceFeedback('Chatbook aberto.');
      return;
    }
    if (action.kind === 'close-chat') {
      setChatbookOpen(false);
      setVoiceFeedback('Chatbook recolhido.');
      return;
    }
    if (action.kind === 'navigate') {
      voiceApi.current.navigate(action.view);
      const labels = { terminal: 'Painel', editor: 'Editor', github: 'Git', tasks: 'Agenda' };
      setVoiceFeedback(labels[action.view] + ' aberto.');
      return;
    }
    if (action.kind === 'execute') {
      void voiceApi.current.execute(action.command);
      setVoiceFeedback('Executando: ' + action.command);
      return;
    }
    openChatbook('chatbook');
    setVoiceFeedback('Pergunta enviada ao ' + action.agent.toUpperCase() + '.');
    void voiceApi.current.chat(action.agent, action.text);
  }, [voice.transcript, voice.clearTranscript]);

  return (
    <div className="relative h-screen overflow-hidden">
      <div className="app-atmosphere" aria-hidden="true">
        <div className="orb orb-a" />
        <div className="orb orb-b" />
        <div className="orb orb-c" />
      </div>
      <div className="relative z-10 flex h-full min-h-0">
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
          chatbookOpen={chatbookOpen}
          chatbookSource={chatbookSource}
        />

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <TopBar
            activeView={activeTab}
            onSelectView={handleSelectTopView}
            onOpenMobileNav={() => setMobileSidebarOpen((prev) => !prev)}
            cliTools={workspace.cliTools}
            onFocusTool={(binary) => setQuickCliInput(binary + ' ')}
            command={quickCliInput}
            onCommandChange={setQuickCliInput}
            onCommandSubmit={handleQuickCliSubmit}
            suggestions={quickAutocompleteList}
            onRunSuggestion={(item) => {
              setQuickCliInput('');
              void handleExecuteCommand(item.command, item.provider);
            }}
            isExecuting={isExecutingCli}
            branch={workspace.activeBranch}
            savedAt={lastSavedAt}
            onSave={handleGlobalSaveWorkspace}
            listening={voice.listening}
            voiceSupported={voice.supported}
            voiceInterim={voice.interim}
            voiceFeedback={voiceFeedback}
            voiceError={voice.error}
            onToggleVoice={voice.toggle}
            clock={clock}
          />

          <main className="min-h-0 flex-1 overflow-y-auto px-4 py-5 pb-28 sm:px-6 lg:px-8">
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
              <section className="relative overflow-hidden rounded-3xl border border-white/80 bg-white/80 p-4 shadow-[0_18px_40px_-28px_rgba(68,40,20,0.45)] backdrop-blur sm:p-5">
                <div className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-[#E11D74] via-[#B83314] to-[#0284C7]" />
                <div className="flex flex-wrap items-center justify-between gap-4 pl-3">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono">
                      <span className="font-bold uppercase tracking-[0.16em] text-[#B83314]">{currentModuleMeta.section}</span>
                      <span className="rounded-full bg-[#FFF4E5] px-2 py-0.5 font-semibold text-[#B45309]">
                        {activeBrand === 'atlasgr' ? 'AtlasGR' : 'Total Trac'}
                      </span>
                      <span className="rounded-full bg-[#E0F2FE] px-2 py-0.5 font-semibold text-[#0284C7]">
                        {workspace.activeBranch}
                      </span>
                      {chatbookOpen && (
                        <span className="rounded-full bg-[#FDE7F1] px-2 py-0.5 font-semibold text-[#E11D74]">
                          Chatbook flutuante
                        </span>
                      )}
                    </div>
                    <h2 className="font-display text-xl font-bold text-[#9F2D12]">{currentModuleMeta.label}</h2>
                    <p className="max-w-3xl text-xs leading-relaxed text-[#57534E]">{currentModuleMeta.description}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleExecuteCommand(currentModuleMeta.defaultCliCommand)}
                      className="inline-flex items-center gap-2 rounded-2xl border border-[#B83314]/30 bg-[#B83314]/10 px-3 py-2 text-xs font-bold text-[#B83314]"
                    >
                      <Terminal className="h-3.5 w-3.5 text-[#0284C7]" />
                      <span className="max-w-[16rem] truncate font-mono">{currentModuleMeta.defaultCliCommand}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleGlobalSaveWorkspace}
                      className="inline-flex items-center gap-1.5 rounded-2xl border border-[#0284C7]/30 bg-[#0284C7]/10 px-3 py-2 text-xs font-bold text-[#0284C7]"
                    >
                      <Save className="h-3.5 w-3.5 text-[#B45309]" />
                      Salvar módulo
                    </button>
                  </div>
                </div>
              </section>

          {activeTab === 'terminal' && (
            <TerminalHubView
              cliTools={workspace.cliTools}
              terminalLogs={workspace.terminalLogs}
              activeBranch={workspace.activeBranch}
              activeFile={activeFile}
              files={workspace.files}
              isExecutingCli={isExecutingCli}
              healthById={Object.fromEntries(agentHealth.map((item) => [item.id, item]))}
              onExecuteCommand={handleExecuteCommand}
              onClearLogs={() =>
                setWorkspace((prev) => ({ ...prev, terminalLogs: [] }))
              }
              onSaveWorkspaceSnapshot={handleGlobalSaveWorkspace}
              onNavigateView={(view) => {
                if (view === 'chatbook') openChatbook('chatbook');
                else handleSelectTopView(view);
              }}
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


            </div>
          </main>
        </div>
      </div>

      <FloatingChatbook
        open={chatbookOpen}
        title="Chatbook"
        subtitle={activeFile.name + ' · ' + workspace.activeBranch}
        hint={chatbookHint}
        listening={voice.listening}
        voiceSupported={voice.supported}
        onToggleVoice={voice.toggle}
        onToggle={toggleChatbook}
      >
        <ChatbookView
          messages={chatbookMessages}
          activeFile={activeFile}
          activeBranch={workspace.activeBranch}
          files={workspace.files}
          onSendMessage={handleSendChatbookMessage}
          onToggleSaveMessage={handleToggleSaveChatbookMessage}
          onSaveAllChatbook={handleGlobalSaveWorkspace}
          onInsertSnippetToEditor={handleInsertSnippetToEditor}
          onExecuteSuggestedCommand={(cmd, agent) => handleExecuteCommand(cmd, agent)}
          listening={voice.listening}
          voiceSupported={voice.supported}
          interimTranscript={voice.interim}
          onToggleVoice={voice.toggle}
        />
      </FloatingChatbook>

      {saveToast && (
        <div
          role="status"
          className="fixed bottom-5 left-4 z-50 flex max-w-md items-center gap-3 rounded-2xl border border-[#F6E7C1] bg-[#FFFDF9] px-4 py-3 text-xs text-[#B45309] shadow-xl animate-pop"
        >
          <span className="min-w-0 flex-1">{saveToast}</span>
          <button type="button" onClick={() => setSaveToast(null)} className="font-bold text-[#E11D74]">
            Fechar
          </button>
        </div>
      )}
    </div>
  );
}
