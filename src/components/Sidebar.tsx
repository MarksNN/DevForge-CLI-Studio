import React from 'react';
import {
  Terminal,
  Code2,
  GitBranch,
  CheckSquare,
  MessageSquare,
  ChevronRight,
  UserCog,
  Settings as SettingsIcon,
  Save,
  RotateCcw,
  FileCode,
} from 'lucide-react';
import { CompanyLogoSvg } from './CompanyLogos';
import { CliToolStatus, LocalProjectFile } from '../utils/cliEngine';

export type SidebarTabType =
  | 'terminal'
  | 'editor'
  | 'github'
  | 'tasks'
  | 'chatbook'
  | 'team'
  | 'settings';

export type OperationBrand = 'devforge' | 'multicli';

export interface SidebarItemMeta {
  id: SidebarTabType;
  label: string;
  section: 'MÓDULOS DE ENGENHARIA' | 'ADMINISTRAÇÃO';
  workspaceView: 'terminal' | 'editor' | 'github' | 'tasks' | 'chatbook';
  description: string;
  defaultCliCommand: string;
}

export const SIDEBAR_ITEM_METADATA: Record<SidebarTabType, SidebarItemMeta> = {
  terminal: {
    id: 'terminal',
    label: 'Terminal & CLIs',
    section: 'MÓDULOS DE ENGENHARIA',
    workspaceView: 'terminal',
    description:
      'Orquestrador unificado com 1.1 Grok CLI, 1.2 Gemini CLI, 1.3 Codex CLI e 1.4 GitHub CLI.',
    defaultCliCommand: 'grok analyze src/core/orderProcessor.ts --security',
  },
  editor: {
    id: 'editor',
    label: 'Editor Local & JSDoc',
    section: 'MÓDULOS DE ENGENHARIA',
    workspaceView: 'editor',
    description:
      'Edição de pastas locais, instalação de pacotes npm, diff linha a linha e revisão de código por IA.',
    defaultCliCommand: 'gemini docs src/core/orderProcessor.ts --write-jsdoc',
  },
  github: {
    id: 'github',
    label: 'Git, PRs & Merge',
    section: 'MÓDULOS DE ENGENHARIA',
    workspaceView: 'github',
    description:
      'Controle de branches, stage, commit semântico, push, criação de Pull Requests e merge via gh.',
    defaultCliCommand: 'gh pr list --state open',
  },
  tasks: {
    id: 'tasks',
    label: 'Tarefas & CI/CD',
    section: 'MÓDULOS DE ENGENHARIA',
    workspaceView: 'tasks',
    description:
      'Gerenciamento de tarefas de desenvolvimento, síntese de testes automatizados e pipeline CI/CD.',
    defaultCliCommand: 'codex test src/core/orderProcessor.ts --coverage',
  },
  chatbook: {
    id: 'chatbook',
    label: 'Notebook Multi-CLI',
    section: 'MÓDULOS DE ENGENHARIA',
    workspaceView: 'chatbook',
    description:
      'Caderno interativo multi-agente com salvamento de notas, autocompletar e inserção direta no código.',
    defaultCliCommand: 'gemini explain src/core/orderProcessor.ts --architecture',
  },
  team: {
    id: 'team',
    label: 'Equipe & Code Owners',
    section: 'ADMINISTRAÇÃO',
    workspaceView: 'github',
    description: 'Gestão de contribuidores, revisores de PR e permissões de branch.',
    defaultCliCommand: 'gh repo view --json collaborators',
  },
  settings: {
    id: 'settings',
    label: 'Configurações CLI',
    section: 'ADMINISTRAÇÃO',
    workspaceView: 'terminal',
    description: 'Preferências do workspace, persistência local e restauração de estado inicial.',
    defaultCliCommand: 'gemini config --list',
  },
};

interface SidebarProps {
  activeTab: SidebarTabType;
  onSelectTab: (tab: SidebarTabType) => void;
  activeBrand: OperationBrand;
  onToggleBrand: () => void;
  cliTools: CliToolStatus[];
  files: LocalProjectFile[];
  activeFilePath: string;
  onSelectFile: (filePath: string) => void;
  onSaveWorkspace: () => void;
  onResetWorkspace: () => void;
  /** Controla a visibilidade em telas < lg, onde a Sidebar vira um painel off-canvas. */
  mobileOpen?: boolean;
  /** Chamado ao fechar a navegação mobile (backdrop, Escape ou seleção de item). */
  onCloseMobile?: () => void;
}

export function Sidebar({
  activeTab,
  onSelectTab,
  activeBrand,
  onToggleBrand,
  cliTools,
  files,
  activeFilePath,
  onSelectFile,
  onSaveWorkspace,
  onResetWorkspace,
  mobileOpen = false,
  onCloseMobile,
}: SidebarProps) {
  const isDevForgeCore = activeBrand === 'devforge';

  const selectTab = (tab: SidebarTabType) => {
    onSelectTab(tab);
    onCloseMobile?.();
  };

  const devModules: { id: SidebarTabType; label: string; icon: React.ReactNode }[] = [
    { id: 'terminal', label: 'Terminal & CLIs', icon: <Terminal size={20} /> },
    { id: 'editor', label: 'Editor Local & JSDoc', icon: <Code2 size={20} /> },
    { id: 'github', label: 'Git, PRs & Merge', icon: <GitBranch size={20} /> },
    { id: 'tasks', label: 'Tarefas & CI/CD', icon: <CheckSquare size={20} /> },
    { id: 'chatbook', label: 'Notebook Multi-CLI', icon: <MessageSquare size={20} /> },
  ];

  const adminTools: { id: SidebarTabType; label: string; icon: React.ReactNode }[] = [
    { id: 'team', label: 'Equipe & Code Owners', icon: <UserCog size={20} /> },
    { id: 'settings', label: 'Configurações CLI', icon: <SettingsIcon size={20} /> },
  ];

  const getNavButtonClass = (id: SidebarTabType) => {
    const isActive = activeTab === id;
    if (isActive) {
      return isDevForgeCore
        ? 'bg-[#B83314] text-[#FFF4D6] shadow-md shadow-[#B83314]/25'
        : 'bg-[#0284C7] text-[#FFF4D6] shadow-md shadow-[#0284C7]/25';
    }
    return 'text-[#4A4640] hover:bg-[#EFECE6] hover:text-[#B83314]';
  };

  const getIconClass = (id: SidebarTabType) => {
    const isActive = activeTab === id;
    if (isActive) {
      return 'text-[#FFF4D6] opacity-100';
    }
    return 'text-[#57534E] opacity-80 group-hover:text-[#B83314]';
  };

  return (
    <>
      {/* Backdrop para dispositivos móveis */}
      {mobileOpen && (
        <div
          aria-hidden="true"
          onClick={onCloseMobile}
          className="fixed inset-0 z-30 bg-[#4A4640]/30 backdrop-blur-xs lg:hidden"
        />
      )}

      <aside
        aria-label="Sidebar Lateral de Navegação e Workspace"
        className={`fixed inset-y-0 left-0 z-40 w-64 h-full flex flex-col transition-transform duration-300 bg-[#FAF8F5] border-r border-[#E5E0D8] lg:static lg:translate-x-0 shrink-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Context Switcher */}
        <div className="p-4 border-b border-[#E5E0D8]">
          <div className="flex items-center justify-center mb-3">
            {isDevForgeCore ? (
              <div className="flex items-center gap-2.5 px-2 py-1">
                <svg
                  viewBox="0 0 32 32"
                  fill="none"
                  className="h-8 w-8 text-[#B83314] shrink-0"
                  aria-hidden="true"
                >
                  <polygon
                    points="16,3 29,27 3,27"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    fill="rgba(184,51,20,0.12)"
                  />
                  <circle cx="16" cy="19" r="3.5" fill="#D97706" />
                </svg>
                <div className="leading-tight">
                  <span className="block text-sm font-black tracking-wider text-[#B45309] font-display">
                    DEV<span className="text-[#B83314]">FORGE</span>
                  </span>
                  <span className="block text-[10px] font-mono text-[#0284C7]">
                    CLI STUDIO CORE
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2.5 px-2 py-1">
                <svg
                  viewBox="0 0 32 32"
                  fill="none"
                  className="h-8 w-8 text-[#0284C7] shrink-0"
                  aria-hidden="true"
                >
                  <rect
                    x="4"
                    y="4"
                    width="24"
                    height="24"
                    rx="6"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    fill="rgba(2,132,199,0.12)"
                  />
                  <path
                    d="M10 16h12M16 10v12"
                    stroke="#D97706"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="leading-tight">
                  <span className="block text-sm font-black tracking-wider text-[#0284C7] font-display">
                    MULTI<span className="text-[#B45309]">CLI</span>
                  </span>
                  <span className="block text-[10px] font-mono text-[#E11D74]">
                    ENGINE STUDIO
                  </span>
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onToggleBrand}
            className="w-full p-2 rounded-xl border border-[#E5E0D8] flex items-center justify-between transition-all group bg-[#F3EFE6] hover:bg-[#EAE5D9]"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {isDevForgeCore ? (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-6 w-6 shrink-0 text-[#B83314]"
                  aria-hidden="true"
                >
                  <path
                    d="M12 3L21 20H3L12 3Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-6 w-6 shrink-0 text-[#0284C7]"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2" />
                  <circle cx="12" cy="12" r="3" fill="#D97706" />
                </svg>
              )}
              <div className="text-left truncate">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#78716C]">
                  Operação Atual
                </p>
                <p
                  className={`text-sm font-black truncate ${
                    isDevForgeCore ? 'text-[#B83314]' : 'text-[#0284C7]'
                  }`}
                >
                  {isDevForgeCore ? 'DevForge Core' : 'Multi-CLI Engine'}
                </p>
              </div>
            </div>
            <div className="w-6 h-6 rounded-md bg-[#FAF8F5] border border-[#E5E0D8] flex items-center justify-center shrink-0">
              <ChevronRight
                size={14}
                className="text-[#57534E] group-hover:rotate-90 transition-transform"
              />
            </div>
          </button>
        </div>

        {/* Navigation Links (Estilo limpo em pílula rounded-xl focado nos módulos CLI e Arquivos) */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
          {/* MÓDULOS DE ENGENHARIA */}
          <div>
            <p className="px-3 mb-2 text-[10px] font-black uppercase tracking-widest text-[#78716C]">
              MÓDULOS DE ENGENHARIA
            </p>
            <div className="space-y-1">
              {devModules.map((tool) => (
                <button
                  key={tool.id}
                  type="button"
                  onClick={() => selectTab(tool.id)}
                  className={`group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-sm text-left transition-all ${getNavButtonClass(
                    tool.id
                  )}`}
                >
                  <span className={`shrink-0 ${getIconClass(tool.id)}`}>{tool.icon}</span>
                  <span className="truncate">{tool.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* MOTORES CLI (SVGs Oficiais 1.1 a 1.4) */}
          <div className="pt-4 border-t border-[#E5E0D8]">
            <p className="px-3 mb-2 text-[10px] font-black uppercase tracking-widest text-[#78716C]">
              MOTORES CLI (1.1 – 1.4)
            </p>
            <div className="space-y-1">
              {cliTools.map((tool) => (
                <button
                  key={tool.id}
                  type="button"
                  onClick={() => selectTab('terminal')}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-mono text-[#0284C7] hover:bg-[#EFECE6] transition-all"
                >
                  <span className="flex items-center gap-2.5 truncate">
                    <CompanyLogoSvg provider={tool.id} className="w-4 h-4 shrink-0" />
                    <span className="truncate font-semibold">
                      {tool.code} {tool.name}
                    </span>
                  </span>
                  <span className="text-[#B45309] font-semibold shrink-0">{tool.avgLatencyMs}ms</span>
                </button>
              ))}
            </div>
          </div>

          {/* PASTAS & ARQUIVOS LOCAIS */}
          <div className="pt-4 border-t border-[#E5E0D8]">
            <p className="px-3 mb-2 text-[10px] font-black uppercase tracking-widest text-[#78716C]">
              PASTAS LOCAIS
            </p>
            <div className="space-y-1">
              {files.map((file) => (
                <button
                  key={file.path}
                  type="button"
                  onClick={() => {
                    onSelectFile(file.path);
                    selectTab('editor');
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-mono transition-all ${
                    activeFilePath === file.path && activeTab === 'editor'
                      ? 'bg-[#EFECE6] text-[#B83314] border border-[#B83314]/30 font-bold'
                      : 'text-[#57534E] hover:bg-[#EFECE6] hover:text-[#0284C7]'
                  }`}
                >
                  <span className="flex items-center gap-2 truncate">
                    <FileCode className="w-3.5 h-3.5 shrink-0 text-[#0284C7]" />
                    <span className="truncate">{file.name}</span>
                  </span>
                  {file.modified && (
                    <span className="text-[10px] text-[#E11D74] font-bold shrink-0">M</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* ADMINISTRAÇÃO */}
          <div className="pt-4 border-t border-[#E5E0D8]">
            <p className="px-3 mb-2 text-[10px] font-black uppercase tracking-widest text-[#78716C]">
              ADMINISTRAÇÃO
            </p>
            <div className="space-y-1">
              {adminTools.map((tool) => (
                <button
                  key={tool.id}
                  type="button"
                  onClick={() => selectTab(tool.id)}
                  className={`group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-sm text-left transition-all ${getNavButtonClass(
                    tool.id
                  )}`}
                >
                  <span className={`shrink-0 ${getIconClass(tool.id)}`}>{tool.icon}</span>
                  <span className="truncate">{tool.label}</span>
                </button>
              ))}
            </div>

            {/* Ações rápidas de Salvar e Restaurar */}
            <div className="mt-3 px-1 space-y-1.5">
              <button
                type="button"
                onClick={onSaveWorkspace}
                className="w-full py-2 px-3 rounded-xl text-xs font-bold text-[#0284C7] bg-[#0284C7]/10 hover:bg-[#0284C7]/20 border border-[#0284C7]/40 transition-colors flex items-center justify-center gap-2"
              >
                <Save className="w-3.5 h-3.5 text-[#B45309]" />
                <span>Salvar Tudo Agora</span>
              </button>
              <button
                type="button"
                onClick={onResetWorkspace}
                className="w-full py-1.5 px-3 rounded-xl text-xs font-semibold text-[#57534E] hover:text-[#DC2626] bg-[#F3EFE6] border border-[#E5E0D8] transition-colors flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-3 h-3 text-[#DC2626]" />
                <span>Restaurar Workspace</span>
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
