import React from 'react';
import {
  Home,
  LayoutTemplate,
  Search,
  Users,
  Building2,
  Activity,
  BookOpen,
  Layers,
  FileBarChart,
  Zap,
  ChevronRight,
  Database,
  BarChart3,
  CalendarDays,
  Bell,
  Cpu,
  Wallet,
  FileText,
  PhoneCall,
  Target,
  Shield,
  MessageSquare,
  UserCog,
  Plug,
  Settings as SettingsIcon,
  Download,
  LineChart,
  Save,
  RotateCcw,
  FileCode,
} from 'lucide-react';
import { CompanyLogoSvg } from './CompanyLogos';
import { CliToolStatus, LocalProjectFile } from '../utils/cliEngine';

export type SidebarTabType =
  | 'dashboard'
  | 'prospect'
  | 'crm'
  | 'contacts'
  | 'companies'
  | 'activities'
  | 'analytics'
  | 'winloss'
  | 'calendar'
  | 'notifications'
  | 'commercial_intelligence'
  | 'roleplay'
  | 'qualification_matrix'
  | 'objections_matrix'
  | 'chatbook'
  | 'intelligence'
  | 'market-intelligence'
  | 'topic_training'
  | 'bitrix'
  | 'integrations'
  | 'reports'
  | 'knowledge'
  | 'editor'
  | 'automations'
  | 'usage'
  | 'team'
  | 'settings';

export type OperationBrand = 'atlasgr' | 'totaltrack';

export interface SidebarItemMeta {
  id: SidebarTabType;
  label: string;
  section: 'CORE MODULES' | 'EXECUTIVO' | 'INTELIGÊNCIA' | 'ADMINISTRAÇÃO';
  workspaceView: 'terminal' | 'editor' | 'github' | 'tasks' | 'chatbook';
  description: string;
  defaultCliCommand: string;
}

export const SIDEBAR_ITEM_METADATA: Record<SidebarTabType, SidebarItemMeta> = {
  dashboard: {
    id: 'dashboard',
    label: 'Painel Central',
    section: 'CORE MODULES',
    workspaceView: 'terminal',
    description: 'Central de comando unificada com Grok CLI 1.1, Gemini CLI 1.2, Codex CLI 1.3 e GitHub CLI 1.4.',
    defaultCliCommand: 'grok analyze src/core/orderProcessor.ts --security',
  },
  prospect: {
    id: 'prospect',
    label: 'Prospecção',
    section: 'CORE MODULES',
    workspaceView: 'terminal',
    description: 'Varredura e descoberta de símbolos, gargalos e dependências no repositório local via CLI.',
    defaultCliCommand: 'gemini search --symbols src/core/orderProcessor.ts',
  },
  crm: {
    id: 'crm',
    label: 'Pipeline CRM',
    section: 'CORE MODULES',
    workspaceView: 'github',
    description: 'Pipeline completo de branches, commits, revisões de Pull Requests e entregas Git.',
    defaultCliCommand: 'gh pr list --state open',
  },
  contacts: {
    id: 'contacts',
    label: 'Decisores',
    section: 'CORE MODULES',
    workspaceView: 'github',
    description: 'Code Owners, aprovadores de Pull Request e agentes revisores de código.',
    defaultCliCommand: 'gh pr status',
  },
  companies: {
    id: 'companies',
    label: 'Empresas',
    section: 'CORE MODULES',
    workspaceView: 'terminal',
    description: 'Motores oficiais conectados: xAI (Grok 1.1), Google (Gemini 1.2), OpenAI (Codex 1.3) e GitHub (GH 1.4).',
    defaultCliCommand: 'gemini status --engines',
  },
  activities: {
    id: 'activities',
    label: 'Agenda',
    section: 'CORE MODULES',
    workspaceView: 'tasks',
    description: 'Fila de tarefas de desenvolvimento em andamento e automações vinculadas à branch.',
    defaultCliCommand: 'codex test --coverage',
  },
  analytics: {
    id: 'analytics',
    label: 'Analytics',
    section: 'CORE MODULES',
    workspaceView: 'tasks',
    description: 'Métricas de cobertura de linhas, tempo de execução de suítes e performance de build.',
    defaultCliCommand: 'codex coverage --report',
  },
  winloss: {
    id: 'winloss',
    label: 'Win/Loss',
    section: 'CORE MODULES',
    workspaceView: 'tasks',
    description: 'Taxa de aprovação de builds, testes automatizados (Pass/Fail) e qualidade de entrega.',
    defaultCliCommand: 'codex test src/core/orderProcessor.ts --coverage',
  },
  calendar: {
    id: 'calendar',
    label: 'Calendário',
    section: 'CORE MODULES',
    workspaceView: 'github',
    description: 'Cronograma de releases, histórico de commits e janelas de deploy contínuo.',
    defaultCliCommand: 'gh release list',
  },
  notifications: {
    id: 'notifications',
    label: 'Notificações',
    section: 'CORE MODULES',
    workspaceView: 'terminal',
    description: 'Logs em tempo real do terminal, alertas de segurança e eventos do pipeline.',
    defaultCliCommand: 'gh run list --limit 5',
  },
  commercial_intelligence: {
    id: 'commercial_intelligence',
    label: 'Comercial Inteligente',
    section: 'EXECUTIVO',
    workspaceView: 'tasks',
    description: 'Visão executiva consolidada de produtividade dev, SLA de revisões IA e saúde do CI/CD.',
    defaultCliCommand: 'gh workflow run ci-pipeline.yml',
  },
  roleplay: {
    id: 'roleplay',
    label: 'Roleplay',
    section: 'INTELIGÊNCIA',
    workspaceView: 'chatbook',
    description: 'Simulação interativa de incidentes, pair programming e defesa de arquitetura com agentes CLI.',
    defaultCliCommand: 'grok simulate-incident --target src/api/githubWebhook.ts',
  },
  qualification_matrix: {
    id: 'qualification_matrix',
    label: 'Matriz de Qualificação',
    section: 'INTELIGÊNCIA',
    workspaceView: 'editor',
    description: 'Matriz de critérios de qualidade, tipagem estrita e prontidão de código para produção.',
    defaultCliCommand: 'grok analyze src/core/orderProcessor.ts --security',
  },
  objections_matrix: {
    id: 'objections_matrix',
    label: 'Matriz de Objeções',
    section: 'INTELIGÊNCIA',
    workspaceView: 'editor',
    description: 'Diagnóstico preventivo de vulnerabilidades, race conditions e bloqueios de code review.',
    defaultCliCommand: 'grok audit src/api/githubWebhook.ts --strict',
  },
  chatbook: {
    id: 'chatbook',
    label: 'Chatbook',
    section: 'INTELIGÊNCIA',
    workspaceView: 'chatbook',
    description: 'Caderno interativo multi-agente com salvamento de prompts, snippets e autocompletar.',
    defaultCliCommand: 'gemini chatbook --sync',
  },
  intelligence: {
    id: 'intelligence',
    label: 'Hub de IA',
    section: 'INTELIGÊNCIA',
    workspaceView: 'terminal',
    description: 'Orquestração simultânea dos motores Grok 1.1, Gemini 1.2, Codex 1.3 e GitHub CLI 1.4.',
    defaultCliCommand: 'gemini docs src/core/orderProcessor.ts --write-jsdoc',
  },
  'market-intelligence': {
    id: 'market-intelligence',
    label: 'Market Intelligence',
    section: 'INTELIGÊNCIA',
    workspaceView: 'terminal',
    description: 'Benchmark comparativo de latência, segurança de pacotes npm e versões de dependências.',
    defaultCliCommand: 'npm install zod',
  },
  topic_training: {
    id: 'topic_training',
    label: 'Academy',
    section: 'INTELIGÊNCIA',
    workspaceView: 'chatbook',
    description: 'Biblioteca de comandos avançados, boas práticas de CLI e receitas de automação.',
    defaultCliCommand: 'gemini explain src/core/orderProcessor.ts',
  },
  bitrix: {
    id: 'bitrix',
    label: 'Guia Bitrix24',
    section: 'INTELIGÊNCIA',
    workspaceView: 'github',
    description: 'Integração de webhooks corporativos, sincronização de tarefas e gatilhos de PR.',
    defaultCliCommand: 'gh webhook list',
  },
  integrations: {
    id: 'integrations',
    label: 'Integrações',
    section: 'INTELIGÊNCIA',
    workspaceView: 'github',
    description: 'Conexão direta com GitHub CLI (gh), repositórios remotos, branches e npm registry.',
    defaultCliCommand: 'gh auth status',
  },
  reports: {
    id: 'reports',
    label: 'Relatórios IA',
    section: 'INTELIGÊNCIA',
    workspaceView: 'editor',
    description: 'Laudos técnicos automatizados de revisão de código e geração de documentação Markdown.',
    defaultCliCommand: 'gemini docs src/core/orderProcessor.ts --write-jsdoc',
  },
  knowledge: {
    id: 'knowledge',
    label: 'Base de Conhecimento',
    section: 'INTELIGÊNCIA',
    workspaceView: 'editor',
    description: 'Explorador de pastas locais, documentação README.md e árvore de arquivos do projeto.',
    defaultCliCommand: 'gemini docs README.md --summary',
  },
  editor: {
    id: 'editor',
    label: 'Editor de Documentos',
    section: 'INTELIGÊNCIA',
    workspaceView: 'editor',
    description: 'Editor local com diff linha a linha, injeção de JSDoc por IA e instalador de pacotes npm.',
    defaultCliCommand: 'gemini docs src/core/orderProcessor.ts --write-jsdoc',
  },
  automations: {
    id: 'automations',
    label: 'Automações',
    section: 'INTELIGÊNCIA',
    workspaceView: 'tasks',
    description: 'Pipelines automatizados de lint, auditoria de segurança, testes unitários e deploy.',
    defaultCliCommand: 'codex synthesize-test src/core/orderProcessor.ts',
  },
  usage: {
    id: 'usage',
    label: 'Consumo de IA',
    section: 'INTELIGÊNCIA',
    workspaceView: 'terminal',
    description: 'Monitoramento em tempo real de comandos executados e latência em ms de cada CLI.',
    defaultCliCommand: 'grok metrics --latency',
  },
  team: {
    id: 'team',
    label: 'Equipe',
    section: 'ADMINISTRAÇÃO',
    workspaceView: 'github',
    description: 'Gestão de contribuidores, revisores de PR e permissões de branch.',
    defaultCliCommand: 'gh repo view --json collaborators',
  },
  settings: {
    id: 'settings',
    label: 'Configurações',
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
  onExportExtractorReport: () => void;
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
  onExportExtractorReport,
  mobileOpen = false,
  onCloseMobile,
}: SidebarProps) {
  const isAtlas = activeBrand === 'atlasgr';

  const selectTab = (tab: SidebarTabType) => {
    onSelectTab(tab);
    onCloseMobile?.();
  };

  const adminTools: { id: SidebarTabType; label: string; icon: React.ReactNode }[] = [
    { id: 'team', label: 'Equipe', icon: <UserCog size={20} /> },
    { id: 'settings', label: 'Configurações', icon: <SettingsIcon size={20} /> },
  ];

  const coreTools: { id: SidebarTabType; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Painel Central', icon: <Home size={20} /> },
    { id: 'prospect', label: 'Prospecção', icon: <Search size={20} /> },
    { id: 'crm', label: 'Pipeline CRM', icon: <LayoutTemplate size={20} /> },
    { id: 'contacts', label: 'Decisores', icon: <Users size={20} /> },
    { id: 'companies', label: 'Empresas', icon: <Building2 size={20} /> },
    { id: 'activities', label: 'Agenda', icon: <Activity size={20} /> },
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 size={20} /> },
    { id: 'winloss', label: 'Win/Loss', icon: <Target size={20} /> },
    { id: 'calendar', label: 'Calendário', icon: <CalendarDays size={20} /> },
    { id: 'notifications', label: 'Notificações', icon: <Bell size={20} /> },
  ];

  const executiveTools: { id: SidebarTabType; label: string; icon: React.ReactNode }[] = [
    {
      id: 'commercial_intelligence',
      label: 'Comercial Inteligente',
      icon: <LineChart size={20} />,
    },
  ];

  const aiTools: { id: SidebarTabType; label: string; icon: React.ReactNode }[] = [
    { id: 'roleplay', label: 'Roleplay', icon: <PhoneCall size={20} /> },
    { id: 'qualification_matrix', label: 'Matriz de Qualificação', icon: <Target size={20} /> },
    { id: 'objections_matrix', label: 'Matriz de Objeções', icon: <Shield size={20} /> },
    { id: 'chatbook', label: 'Chatbook', icon: <MessageSquare size={20} /> },
    { id: 'intelligence', label: 'Hub de IA', icon: <Zap size={20} /> },
    { id: 'market-intelligence', label: 'Market Intelligence', icon: <LineChart size={20} /> },
    { id: 'topic_training', label: 'Academy', icon: <BookOpen size={20} /> },
    { id: 'bitrix', label: 'Guia Bitrix24', icon: <Layers size={20} /> },
    { id: 'integrations', label: 'Integrações', icon: <Plug size={20} /> },
    { id: 'reports', label: 'Relatórios IA', icon: <FileBarChart size={20} /> },
    { id: 'knowledge', label: 'Base de Conhecimento', icon: <Database size={20} /> },
    { id: 'editor', label: 'Editor de Documentos', icon: <FileText size={20} /> },
    { id: 'automations', label: 'Automações', icon: <Cpu size={20} /> },
    { id: 'usage', label: 'Consumo de IA', icon: <Wallet size={20} /> },
  ];

  // Estilo Light Mode idêntico à imagem enviada pelo usuário:
  // Item ativo em pílula rounded-xl vermelha/terracota (#B83314) ou azul (#0284C7) com texto dourado-creme (#FFF4D6, zero branco puro)
  // Itens inativos em cinza-ardósia (#4A4640) sobre fundo claro (#FAF8F5)
  const getNavButtonClass = (id: SidebarTabType) => {
    const isActive = activeTab === id;
    if (isActive) {
      return isAtlas
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
        {/* Context Switcher (Modo Light) */}
        <div className="p-4 border-b border-[#E5E0D8]">
          {/* Logo Principal da Operação */}
          <div className="flex items-center justify-center mb-3">
            {isAtlas ? (
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
                    ATLAS<span className="text-[#B83314]">GR</span>
                  </span>
                  <span className="block text-[10px] font-mono text-[#0284C7]">
                    DEVFORGE CLI CORE
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
                    TOTAL<span className="text-[#B45309]">TRACK</span>
                  </span>
                  <span className="block text-[10px] font-mono text-[#E11D74]">
                    MULTI-CLI ENGINE
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
              {isAtlas ? (
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
                    isAtlas ? 'text-[#B83314]' : 'text-[#0284C7]'
                  }`}
                >
                  {isAtlas ? 'AtlasGR' : 'Total Trac'}
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

        {/* Navigation Links (Idêntico ao layout e seções da referência em Light Mode) */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
          {/* CORE MODULES */}
          <div>
            <p className="px-3 mb-2 text-[10px] font-black uppercase tracking-widest text-[#78716C]">
              CORE MODULES
            </p>
            <div className="space-y-1">
              {coreTools.map((tool) => (
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

          {/* EXECUTIVO */}
          <div>
            <p className="px-3 mb-2 text-[10px] font-black uppercase tracking-widest text-[#78716C]">
              EXECUTIVO
            </p>
            <div className="space-y-1">
              {executiveTools.map((tool) => (
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

          {/* INTELIGÊNCIA */}
          <div>
            <p className="px-3 mb-2 text-[10px] font-black uppercase tracking-widest text-[#78716C]">
              INTELIGÊNCIA
            </p>
            <div className="space-y-1">
              {aiTools.map((tool) => (
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

          {/* FERRAMENTAS */}
          <div>
            <p className="px-3 mb-2 text-[10px] font-black uppercase tracking-widest text-[#78716C]">
              FERRAMENTAS
            </p>
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => {
                  onExportExtractorReport();
                  onCloseMobile?.();
                }}
                className="group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-sm text-left transition-all text-[#4A4640] hover:bg-[#EFECE6] hover:text-[#B45309]"
              >
                <span className="shrink-0 text-[#57534E] opacity-80 group-hover:text-[#B45309]">
                  <Download size={20} />
                </span>
                <span className="truncate">Extrator Bitrix24</span>
              </button>
            </div>
          </div>

          {/* EMPRESAS & MOTORES CLI (SVGs Oficiais 1.1 a 1.4) */}
          <div className="pt-4 border-t border-[#E5E0D8]">
            <p className="px-3 mb-2 text-[10px] font-black uppercase tracking-widest text-[#78716C]">
              MOTORES CLI (1.1 – 1.4)
            </p>
            <div className="space-y-1">
              {cliTools.map((tool) => (
                <button
                  key={tool.id}
                  type="button"
                  onClick={() => selectTab('dashboard')}
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
