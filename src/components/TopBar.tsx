import React from 'react';
import {
  FileCode2,
  GitBranch,
  LayoutDashboard,
  ListChecks,
  Menu,
  Play,
  Save,
  Sparkles,
} from 'lucide-react';
import { CompanyLogoSvg } from './CompanyLogos';
import { MicButton } from './MicButton';
import type { AutocompleteItem, CliToolStatus } from '../utils/cliEngine';

export type TopView = 'terminal' | 'editor' | 'github' | 'tasks';

const NAV: Array<{ id: TopView; label: string; icon: React.ReactNode }> = [
  { id: 'terminal', label: 'Painel', icon: <LayoutDashboard className="h-3.5 w-3.5" /> },
  { id: 'editor', label: 'Editor', icon: <FileCode2 className="h-3.5 w-3.5" /> },
  { id: 'github', label: 'Git', icon: <GitBranch className="h-3.5 w-3.5" /> },
  { id: 'tasks', label: 'Agenda', icon: <ListChecks className="h-3.5 w-3.5" /> },
];

interface TopBarProps {
  activeView: TopView;
  onSelectView: (view: TopView) => void;
  onOpenMobileNav: () => void;
  cliTools: CliToolStatus[];
  onFocusTool: (binary: string) => void;
  command: string;
  onCommandChange: (value: string) => void;
  onCommandSubmit: (event: React.FormEvent) => void;
  suggestions: AutocompleteItem[];
  onRunSuggestion: (item: AutocompleteItem) => void;
  isExecuting: boolean;
  branch: string;
  savedAt: string;
  onSave: () => void;
  listening: boolean;
  voiceSupported: boolean;
  voiceInterim: string;
  voiceFeedback: string | null;
  voiceError: string | null;
  onToggleVoice: () => void;
  clock: string;
}

export function TopBar({
  activeView,
  onSelectView,
  onOpenMobileNav,
  cliTools,
  onFocusTool,
  command,
  onCommandChange,
  onCommandSubmit,
  suggestions,
  onRunSuggestion,
  isExecuting,
  branch,
  savedAt,
  onSave,
  listening,
  voiceSupported,
  voiceInterim,
  voiceFeedback,
  voiceError,
  onToggleVoice,
  clock,
}: TopBarProps) {
  const voiceLine = voiceError || (listening ? voiceInterim || 'Ouvindo… diga abrir editor, salvar, ou faça uma pergunta.' : voiceFeedback);

  return (
    <header className="relative z-30 border-b border-[#E7E0D6]/80 bg-[#FFFCF8]/80 backdrop-blur-xl">
      <div className="flex h-16 items-center gap-3 px-3 sm:px-4">
        <button
          type="button"
          onClick={onOpenMobileNav}
          aria-label="Abrir sidebar"
          className="grid h-10 w-10 place-items-center rounded-xl border border-[#E7E0D6] bg-white text-[#B83314] lg:hidden"
        >
          <Menu className="h-4 w-4" />
        </button>

        <div className="hidden min-w-0 items-center gap-2.5 xl:flex">
          <span className="logo-glow grid h-9 w-9 place-items-center rounded-2xl bg-gradient-to-br from-[#B83314] to-[#E11D74] text-sm font-black text-[#FFF7ED]">
            D
          </span>
          <div className="leading-tight">
            <p className="font-display text-sm font-bold tracking-tight text-[#9F2D12]">DevForge</p>
            <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#0284C7]">
              <span className="live-dot" />
              Studio · {clock}
            </p>
          </div>
        </div>

        <nav aria-label="Barra superior" className="hidden items-center gap-1 rounded-2xl border border-[#E7E0D6] bg-white/70 p-1 md:flex">
          {NAV.map((item) => {
            const active = activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectView(item.id)}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                  active
                    ? 'bg-gradient-to-r from-[#B83314] to-[#C2410C] text-[#FFF7ED] shadow-[0_8px_16px_-12px_rgba(184,51,20,0.9)]'
                    : 'text-[#57534E] hover:bg-[#FAF6F1] hover:text-[#B83314]'
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            );
          })}
        </nav>

        <form onSubmit={onCommandSubmit} className="relative mx-auto hidden min-w-[240px] max-w-xl flex-1 items-center lg:flex">
          <Sparkles className="pointer-events-none absolute left-3 h-3.5 w-3.5 text-[#D97706]" />
          <input
            type="text"
            value={command}
            onChange={(event) => onCommandChange(event.target.value)}
            aria-label="Comando rápido com autocompletar"
            placeholder="devforge, grok, gemini, codex, claude, gh…"
            className="h-10 w-full rounded-2xl border border-[#E7E0D6] bg-white pl-9 pr-24 text-xs font-mono text-[#0F3A56] placeholder:text-[#A8A29E] focus:border-[#0284C7] focus:outline-none focus:ring-2 focus:ring-[#0284C7]/20"
          />
          <button
            type="submit"
            disabled={isExecuting}
            className="absolute right-1.5 inline-flex h-7 items-center gap-1 rounded-xl bg-[#0284C7] px-2.5 text-[11px] font-bold text-white disabled:opacity-60"
          >
            <Play className="h-3 w-3" />
            {isExecuting ? '…' : 'Rodar'}
          </button>
          {command.trim().length > 0 && suggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-40 overflow-hidden rounded-2xl border border-[#E7E0D6] bg-white shadow-xl">
              {suggestions.slice(0, 5).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onRunSuggestion(item)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-[#FAF6F1]"
                >
                  <CompanyLogoSvg provider={item.provider} className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate font-mono text-[#0F3A56]">{item.command}</span>
                </button>
              ))}
            </div>
          )}
        </form>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <div className="hidden items-center gap-1 2xl:flex">
            {cliTools.map((tool) => (
              <button
                key={tool.id}
                type="button"
                title={`${tool.name} · ${tool.avgLatencyMs}ms`}
                onClick={() => onFocusTool(tool.binary)}
                className="grid h-9 w-9 place-items-center rounded-xl border border-[#E7E0D6] bg-white hover:border-[#0284C7]"
              >
                <CompanyLogoSvg provider={tool.id} className="h-4 w-4" />
              </button>
            ))}
          </div>

          <span className="hidden items-center gap-1.5 rounded-full border border-[#E7E0D6] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#B45309] sm:inline-flex">
            <GitBranch className="h-3 w-3 text-[#0284C7]" />
            <span className="max-w-[9rem] truncate">{branch}</span>
          </span>

          <MicButton listening={listening} supported={voiceSupported} onClick={onToggleVoice} />

          <button
            type="button"
            onClick={onSave}
            className="inline-flex h-10 items-center gap-1.5 rounded-2xl bg-[#B83314] px-3 text-xs font-bold text-[#FFF7ED] shadow-[0_10px_24px_-16px_rgba(184,51,20,1)] hover:bg-[#9F2D12]"
          >
            <Save className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Salvar</span>
          </button>
        </div>
      </div>

      <form onSubmit={onCommandSubmit} className="flex items-center gap-2 px-3 pb-3 lg:hidden">
        <input
          type="text"
          value={command}
          onChange={(event) => onCommandChange(event.target.value)}
          aria-label="Comando rápido"
          placeholder="Comando ou pergunta…"
          className="h-10 min-w-0 flex-1 rounded-2xl border border-[#E7E0D6] bg-white px-3 text-xs font-mono text-[#0F3A56] focus:border-[#0284C7] focus:outline-none"
        />
        <button
          type="submit"
          disabled={isExecuting}
          className="h-10 rounded-2xl bg-[#0284C7] px-3 text-xs font-bold text-white"
        >
          Rodar
        </button>
      </form>

      <div className="hidden items-center justify-between border-t border-[#F0E9DF] px-4 py-1.5 text-[11px] text-[#78716C] sm:flex">
        <span>Salvo às {savedAt}</span>
        <span className="font-medium text-[#57534E]">Voz: “abrir editor”, “salvar”, “executar grok analyze …”</span>
      </div>

      {voiceLine && (
        <div
          role="status"
          className="absolute left-3 right-3 top-[calc(100%+8px)] z-40 flex items-center gap-2 rounded-2xl border border-[#F6D5E4] bg-white/95 px-3 py-2 text-xs text-[#44403C] shadow-lg animate-pop sm:left-auto sm:right-4 sm:max-w-md"
        >
          {listening && (
            <span className="voice-bars" aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
            </span>
          )}
          <span className="min-w-0 truncate">{voiceLine}</span>
        </div>
      )}
      <p className="sr-only" aria-live="polite">
        {voiceLine || ''}
      </p>
    </header>
  );
}
