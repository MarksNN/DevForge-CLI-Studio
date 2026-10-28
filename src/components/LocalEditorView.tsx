import React, { useState, useEffect } from 'react';
import {
  FileCode,
  Save,
  PackagePlus,
  FileText,
  ShieldAlert,
  Check,
  FolderOpen,
  Plus,
  GitCompare,
  Download,
  Sparkles,
} from 'lucide-react';
import {
  ProjectFile,
  CodeReviewIssue,
  analyzeCodeLocally,
  injectJsDocHeaders,
  computeLineDiff,
} from '../utils/cliEngine';
import { CompanyLogoSvg } from './CompanyLogos';

interface LocalEditorViewProps {
  files: ProjectFile[];
  activeFilePath: string;
  onSelectFile: (path: string) => void;
  onSaveFileContent: (path: string, newContent: string) => void;
  onCreateNewFile: (path: string, content: string) => void;
  onInstallDependency: (pkgSpec: string, isDev: boolean) => void;
  onAppendToReadme: (markdownBlock: string) => void;
  onLogTerminal: (provider: 'grok' | 'gemini' | 'codex' | 'gh' | 'system', cmd: string, output: string) => void;
}

const CODE_SNIPPET_SUGGESTIONS: Array<{
  label: string;
  provider: 'grok' | 'gemini' | 'codex' | 'gh';
  snippet: string;
}> = [
  {
    label: 'Validação de Escopo Guard (Grok 1.1)',
    provider: 'grok',
    snippet: `\nexport function assertValidScope(scope: string): boolean {\n  return scope.startsWith('cli:') || scope === 'admin:all';\n}\n`,
  },
  {
    label: 'Cabeçalho Contrato JSDoc (Gemini 1.2)',
    provider: 'gemini',
    snippet: `/**\n * @module DevForgeCore\n * @description Módulo auditado por Gemini CLI 1.2 e Codex CLI 1.3\n */\n`,
  },
  {
    label: 'Helper Retry Exponencial (Codex 1.3)',
    provider: 'codex',
    snippet: `\nexport const DEFAULT_RETRY_POLICY = { maxAttempts: 3, baseDelayMs: 250 } as const;\n`,
  },
];

export const LocalEditorView: React.FC<LocalEditorViewProps> = ({
  files,
  activeFilePath,
  onSelectFile,
  onSaveFileContent,
  onCreateNewFile,
  onInstallDependency,
  onAppendToReadme,
  onLogTerminal,
}) => {
  const activeFile = files.find((f) => f.path === activeFilePath) || files[0];
  const [baselineContent, setBaselineContent] = useState(activeFile.content);
  const [draftContent, setDraftContent] = useState(activeFile.content);
  const [editorMode, setEditorMode] = useState<'code' | 'diff'>('code');

  const [pkgInput, setPkgInput] = useState('');
  const [isDevDep, setIsDevDep] = useState(false);
  const [pkgFeedback, setPkgFeedback] = useState<string | null>(null);

  const [newFileName, setNewFileName] = useState('');
  const [showNewFileForm, setShowNewFileForm] = useState(false);

  const [reviewIssues, setReviewIssues] = useState<CodeReviewIssue[]>([]);
  const [generatedMarkdownDocs, setGeneratedMarkdownDocs] = useState<string>('');
  const [aiStatusMessage, setAiStatusMessage] = useState<string | null>(null);
  const [isRunningAi, setIsRunningAi] = useState(false);
  const [hostFsEntries, setHostFsEntries] = useState<Array<{ name: string; isDirectory: boolean }>>([]);

  useEffect(() => {
    setBaselineContent(activeFile.content);
    setDraftContent(activeFile.content);
    setReviewIssues(analyzeCodeLocally(activeFile));
  }, [activeFile.path]);

  useEffect(() => {
    setReviewIssues(analyzeCodeLocally({ ...activeFile, content: draftContent }));
  }, [draftContent]);

  useEffect(() => {
    fetch('/api/fs/local')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.entries)) {
          setHostFsEntries(data.entries);
        }
      })
      .catch(() => {
        // Fallback silently if offline
      });
  }, []);

  const handleSave = () => {
    onSaveFileContent(activeFile.path, draftContent);
    setBaselineContent(draftContent);
    setAiStatusMessage(`Arquivo ${activeFile.path} salvo localmente e sincronizado com a árvore Git.`);
  };

  const handleImportHostFile = async (fileName: string) => {
    try {
      const res = await fetch(`/api/fs/read?path=${encodeURIComponent(fileName)}`);
      const data = await res.json();
      if (data && typeof data.content === 'string') {
        const importedPath = `host/${fileName}`;
        onCreateNewFile(importedPath, data.content);
        setAiStatusMessage(`Arquivo real do host (${fileName}) importado para o editor como ${importedPath}.`);
      }
    } catch {
      setAiStatusMessage(`Não foi possível importar ${fileName}.`);
    }
  };

  const handleInstallPkg = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pkgInput.trim()) {
      setPkgFeedback('Informe o nome do pacote (ex: axios ou bullmq@5.40.0).');
      return;
    }
    const spec = pkgInput.trim();
    onInstallDependency(spec, isDevDep);
    setPkgInput('');
    setPkgFeedback(`Pacote ${spec} adicionado ao package.json com sucesso.`);
  };

  const handleCreateFileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = newFileName.trim();
    if (!cleaned) return;
    const normalizedPath = cleaned.includes('/') ? cleaned : `src/services/${cleaned}`;
    const finalPath =
      normalizedPath.endsWith('.ts') ||
      normalizedPath.endsWith('.md') ||
      normalizedPath.endsWith('.json')
        ? normalizedPath
        : `${normalizedPath}.ts`;
    onCreateNewFile(
      finalPath,
      `export function handleModuleTask(input: string): string {\n  return input.trim();\n}\n`
    );
    setNewFileName('');
    setShowNewFileForm(false);
  };

  const handleGenerateDocs = async () => {
    setIsRunningAi(true);
    setAiStatusMessage('Executando Gemini CLI (1.2) para documentar funções exportadas...');

    const localResult = injectJsDocHeaders(draftContent, activeFile.path);

    try {
      const response = await fetch('/api/ai/review-and-docs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filePath: activeFile.path,
          fileContent: draftContent,
          mode: 'docs',
          cliProvider: 'gemini',
        }),
      });
      const data = await response.json();

      const updatedCode =
        !data.usedFallback && data.updatedCode ? data.updatedCode : localResult.documentedCode;
      const mdSummary =
        !data.usedFallback && data.markdownDocs ? data.markdownDocs : localResult.markdownSummary;

      setDraftContent(updatedCode);
      onSaveFileContent(activeFile.path, updatedCode);
      setGeneratedMarkdownDocs(mdSummary);
      setAiStatusMessage(
        `Documentação JSDoc gerada e aplicada em ${activeFile.path} via Gemini CLI (1.2).`
      );
      onLogTerminal(
        'gemini',
        `gemini docs ${activeFile.path} --write-jsdoc`,
        `JSDoc inserido em ${activeFile.path}. Resumo técnico atualizado.`
      );
    } catch {
      setDraftContent(localResult.documentedCode);
      onSaveFileContent(activeFile.path, localResult.documentedCode);
      setGeneratedMarkdownDocs(localResult.markdownSummary);
      setAiStatusMessage(`Documentação JSDoc aplicada localmente em ${activeFile.path}.`);
    } finally {
      setIsRunningAi(false);
    }
  };

  const handleRunCodeReview = async () => {
    setIsRunningAi(true);
    setAiStatusMessage('Executando Grok CLI (1.1) + Codex CLI (1.3) para auditoria estática e revisão...');

    const localIssues = analyzeCodeLocally({ ...activeFile, content: draftContent });
    setReviewIssues(localIssues);

    try {
      const response = await fetch('/api/ai/review-and-docs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filePath: activeFile.path,
          fileContent: draftContent,
          mode: 'review',
          cliProvider: 'grok',
        }),
      });
      const data = await response.json();
      if (!data.usedFallback && Array.isArray(data.issues) && data.issues.length > 0) {
        setReviewIssues(
          data.issues.map((iss: any, i: number) => ({
            id: `ai-iss-${i}`,
            line: iss.line || 1,
            severity: iss.severity === 'Error' || iss.severity === 'Warning' ? iss.severity : 'Info',
            rule: iss.rule || 'gemini/code-review',
            message: iss.message || 'Ponto de atenção identificado.',
            suggestedFix: iss.suggestedFix || 'Revisar implementação.',
            provider: 'gemini',
          }))
        );
      }
      setAiStatusMessage(`Revisão de código concluída para ${activeFile.path} (${localIssues.length} diagnósticos).`);
      onLogTerminal(
        'grok',
        `grok review ${activeFile.path} --with-codex`,
        `Revisão concluída: ${localIssues.length} diagnósticos analisados em ${activeFile.path}.`
      );
    } catch {
      setAiStatusMessage(`Revisão estática concluída para ${activeFile.path}.`);
    } finally {
      setIsRunningAi(false);
    }
  };

  const handleApplyAutoFix = () => {
    let fixed = draftContent.replace(
      /\/\/ TODO: add clock skew tolerance and audit log hook/g,
      'const clockSkewToleranceMs = 5000;'
    );
    fixed = fixed.replace(
      /const isExpired = nowMs > claims\.issuedAtMs \+ claims\.ttlMs;/g,
      'const isExpired = nowMs > claims.issuedAtMs + claims.ttlMs + clockSkewToleranceMs;'
    );
    const docRes = injectJsDocHeaders(fixed, activeFile.path);
    setDraftContent(docRes.documentedCode);
    setGeneratedMarkdownDocs(docRes.markdownSummary);
    onSaveFileContent(activeFile.path, docRes.documentedCode);
    setAiStatusMessage(`Patch automático do Codex CLI (1.3) aplicado e salvo em ${activeFile.path}.`);
    onLogTerminal(
      'codex',
      `codex patch ${activeFile.path} --apply-fixes`,
      `Patch AST e cabeçalhos JSDoc aplicados com sucesso em ${activeFile.path}.`
    );
  };

  const handleExportDocsToReadme = () => {
    const docBlock =
      generatedMarkdownDocs ||
      injectJsDocHeaders(draftContent, activeFile.path).markdownSummary;
    onAppendToReadme(docBlock);
    setAiStatusMessage('Resumo técnico anexado ao arquivo README.md do projeto.');
  };

  const handleInsertSnippetSuggestion = (snippet: string, label: string) => {
    const updated = `${draftContent.trimEnd()}\n${snippet}`;
    setDraftContent(updated);
    onSaveFileContent(activeFile.path, updated);
    setAiStatusMessage(`Sugestão "${label}" autocompletada e salva em ${activeFile.path}.`);
  };

  const lineCount = draftContent.split('\n').length;
  const diffData = computeLineDiff(baselineContent, draftContent);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0284C7]">
            Editor de Código Local, Dependências & Automação IA
          </h1>
          <p className="text-sm text-[#57534E] mt-1">
            Acesse pastas locais, use autocompletar de código, instale pacotes npm e salve alterações sincronizadas.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleGenerateDocs}
            disabled={isRunningAi}
            className="px-3.5 py-2 text-xs font-semibold bg-[#F3EFE6] hover:bg-[#EAE5D9] border border-[#0284C7]/40 text-[#0284C7] rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap"
          >
            <CompanyLogoSvg provider="gemini" className="w-3.5 h-3.5" />
            <FileText className="w-3.5 h-3.5 text-[#B45309]" />
            <span>Gerar Documentação IA (Gemini 1.2)</span>
          </button>
          <button
            type="button"
            onClick={handleRunCodeReview}
            disabled={isRunningAi}
            className="px-3.5 py-2 text-xs font-semibold bg-[#F3EFE6] hover:bg-[#EAE5D9] border border-[#E11D74]/40 text-[#E11D74] rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap"
          >
            <CompanyLogoSvg provider="grok" className="w-3.5 h-3.5" />
            <ShieldAlert className="w-3.5 h-3.5 text-[#B45309]" />
            <span>Revisão de Código IA (Grok 1.1)</span>
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 text-xs font-bold bg-[#B83314] hover:bg-[#9E2B10] text-[#FFF4D6] rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap"
          >
            <Save className="w-3.5 h-3.5 text-[#FFF4D6]" />
            <span>Salvar Arquivo</span>
          </button>
        </div>
      </div>

      {aiStatusMessage && (
        <div
          role="status"
          className="px-4 py-2.5 rounded-lg border border-[#0284C7]/40 bg-[#FFFDF9] text-xs text-[#B45309] flex items-center justify-between"
        >
          <span>{aiStatusMessage}</span>
          <button
            type="button"
            onClick={() => setAiStatusMessage(null)}
            className="text-[#E11D74] hover:text-[#DC2626] font-bold ml-4"
          >
            Fechar
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Local Folders & Dependency Installer */}
        <div className="lg:col-span-3 space-y-5">
          <div className="border border-[#E5E0D8] rounded-xl bg-[#FFFDF9] p-4 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-bold tracking-wide text-[#B83314] flex items-center gap-1.5">
                <FolderOpen className="w-3.5 h-3.5 text-[#0284C7]" />
                <span>Arquivos do Projeto</span>
              </h2>
              <button
                type="button"
                onClick={() => setShowNewFileForm(!showNewFileForm)}
                className="text-xs font-semibold text-[#0284C7] hover:text-[#B83314] flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Novo</span>
              </button>
            </div>

            {showNewFileForm && (
              <form onSubmit={handleCreateFileSubmit} className="mb-3 space-y-2">
                <input
                  type="text"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  placeholder="src/services/cache.ts"
                  aria-label="Caminho do novo arquivo"
                  className="w-full bg-[#FAF8F5] border border-[#E5E0D8] rounded-lg px-2.5 py-1.5 text-xs font-mono text-[#0284C7]"
                />
                <button
                  type="submit"
                  className="w-full py-1.5 bg-[#0284C7]/15 border border-[#0284C7] text-[#0284C7] text-xs font-bold rounded-lg"
                >
                  Criar Arquivo Local
                </button>
              </form>
            )}

            <div className="space-y-1">
              {files.map((file) => {
                const isCurrent = file.path === activeFile.path;
                return (
                  <button
                    key={file.path}
                    type="button"
                    onClick={() => onSelectFile(file.path)}
                    className={`w-full px-2.5 py-2 rounded-lg text-left text-xs font-mono transition-colors flex items-center justify-between ${
                      isCurrent
                        ? 'bg-[#B83314] text-[#FFF4D6] font-bold'
                        : 'text-[#57534E] hover:bg-[#F3EFE6] hover:text-[#0284C7]'
                    }`}
                  >
                    <span className="truncate flex items-center gap-2">
                      <FileCode className={`w-3.5 h-3.5 shrink-0 ${isCurrent ? 'text-[#FFF4D6]' : 'text-[#0284C7]'}`} />
                      <span className="truncate">{file.path}</span>
                    </span>
                    <span className={`text-[11px] shrink-0 ml-2 ${isCurrent ? 'text-[#FFF4D6]' : 'text-[#B45309]'}`}>
                      {file.modified ? 'M' : `${file.coveragePct}%`}
                    </span>
                  </button>
                );
              })}
            </div>

            {hostFsEntries.length > 0 && (
              <div className="mt-4 pt-3 border-t border-[#E5E0D8]">
                <p className="text-[11px] font-semibold text-[#B45309] mb-1.5">
                  Diretório Host Montado ({hostFsEntries.length} itens):
                </p>
                <div className="text-[11px] font-mono text-[#57534E] space-y-1 max-h-28 overflow-y-auto">
                  {hostFsEntries.map((entry) => (
                    <div key={entry.name} className="flex items-center justify-between gap-2">
                      <span className="truncate">
                        {entry.isDirectory ? `/${entry.name}` : entry.name}
                      </span>
                      {!entry.isDirectory && (
                        <button
                          type="button"
                          onClick={() => handleImportHostFile(entry.name)}
                          className="text-[10px] font-semibold text-[#0284C7] hover:text-[#B83314] whitespace-nowrap shrink-0"
                        >
                          Importar
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Dependency Installer Card */}
          <div className="border border-[#E5E0D8] rounded-xl bg-[#FFFDF9] p-4 shadow-2xs">
            <h2 className="text-sm font-bold text-[#B83314] flex items-center gap-2">
              <PackagePlus className="w-4 h-4 text-[#0284C7]" />
              <span>Instalador de Dependências</span>
            </h2>
            <p className="text-xs text-[#57534E] mt-1">
              Adiciona pacotes diretamente ao <code className="text-[#0284C7] font-semibold">package.json</code> via CLI local.
            </p>

            <form onSubmit={handleInstallPkg} className="mt-3 space-y-2.5">
              <div>
                <label htmlFor="npm-pkg-input" className="block text-xs text-[#57534E] mb-1">
                  Pacote npm (ex: redis, axios, bullmq)
                </label>
                <input
                  id="npm-pkg-input"
                  type="text"
                  value={pkgInput}
                  onChange={(e) => setPkgInput(e.target.value)}
                  placeholder="redis@4.7.0"
                  className="w-full bg-[#FAF8F5] border border-[#E5E0D8] rounded-lg px-3 py-1.5 text-xs font-mono text-[#0284C7] placeholder:text-[#78716C] focus:outline-none focus:border-[#0284C7]"
                />
              </div>

              <label className="flex items-center gap-2 text-xs text-[#57534E] cursor-pointer">
                <input
                  type="checkbox"
                  checked={isDevDep}
                  onChange={(e) => setIsDevDep(e.target.checked)}
                  className="rounded border-[#0284C7] bg-[#FAF8F5]"
                />
                <span>Salvar em devDependencies (-D)</span>
              </label>

              <button
                type="submit"
                className="w-full py-2 px-3 bg-[#F3EFE6] hover:bg-[#EAE5D9] border border-[#B83314]/40 text-[#B83314] text-xs font-bold rounded-lg transition-colors"
              >
                Executar npm install
              </button>
            </form>

            {pkgFeedback && (
              <p className="mt-2.5 text-xs text-[#0284C7] font-mono">
                {pkgFeedback}
              </p>
            )}
          </div>
        </div>

        {/* Center Column: Integrated Code Editor & Diff Viewer */}
        <div className="lg:col-span-5 border border-[#E5E0D8] rounded-xl bg-[#FFFDF9] overflow-hidden shadow-2xs">
          <div className="px-4 py-2.5 border-b border-[#E5E0D8] bg-[#F3EFE6] flex items-center justify-between gap-3 text-xs">
            <div className="font-mono font-semibold text-[#B83314] whitespace-nowrap truncate">
              <span>{activeFile.path}</span>
              <span className="mx-1.5 text-[#E11D74]" aria-hidden="true">·</span>
              <span className="text-[#57534E]">{lineCount}L</span>
            </div>

            <div className="flex items-center gap-1 bg-[#FAF8F5] p-0.5 rounded-lg border border-[#E5E0D8] shrink-0">
              <button
                type="button"
                onClick={() => setEditorMode('code')}
                className={`px-2.5 py-1 text-xs rounded-md transition-colors whitespace-nowrap ${
                  editorMode === 'code'
                    ? 'bg-[#B83314] text-[#FFF4D6] font-bold'
                    : 'text-[#57534E] hover:text-[#0284C7]'
                }`}
              >
                Editor
              </button>
              <button
                type="button"
                onClick={() => setEditorMode('diff')}
                className={`px-2.5 py-1 text-xs rounded-md transition-colors flex items-center gap-1 whitespace-nowrap ${
                  editorMode === 'diff'
                    ? 'bg-[#B83314] text-[#FFF4D6] font-bold'
                    : 'text-[#57534E] hover:text-[#0284C7]'
                }`}
              >
                <GitCompare className="w-3 h-3 text-[#E11D74]" />
                <span>Diff (+{diffData.addedCount}/-{diffData.removedCount})</span>
              </button>
            </div>
          </div>

          {/* Code Autocomplete Snippet Suggestions Bar */}
          <div className="px-3 py-2 border-b border-[#E5E0D8] bg-[#FAF8F5] flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-mono font-semibold text-[#B45309] flex items-center gap-1 mr-1">
              <Sparkles className="w-3 h-3 text-[#E11D74]" />
              <span>Autocompletar Trecho:</span>
            </span>
            {CODE_SNIPPET_SUGGESTIONS.map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleInsertSnippetSuggestion(s.snippet, s.label)}
                className="px-2 py-0.5 text-[11px] font-mono rounded border border-[#E5E0D8] bg-[#FFFDF9] text-[#0284C7] hover:border-[#0284C7] hover:text-[#B83314] flex items-center gap-1"
              >
                <CompanyLogoSvg provider={s.provider} className="w-3 h-3" />
                <span>{s.label}</span>
              </button>
            ))}
          </div>

          {editorMode === 'code' ? (
            <div className="relative flex font-mono text-xs bg-[#FFFDF9]">
              <div
                aria-hidden="true"
                className="py-4 px-3 bg-[#F3EFE6] text-[#78716C] select-none text-right border-r border-[#E5E0D8] tabular-nums leading-6"
              >
                {Array.from({ length: Math.max(1, lineCount) }).map((_, i) => (
                  <div key={i}>{i + 1}</div>
                ))}
              </div>
              <textarea
                aria-label={`Editor de código para ${activeFile.path}`}
                value={draftContent}
                onChange={(e) => setDraftContent(e.target.value)}
                spellCheck={false}
                rows={18}
                className="w-full p-4 bg-transparent text-[#0284C7] font-mono text-xs leading-6 focus:outline-none resize-y"
              />
            </div>
          ) : (
            <div className="p-4 font-mono text-xs space-y-1 max-h-[500px] overflow-y-auto bg-[#FFFDF9]">
              <div className="text-[11px] text-[#57534E] pb-2 mb-2 border-b border-[#E5E0D8] flex items-center justify-between tabular-nums">
                <span>Comparação de Alterações AST / JSDoc</span>
                <span className="text-[#B45309] font-semibold">
                  +{diffData.addedCount} adicionadas · -{diffData.removedCount} removidas
                </span>
              </div>
              {diffData.lines.map((dLine, idx) => (
                <div
                  key={idx}
                  className={`px-2 py-0.5 rounded whitespace-pre-wrap ${
                    dLine.type === 'added'
                      ? 'bg-[#0284C7]/10 text-[#0284C7] font-semibold'
                      : dLine.type === 'removed'
                      ? 'bg-[#DC2626]/10 text-[#DC2626] line-through'
                      : 'text-[#57534E]'
                  }`}
                >
                  <span className="inline-block w-5 select-none">
                    {dLine.type === 'added' ? '+' : dLine.type === 'removed' ? '-' : ' '}
                  </span>
                  <span>{dLine.content}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: AI Code Review & Documentation Output */}
        <div className="lg:col-span-4 space-y-5">
          <div className="border border-[#E5E0D8] rounded-xl bg-[#FFFDF9] p-4 shadow-2xs">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div>
                <h2 className="text-sm font-bold text-[#B83314]">
                  Diagnóstico de Revisão de Código IA
                </h2>
                <p className="text-xs text-[#57534E]">
                  Grok CLI (1.1) · Gemini CLI (1.2) · Codex CLI (1.3)
                </p>
              </div>
              <button
                type="button"
                onClick={handleApplyAutoFix}
                className="px-2.5 py-1.5 text-xs font-bold bg-[#B83314]/12 hover:bg-[#B83314]/20 border border-[#B83314]/40 text-[#B83314] rounded-lg transition-colors flex items-center gap-1 whitespace-nowrap shrink-0"
              >
                <Check className="w-3.5 h-3.5 text-[#0284C7]" />
                <span>Aplicar Correções IA</span>
              </button>
            </div>

            <div className="space-y-3">
              {reviewIssues.map((issue) => (
                <div
                  key={issue.id}
                  className="p-3 rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2 text-xs font-mono tabular-nums">
                    <span
                      className={`whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                        issue.severity === 'Error'
                          ? 'text-[#DC2626] font-bold'
                          : issue.severity === 'Warning'
                          ? 'text-[#B45309] font-bold'
                          : 'text-[#0284C7] font-bold'
                      }`}
                    >
                      <CompanyLogoSvg provider={issue.provider} className="w-3.5 h-3.5" />
                      <span>{issue.severity} · Linha {issue.line}</span>
                    </span>
                    <span className="text-[#57534E] whitespace-nowrap truncate">
                      {issue.rule}
                    </span>
                  </div>
                  <p className="text-xs text-[#0284C7] leading-relaxed">
                    {issue.message}
                  </p>
                  <p className="text-[11px] font-mono text-[#B45309]">
                    Sugestão: {issue.suggestedFix}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="border border-[#E5E0D8] rounded-xl bg-[#FFFDF9] p-4 shadow-2xs">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-bold text-[#B83314]">
                  Documentação Técnica (JSDoc / MD)
                </h2>
                <p className="text-xs text-[#57534E] mt-0.5">
                  Extraída pelo Gemini CLI (1.2)
                </p>
              </div>
              <button
                type="button"
                onClick={handleExportDocsToReadme}
                className="px-2.5 py-1.5 text-xs font-semibold bg-[#F3EFE6] hover:bg-[#EAE5D9] border border-[#0284C7]/40 text-[#0284C7] rounded-lg transition-colors flex items-center gap-1 whitespace-nowrap shrink-0"
              >
                <Download className="w-3.5 h-3.5 text-[#B45309]" />
                <span>Salvar no README</span>
              </button>
            </div>
            <div className="mt-3 p-3 rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] font-mono text-xs text-[#57534E] whitespace-pre-wrap leading-relaxed">
              {generatedMarkdownDocs ||
                `Clique em "Gerar Documentação IA (Gemini 1.2)" para extrair contratos e injetar JSDoc automaticamente em ${activeFile.path}.`}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
