import React, { useState } from 'react';
import {
  Terminal,
  Play,
  Trash2,
  ArrowUpRight,
  FolderGit2,
  Save,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import {
  CliProviderId,
  CliToolConfig,
  TerminalLogEntry,
  ProjectFile,
  getCliAutocompleteSuggestions,
} from '../utils/cliEngine';
import { CompanyLogoSvg } from './CompanyLogos';

interface TerminalHubViewProps {
  cliTools: CliToolConfig[];
  terminalLogs: TerminalLogEntry[];
  activeBranch: string;
  activeFile: ProjectFile;
  files: ProjectFile[];
  isExecutingCli: boolean;
  executionProgressPct?: number;
  activeCliCommand?: string;
  healthById?: Record<
    string,
    {
      apiConfigured: boolean;
      execution: 'provider-api' | 'local-engine';
      model: string;
      authSource?: 'session' | 'env' | 'none';
    }
  >;
  onExecuteCommand: (command: string, forcedProvider?: CliProviderId) => Promise<void>;
  onClearLogs: () => void;
  onSaveWorkspaceSnapshot: () => void;
  onNavigateView: (view: 'terminal' | 'editor' | 'github' | 'tasks' | 'chatbook') => void;
}

const PRESET_COMMANDS: Array<{
  label: string;
  code: string;
  provider: Exclude<CliProviderId, 'system'>;
  command: string;
  description: string;
}> = [
  {
    label: 'Diagnóstico de Segurança (Grok 1.1)',
    code: '1.1',
    provider: 'grok',
    command: 'grok analyze src/auth/tokenGuard.ts --security --race-conditions',
    description: 'Inspeciona vulnerabilidades de escopo, clock skew e concorrência.',
  },
  {
    label: 'Documentação Automática (Gemini 1.2)',
    code: '1.2',
    provider: 'gemini',
    command: 'gemini docs src/core/orderProcessor.ts --write-jsdoc',
    description: 'Gera cabeçalhos JSDoc e resumo técnico Markdown diretamente no módulo.',
  },
  {
    label: 'Síntese de Testes Unitários (Codex 1.3)',
    code: '1.3',
    provider: 'codex',
    command: 'codex test src/core/orderProcessor.ts --coverage',
    description: 'Executa suíte de testes determinísticos e valida cobertura de código.',
  },
  {
    label: 'Status & Merge de PR (GitHub 1.4)',
    code: '1.4',
    provider: 'gh',
    command: 'gh pr list --state open',
    description: 'Lista Pull Requests ativos com status de checks e revisores IA.',
  },
  {
    label: 'Fan-out entre empresas (DevForge)',
    code: '1.0',
    provider: 'grok',
    command: 'devforge fanout auditar tokenGuard, documentar o contrato e preparar o pull request',
    description: 'Encaminha a mesma intenção para xAI, Google e GitHub, com handoff.',
  },
];

export const TerminalHubView: React.FC<TerminalHubViewProps> = ({
  cliTools,
  terminalLogs,
  activeBranch,
  activeFile,
  files,
  isExecutingCli,
  executionProgressPct = 0,
  activeCliCommand = '',
  healthById,
  onExecuteCommand,
  onClearLogs,
  onSaveWorkspaceSnapshot,
  onNavigateView,
}) => {
  const [commandInput, setCommandInput] = useState('');
  const [selectedCliFilter, setSelectedCliFilter] = useState<'all' | CliProviderId>('all');
  const [activeCliBinary, setActiveCliBinary] = useState<Exclude<CliProviderId, 'system'>>('gemini');
  const [saveBanner, setSaveBanner] = useState<string | null>(null);

  const autocompleteSuggestions = getCliAutocompleteSuggestions(
    commandInput,
    files,
    activeBranch
  );

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = commandInput.trim();
    if (!trimmed) return;
    setCommandInput('');
    await onExecuteCommand(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Tab' && autocompleteSuggestions.length > 0) {
      e.preventDefault();
      setCommandInput(autocompleteSuggestions[0].command);
    }
  };

  const handlePrefixSelect = (tool: CliToolConfig) => {
    setActiveCliBinary(tool.id);
    if (!commandInput.trim().startsWith(tool.binary)) {
      setCommandInput(`${tool.binary} `);
    }
  };

  const handleTriggerSave = () => {
    onSaveWorkspaceSnapshot();
    setSaveBanner('Sessão do Terminal e estado Multi-CLI salvos localmente.');
  };

  const filteredLogs =
    selectedCliFilter === 'all'
      ? terminalLogs
      : terminalLogs.filter((log) => log.provider === selectedCliFilter);

  return (
    <div className="space-y-8">
      {/* Section 1: Unified Multi-CLI Matrix (1.1 Grok, 1.2 Gemini, 1.3 Codex, 1.4 GitHub CLI) */}
      <section aria-labelledby="cli-matrix-heading">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-4">
          <div>
            <h1 id="cli-matrix-heading" className="text-2xl font-bold tracking-tight text-[#0284C7]">
              Orquestrador Multi-CLI Unificado
            </h1>
            <p className="text-sm text-[#57534E] mt-1">
              Plano de controle entre xAI, Google, OpenAI, Anthropic e GitHub. A política escolhe a empresa; a API responde quando a chave existe.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-xs text-[#B45309] font-mono font-semibold tabular-nums whitespace-nowrap shrink-0">
              <span>Branch: {activeBranch}</span>
              <span className="mx-2 text-[#E11D74]" aria-hidden="true">·</span>
              <span>Foco: {activeFile.path}</span>
            </div>
            <button
              type="button"
              onClick={handleTriggerSave}
              className="px-3 py-1.5 rounded-lg border border-[#D97706]/50 bg-[#D97706]/10 hover:bg-[#D97706]/20 text-xs font-mono font-semibold text-[#B45309] flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <Save className="w-3.5 h-3.5 text-[#0284C7]" />
              <span>Salvar Sessão</span>
            </button>
          </div>
        </div>

        {saveBanner && (
          <div
            role="status"
            className="mb-4 px-4 py-2 rounded-lg border border-[#D97706]/50 bg-[#FFFDF9] text-xs text-[#B45309] flex items-center justify-between"
          >
            <span>{saveBanner}</span>
            <button
              type="button"
              onClick={() => setSaveBanner(null)}
              className="text-[#E11D74] hover:text-[#DC2626] font-bold"
            >
              Fechar
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
          {cliTools.map((tool) => {
            const isSelected = activeCliBinary === tool.id;
            const health = healthById?.[tool.id];
            const connection = !health
              ? 'verificando'
              : health.authSource === 'session'
                ? `sessão Grok · ${health.model}`
                : health.execution === 'provider-api'
                  ? `API · ${health.model}`
                  : health.apiConfigured
                    ? 'credencial ok · motor local'
                    : 'motor local';
            const borderAccent =
              tool.id === 'grok'
                ? 'border-[#E11D74] shadow-xs'
                : tool.id === 'gemini'
                ? 'border-[#0284C7] shadow-xs'
                : tool.id === 'codex'
                ? 'border-[#D97706] shadow-xs'
                : tool.id === 'claude'
                ? 'border-[#B45309] shadow-xs'
                : 'border-[#B83314] shadow-xs';
            return (
              <div
                key={tool.id}
                className={`p-5 rounded-xl border transition-colors bg-[#FFFDF9] ${
                  isSelected ? borderAccent : 'border-[#E5E0D8] hover:border-[#0284C7]/60'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-mono font-semibold text-[#0284C7] tabular-nums flex items-center gap-2">
                    <CompanyLogoSvg provider={tool.id} className="w-5 h-5 shrink-0" />
                    <span>{tool.code} · {tool.binary}</span>
                  </span>
                  <span className="text-xs font-mono font-semibold text-[#B45309] tabular-nums">
                    {connection}
                  </span>
                </div>

                <h2 className="text-base font-bold text-[#B83314] mt-2.5 flex items-center gap-2">
                  <span>{tool.company} · {tool.name}</span>
                </h2>

                <p className="text-xs text-[#57534E] mt-1.5 leading-relaxed min-h-[3.25rem]">
                  {tool.specialty}
                </p>

                <div className="mt-4 pt-3 border-t border-[#E5E0D8] flex items-center justify-between text-xs text-[#E11D74] font-mono tabular-nums">
                  <span>{tool.version}</span>
                  <span>{tool.commandsExecuted} execuções</span>
                </div>

                <button
                  type="button"
                  onClick={() => handlePrefixSelect(tool)}
                  className="mt-3 w-full py-2 px-3 text-xs font-semibold text-[#0284C7] bg-[#F3EFE6] hover:bg-[#EAE5D9] border border-[#0284C7]/35 rounded-lg transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap"
                >
                  <span>Usar {tool.binary} no Terminal</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-[#B45309]" />
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Section 2: Interactive Multiplexed Terminal Console with Autocomplete & Suggestions */}
      <section aria-labelledby="terminal-repl-heading" className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 border border-[#E5E0D8] rounded-xl bg-[#FFFDF9] overflow-hidden shadow-2xs">
          {/* Terminal Toolbar */}
          <div className="px-4 py-3 border-b border-[#E5E0D8] flex flex-wrap items-center justify-between gap-3 bg-[#F3EFE6]">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-[#0284C7]" />
              <h2 id="terminal-repl-heading" className="text-sm font-bold text-[#B83314]">
                Terminal Integrado DevForge
              </h2>
              <span className="text-xs text-[#57534E] font-mono tabular-nums">
                · /workspace/devforge-core ({activeBranch})
              </span>
            </div>

            <div className="flex items-center gap-1 bg-[#FAF8F5] p-1 rounded-lg border border-[#E5E0D8]">
              {(['all', 'grok', 'gemini', 'codex', 'claude', 'gh'] as const).map((filterKey) => (
                <button
                  key={filterKey}
                  type="button"
                  onClick={() => setSelectedCliFilter(filterKey)}
                  className={`px-2.5 py-1 text-xs font-mono rounded-md transition-colors whitespace-nowrap ${
                    selectedCliFilter === filterKey
                      ? 'bg-[#B83314] text-[#FFF4D6] font-bold'
                      : 'text-[#57534E] hover:text-[#0284C7]'
                  }`}
                >
                  {filterKey === 'all' ? 'Todos' : filterKey}
                </button>
              ))}
              <button
                type="button"
                onClick={onClearLogs}
                aria-label="Limpar histórico do terminal"
                className="px-2 py-1 text-xs text-[#DC2626] hover:text-[#E11D74] transition-colors ml-1"
                title="Limpar terminal"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Inline Terminal Loading & Progress Bar */}
          {(isExecutingCli || executionProgressPct > 0) && (
            <div
              role="status"
              data-testid="terminal-inline-progress"
              className="px-4 py-2 bg-[#FFFDF9] border-b border-[#B83314]/35 space-y-1"
            >
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-[#B83314] font-bold">
                  Executando no Terminal: $ {activeCliCommand || 'cli task'}
                </span>
                <span className="text-[#B45309] font-bold tabular-nums">
                  {Math.max(8, executionProgressPct)}%
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-[#F3EFE6] overflow-hidden">
                <div className="h-full w-3/4 rounded-full bg-gradient-to-r from-[#0284C7] via-[#E11D74] to-[#B83314] animate-pulse" />
              </div>
            </div>
          )}

          {/* Terminal Output Stream */}
          <div
            data-testid="terminal-log-stream"
            className="p-4 space-y-4 max-h-[340px] min-h-[240px] overflow-y-auto font-mono text-xs bg-[#FAF8F5]"
          >
            {filteredLogs.length === 0 ? (
              <div className="py-12 text-center text-[#57534E]">
                <p>Nenhum comando registrado para este filtro.</p>
                <p className="mt-1">Selecione uma sugestão ao lado ou use o autocompletar abaixo.</p>
              </div>
            ) : (
              filteredLogs.map((entry) => (
                <div key={entry.id} className="space-y-1.5 pb-3 border-b border-[#E5E0D8] last:border-none">
                  <div className="flex items-center justify-between text-[#57534E] tabular-nums">
                    <div className="flex items-center gap-2">
                      <CompanyLogoSvg provider={entry.provider} className="w-4 h-4 shrink-0" />
                      <span className="text-[#0284C7] font-bold">$ {entry.command}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px]">
                      <span className="text-[#B45309] font-semibold">CLI: {entry.provider.toUpperCase()}</span>
                      <span aria-hidden="true">·</span>
                      <span>{entry.timestamp}</span>
                      <span aria-hidden="true">·</span>
                      <span className={entry.exitCode === 0 ? 'text-[#0284C7] font-semibold' : 'text-[#DC2626] font-semibold'}>
                        exit {entry.exitCode}
                      </span>
                    </div>
                  </div>
                  <pre className="text-[#57534E] whitespace-pre-wrap leading-relaxed pl-3 border-l-2 border-[#E11D74]/60">
                    {entry.output}
                  </pre>
                </div>
              ))
            )}
          </div>

          {/* Interactive Autocomplete & Suggestions Bar inside Terminal */}
          <div className="px-4 py-2.5 border-t border-[#E5E0D8] bg-[#FFFDF9] space-y-2">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-[#B45309] font-semibold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#E11D74]" />
                <span>Autocompletar & Sugestões de Comandos (Tab ou Clique):</span>
              </span>
              <span className="text-[#57534E] tabular-nums">
                {autocompleteSuggestions.length} sugestões ativas
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {autocompleteSuggestions.map((sug) => (
                <button
                  key={sug.id}
                  type="button"
                  onClick={() => setCommandInput(sug.command)}
                  className="px-2.5 py-1 rounded-lg border border-[#E5E0D8] bg-[#F3EFE6] hover:border-[#0284C7] text-xs font-mono text-[#0284C7] hover:text-[#B83314] transition-colors flex items-center gap-1.5"
                >
                  <CompanyLogoSvg provider={sug.provider} className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate max-w-[260px]">{sug.command}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Terminal Command Input Form */}
          <form onSubmit={handleFormSubmit} className="p-3 border-t border-[#E5E0D8] bg-[#F3EFE6] flex items-center gap-3">
            <label htmlFor="cli-command-input" className="text-xs font-mono font-bold text-[#B83314] shrink-0">
              {activeBranch} $
            </label>
            <input
              id="cli-command-input"
              type="text"
              value={commandInput}
              onChange={(e) => setCommandInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Digite devforge, grok, gemini, codex, claude, gh ou pressione Tab..."
              className="w-full bg-[#FFFDF9] border border-[#E5E0D8] rounded-lg px-3 py-2 text-xs font-mono text-[#0284C7] placeholder:text-[#78716C] focus:outline-none focus:border-[#0284C7]"
            />
            <button
              type="submit"
              disabled={isExecutingCli}
              className="px-4 py-2 bg-[#B83314] hover:bg-[#9E2B10] disabled:opacity-50 text-[#FFF4D6] text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <Play className="w-3.5 h-3.5 text-[#FFF4D6]" />
              <span>{isExecutingCli ? 'Executando...' : 'Executar CLI'}</span>
            </button>
          </form>
        </div>

        {/* Quick Dispatch Macros & Context Shortcuts */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-5 border border-[#E5E0D8] rounded-xl bg-[#FFFDF9] shadow-2xs">
            <h3 className="text-sm font-bold text-[#B83314]">
              Sugestões Rápidas de Alta Produtividade
            </h3>
            <p className="text-xs text-[#57534E] mt-1">
              Dispare automações reais combinando Grok, Gemini, Codex e GitHub CLI.
            </p>

            <div className="mt-4 space-y-2.5">
              {PRESET_COMMANDS.map((preset) => (
                <div
                  key={preset.code}
                  className="p-3 rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] hover:border-[#0284C7]/60 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-[#B45309] flex items-center gap-1.5">
                      <CompanyLogoSvg provider={preset.provider} className="w-4 h-4 shrink-0" />
                      <span>{preset.label}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => onExecuteCommand(preset.command, preset.provider)}
                      className="px-2.5 py-1 text-xs font-mono font-bold bg-[#B83314]/12 hover:bg-[#B83314]/20 border border-[#B83314]/40 text-[#B83314] rounded-md transition-colors whitespace-nowrap shrink-0"
                    >
                      Rodar {preset.code}
                    </button>
                  </div>
                  <p className="text-[11px] font-mono text-[#0284C7] mt-1 truncate">
                    $ {preset.command}
                  </p>
                  <p className="text-xs text-[#57534E] mt-1">
                    {preset.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="p-5 border border-[#E5E0D8] rounded-xl bg-[#FFFDF9] space-y-3 shadow-2xs">
            <h3 className="text-sm font-bold text-[#B83314]">
              Atalhos de Fluxo Contínuo
            </h3>
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => onNavigateView('chatbook')}
                className="w-full px-3 py-2 text-left text-xs font-semibold text-[#B45309] bg-[#F3EFE6] hover:bg-[#EAE5D9] border border-[#E5E0D8] rounded-lg flex items-center justify-between transition-colors"
              >
                <span className="flex items-center gap-2">
                  <BookOpen className="w-3.5 h-3.5 text-[#E11D74]" />
                  <span>Abrir Chatbook Multi-CLI & Notas</span>
                </span>
                <ArrowUpRight className="w-3.5 h-3.5 text-[#0284C7]" />
              </button>
              <button
                type="button"
                onClick={() => onNavigateView('editor')}
                className="w-full px-3 py-2 text-left text-xs font-semibold text-[#0284C7] bg-[#F3EFE6] hover:bg-[#EAE5D9] border border-[#E5E0D8] rounded-lg flex items-center justify-between transition-colors"
              >
                <span className="flex items-center gap-2">
                  <FolderGit2 className="w-3.5 h-3.5 text-[#B45309]" />
                  <span>Abrir Editor Local & Documentação IA</span>
                </span>
                <ArrowUpRight className="w-3.5 h-3.5 text-[#57534E]" />
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
