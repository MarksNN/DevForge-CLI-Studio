import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  FileCode,
  CheckSquare,
  Terminal,
  Play,
  X,
  ArrowUpRight,
} from 'lucide-react';
import {
  ProjectFile,
  DevTask,
  TerminalLogEntry,
  GlobalSearchResult,
  CliProviderId,
  searchGlobalWorkspace,
} from '../utils/cliEngine';
import { CompanyLogoSvg } from './CompanyLogos';

interface GlobalSearchBarProps {
  files: ProjectFile[];
  tasks: DevTask[];
  terminalLogs: TerminalLogEntry[];
  onSelectFileResult: (filePath: string) => void;
  onSelectTaskResult: (taskId: string, linkedFile: string) => void;
  onSelectLogResult: (command: string, provider: CliProviderId) => void;
  onExecuteCommandFromSearch: (command: string, provider: CliProviderId) => void;
}

export const GlobalSearchBar: React.FC<GlobalSearchBarProps> = ({
  files,
  tasks,
  terminalLogs,
  onSelectFileResult,
  onSelectTaskResult,
  onSelectLogResult,
  onExecuteCommandFromSearch,
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'file' | 'task' | 'log'>('all');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const allMatches = searchGlobalWorkspace(query, files, tasks, terminalLogs);
  const filteredMatches =
    activeFilter === 'all'
      ? allMatches
      : allMatches.filter((item) => item.kind === activeFilter);

  const fileCount = allMatches.filter((m) => m.kind === 'file').length;
  const taskCount = allMatches.filter((m) => m.kind === 'task').length;
  const logCount = allMatches.filter((m) => m.kind === 'log').length;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen(true);
        inputRef.current?.focus();
      } else if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleResultActivate = (item: GlobalSearchResult) => {
    if (item.kind === 'file' && item.targetFilePath) {
      onSelectFileResult(item.targetFilePath);
    } else if (item.kind === 'task' && item.targetTaskId) {
      onSelectTaskResult(item.targetTaskId, item.targetFilePath || 'src/core/orderProcessor.ts');
    } else if (item.kind === 'log' && item.targetCommand) {
      onSelectLogResult(item.targetCommand, item.provider);
    }
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative flex-1 min-w-[260px] max-w-md">
      <div className="relative flex items-center">
        <Search className="w-3.5 h-3.5 text-[#B83314] absolute left-3 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          aria-label="Busca global de arquivos, tarefas e comandos nos logs"
          placeholder="Buscar arquivos, tarefas (DEV-101) ou logs CLI (Ctrl+K)..."
          className="w-full bg-[#FFFDF9] border border-[#E5E0D8] rounded-lg pl-8 pr-16 py-1.5 text-xs font-mono text-[#0284C7] placeholder:text-[#78716C] focus:outline-none focus:border-[#B83314]"
        />
        {query ? (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              inputRef.current?.focus();
            }}
            aria-label="Limpar busca global"
            className="absolute right-2 px-1.5 py-0.5 text-[10px] font-mono text-[#E11D74] hover:text-[#B83314]"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : (
          <span className="absolute right-2.5 px-1.5 py-0.5 rounded border border-[#E5E0D8] bg-[#F3EFE6] text-[10px] font-mono text-[#57534E] pointer-events-none">
            Ctrl+K
          </span>
        )}
      </div>

      {/* Dropdown de Resultados da Busca Global */}
      {isOpen && (
        <div
          role="region"
          aria-label="Resultados da Busca Global"
          data-testid="global-search-results"
          className="absolute left-0 right-0 mt-2 w-full sm:w-[480px] rounded-xl border border-[#E5E0D8] bg-[#FFFDF9] shadow-lg z-50 overflow-hidden"
        >
          {/* Cabeçalho de Filtros de Categoria */}
          <div className="px-3.5 py-2.5 border-b border-[#E5E0D8] bg-[#F3EFE6] flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              {(
                [
                  { id: 'all', label: `Todos (${allMatches.length})` },
                  { id: 'file', label: `Arquivos (${fileCount})` },
                  { id: 'task', label: `Tarefas (${taskCount})` },
                  { id: 'log', label: `Logs CLI (${logCount})` },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveFilter(tab.id)}
                  className={`px-2 py-1 rounded-md text-[11px] font-mono transition-colors ${
                    activeFilter === tab.id
                      ? 'bg-[#B83314] text-[#FFF4D6] font-bold'
                      : 'text-[#57534E] hover:text-[#0284C7]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-[11px] font-mono font-bold text-[#E11D74] hover:text-[#B83314]"
            >
              Fechar
            </button>
          </div>

          {/* Lista de Resultados */}
          <div className="max-h-80 overflow-y-auto divide-y divide-[#E5E0D8] bg-[#FAF8F5]">
            {filteredMatches.length === 0 ? (
              <div className="p-6 text-center text-xs text-[#57534E] font-mono">
                Nenhum arquivo, tarefa ou comando encontrado para &ldquo;{query}&rdquo;.
              </div>
            ) : (
              filteredMatches.map((item) => (
                <div
                  key={item.id}
                  className="p-3 hover:bg-[#F3EFE6] transition-colors flex items-start justify-between gap-3"
                >
                  <button
                    type="button"
                    onClick={() => handleResultActivate(item)}
                    className="flex-1 text-left min-w-0 space-y-1"
                  >
                    <div className="flex items-center gap-2 text-xs font-mono">
                      {item.kind === 'file' ? (
                        <FileCode className="w-3.5 h-3.5 text-[#0284C7] shrink-0" />
                      ) : item.kind === 'task' ? (
                        <CheckSquare className="w-3.5 h-3.5 text-[#B45309] shrink-0" />
                      ) : (
                        <Terminal className="w-3.5 h-3.5 text-[#E11D74] shrink-0" />
                      )}
                      <CompanyLogoSvg provider={item.provider} className="w-3.5 h-3.5 shrink-0" />
                      <span className="font-bold text-[#0284C7] truncate">
                        {item.title}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#57534E] font-mono truncate">
                      {item.subtitle}
                    </p>
                  </button>

                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className="px-2 py-0.5 rounded bg-[#FFFDF9] border border-[#E5E0D8] text-[10px] font-mono font-semibold text-[#B45309]">
                      {item.badge}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {item.targetCommand && (
                        <button
                          type="button"
                          onClick={() => {
                            onExecuteCommandFromSearch(item.targetCommand!, item.provider);
                            setIsOpen(false);
                          }}
                          className="px-2 py-0.5 rounded bg-[#B83314]/12 hover:bg-[#B83314]/20 border border-[#B83314]/40 text-[10px] font-mono font-bold text-[#B83314] flex items-center gap-1"
                        >
                          <Play className="w-2.5 h-2.5 text-[#E11D74]" />
                          <span>Rodar CLI</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleResultActivate(item)}
                        className="px-2 py-0.5 rounded bg-[#0284C7]/12 hover:bg-[#0284C7]/20 border border-[#0284C7]/40 text-[10px] font-mono font-bold text-[#0284C7] flex items-center gap-0.5"
                      >
                        <span>Abrir</span>
                        <ArrowUpRight className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
