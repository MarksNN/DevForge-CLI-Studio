import React, { useState } from 'react';
import {
  GitBranch,
  GitCommit as GitCommitIcon,
  GitPullRequest,
  GitMerge,
  UploadCloud,
  Wand2,
  Plus,
  Check,
  Sparkles,
} from 'lucide-react';
import {
  GitCommit,
  PullRequest,
  ProjectFile,
} from '../utils/cliEngine';
import { CompanyLogoSvg } from './CompanyLogos';

interface GitGithubViewProps {
  activeBranch: string;
  branches: string[];
  stagedFiles: string[];
  files: ProjectFile[];
  commits: GitCommit[];
  pullRequests: PullRequest[];
  onSwitchBranch: (branch: string) => void;
  onCreateBranch: (newBranch: string) => void;
  onToggleStageFile: (filePath: string) => void;
  onCreateCommit: (message: string) => void;
  onPushBranch: () => void;
  onCreatePullRequest: (title: string, description: string, targetBranch: string) => void;
  onMergePullRequest: (prNumber: number) => void;
}

const COMMIT_SUGGESTIONS = [
  'feat(cli): unify Grok, Gemini, Codex and GitHub CLI runners',
  'fix(auth): enforce 5000ms clock skew tolerance in tokenGuard',
  'docs(orders): inject JSDoc headers via Gemini CLI 1.2',
  'test(sync): add unit test suite via Codex CLI 1.3',
];

export const GitGithubView: React.FC<GitGithubViewProps> = ({
  activeBranch,
  branches,
  stagedFiles,
  files,
  commits,
  pullRequests,
  onSwitchBranch,
  onCreateBranch,
  onToggleStageFile,
  onCreateCommit,
  onPushBranch,
  onCreatePullRequest,
  onMergePullRequest,
}) => {
  const [commitMessage, setCommitMessage] = useState('');
  const [commitFeedback, setCommitFeedback] = useState<string | null>(null);
  const [newBranchName, setNewBranchName] = useState('');
  const [prTitle, setPrTitle] = useState('');
  const [prDescription, setPrDescription] = useState('');
  const [prTargetBranch, setPrTargetBranch] = useState('main');
  const [prStatusFilter, setPrStatusFilter] = useState<'all' | 'Open' | 'Merged'>('all');

  const handleGenerateAiCommitMessage = () => {
    const targetList =
      stagedFiles.length > 0
        ? stagedFiles.map((p) => p.split('/').pop()).join(', ')
        : 'workspace modules';
    const suggested = `feat(cli): synchronize ${targetList} with multi-CLI validation`;
    setCommitMessage(suggested);
    setCommitFeedback('Mensagem Conventional Commit gerada pelo Gemini CLI (1.2).');
  };

  const handleCommitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commitMessage.trim()) {
      setCommitFeedback('Digite uma mensagem de commit ou use o gerador IA antes de confirmar.');
      return;
    }
    onCreateCommit(commitMessage.trim());
    setCommitMessage('');
    setCommitFeedback(`Commit registrado na branch ${activeBranch} via Git / GitHub CLI.`);
  };

  const handleBranchCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBranchName.trim()) return;
    onCreateBranch(newBranchName.trim());
    setNewBranchName('');
  };

  const handlePrCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prTitle.trim()) return;
    onCreatePullRequest(
      prTitle.trim(),
      prDescription.trim() || 'Pull Request criado e auditado via GitHub CLI (1.4).',
      prTargetBranch
    );
    setPrTitle('');
    setPrDescription('');
  };

  const visiblePrs =
    prStatusFilter === 'all'
      ? pullRequests
      : pullRequests.filter((pr) => pr.status === prStatusFilter);

  return (
    <div className="space-y-8">
      {/* Header & Branch Controls */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0284C7] flex items-center gap-2.5">
            <CompanyLogoSvg provider="gh" className="w-6 h-6" />
            <span>Controle Git & Integração GitHub CLI (1.4)</span>
          </h1>
          <p className="text-sm text-[#57534E] mt-1">
            Execute stage, commit semântico com autocompletar, push, criação de Pull Requests e merge automatizado via <code className="text-[#B45309] font-semibold">gh</code>.
          </p>
        </div>

        <div className="flex flex-wrap xl:flex-nowrap items-center gap-2.5 shrink-0">
          <div className="flex items-center gap-2 bg-[#FFFDF9] border border-[#E5E0D8] rounded-lg px-3 py-1.5 whitespace-nowrap">
            <GitBranch className="w-4 h-4 text-[#0284C7] shrink-0" />
            <label htmlFor="branch-selector" className="text-xs text-[#57534E]">
              Branch:
            </label>
            <select
              id="branch-selector"
              value={activeBranch}
              onChange={(e) => onSwitchBranch(e.target.value)}
              className="bg-transparent text-xs font-mono font-bold text-[#B83314] focus:outline-none"
            >
              {branches.map((b) => (
                <option key={b} value={b} className="bg-[#FAF8F5] text-[#B83314]">
                  {b}
                </option>
              ))}
            </select>
          </div>

          <form onSubmit={handleBranchCreateSubmit} className="flex items-center gap-1.5 whitespace-nowrap">
            <input
              type="text"
              value={newBranchName}
              onChange={(e) => setNewBranchName(e.target.value)}
              placeholder="feat/nova-branch"
              aria-label="Nome da nova branch"
              className="w-36 bg-[#FFFDF9] border border-[#E5E0D8] rounded-lg px-2.5 py-1.5 text-xs font-mono text-[#0284C7] placeholder:text-[#78716C] focus:outline-none focus:border-[#0284C7]"
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-[#F3EFE6] hover:bg-[#EAE5D9] border border-[#E5E0D8] text-[#B45309] text-xs font-bold rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              Criar Branch
            </button>
          </form>

          <button
            type="button"
            onClick={onPushBranch}
            className="px-3.5 py-1.5 bg-[#B83314] hover:bg-[#9E2B10] text-[#FFF4D6] text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <UploadCloud className="w-3.5 h-3.5 text-[#FFF4D6]" />
            <span>git push origin</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Staging & Commit on Left, Pull Requests on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Working Tree, Staging & Commit Composer */}
        <div className="lg:col-span-5 space-y-6">
          <div className="border border-[#E5E0D8] rounded-xl bg-[#FFFDF9] p-5 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-[#B83314]">
                Staging Area & Commit Local
              </h2>
              <span className="text-xs font-mono font-semibold text-[#0284C7] tabular-nums">
                {stagedFiles.length} em stage
              </span>
            </div>

            <div className="space-y-1.5">
              {files.map((file) => {
                const isStaged = stagedFiles.includes(file.path);
                return (
                  <div
                    key={file.path}
                    className="px-3 py-2 rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] flex items-center justify-between text-xs font-mono"
                  >
                    <label className="flex items-center gap-2.5 cursor-pointer truncate">
                      <input
                        type="checkbox"
                        checked={isStaged}
                        onChange={() => onToggleStageFile(file.path)}
                        className="rounded border-[#0284C7] bg-[#FFFDF9]"
                      />
                      <span className="text-[#0284C7] truncate">{file.path}</span>
                    </label>
                    <span className={isStaged ? 'text-[#B83314] font-bold' : 'text-[#57534E]'}>
                      {isStaged ? 'Staged' : file.modified ? 'Modified' : 'Tracked'}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Commit Autocomplete Suggestions */}
            <div className="pt-2 border-t border-[#E5E0D8] space-y-1.5">
              <div className="text-[11px] font-mono font-semibold text-[#B45309] flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#E11D74]" />
                <span>Sugestões de Commit (Autocompletar):</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {COMMIT_SUGGESTIONS.map((sug, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setCommitMessage(sug)}
                    className="px-2 py-0.5 text-[11px] font-mono rounded border border-[#E5E0D8] bg-[#F3EFE6] text-[#0284C7] hover:border-[#0284C7] hover:text-[#B83314] truncate max-w-full"
                  >
                    {sug}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleCommitSubmit} className="space-y-3 pt-2 border-t border-[#E5E0D8]">
              <div className="flex items-center justify-between">
                <label htmlFor="commit-message-input" className="text-xs font-semibold text-[#57534E]">
                  Mensagem de Commit
                </label>
                <button
                  type="button"
                  onClick={handleGenerateAiCommitMessage}
                  className="text-xs font-semibold text-[#0284C7] hover:text-[#B83314] flex items-center gap-1"
                >
                  <Wand2 className="w-3.5 h-3.5 text-[#E11D74]" />
                  <span>Sugerir com Gemini CLI</span>
                </button>
              </div>

              <input
                id="commit-message-input"
                type="text"
                value={commitMessage}
                onChange={(e) => setCommitMessage(e.target.value)}
                placeholder="feat(scope): descreva a alteração realizada"
                className="w-full bg-[#FAF8F5] border border-[#E5E0D8] rounded-lg px-3 py-2 text-xs font-mono text-[#0284C7] placeholder:text-[#78716C] focus:outline-none focus:border-[#0284C7]"
              />

              <button
                type="submit"
                className="w-full py-2 px-4 bg-[#B83314] hover:bg-[#9E2B10] text-[#FFF4D6] text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5"
              >
                <GitCommitIcon className="w-3.5 h-3.5 text-[#FFF4D6]" />
                <span>Salvar & Confirmar Commit ({stagedFiles.length} arquivos)</span>
              </button>
            </form>

            {commitFeedback && (
              <p className="text-xs text-[#B45309] font-mono">{commitFeedback}</p>
            )}
          </div>

          {/* Commit History */}
          <div className="border border-[#E5E0D8] rounded-xl bg-[#FFFDF9] p-5 shadow-2xs">
            <h2 className="text-base font-bold text-[#B83314] mb-3">
              Histórico Recente de Commits
            </h2>
            <div className="divide-y divide-[#E5E0D8]">
              {commits.map((commit) => (
                <div key={commit.hash} className="py-3 first:pt-0 last:pb-0 space-y-1">
                  <div className="flex items-center justify-between text-xs font-mono tabular-nums">
                    <span className="text-[#0284C7] font-bold">{commit.hash}</span>
                    <span className="text-[#57534E]">
                      {commit.branch} · {commit.timestamp} · {commit.filesChanged} arqs
                    </span>
                  </div>
                  <p className="text-xs text-[#B45309] font-medium">{commit.message}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: GitHub CLI Pull Requests Manager */}
        <div className="lg:col-span-7 space-y-6">
          {/* Create PR Form */}
          <div className="border border-[#E5E0D8] rounded-xl bg-[#FFFDF9] p-5 shadow-2xs">
            <h2 className="text-base font-bold text-[#B83314] flex items-center gap-2">
              <GitPullRequest className="w-4 h-4 text-[#E11D74]" />
              <span>Abrir Pull Request via GitHub CLI (gh pr create)</span>
            </h2>

            <form onSubmit={handlePrCreateSubmit} className="mt-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label htmlFor="pr-title-input" className="block text-xs text-[#57534E] mb-1">
                    Título do Pull Request
                  </label>
                  <input
                    id="pr-title-input"
                    type="text"
                    value={prTitle}
                    onChange={(e) => setPrTitle(e.target.value)}
                    placeholder="feat(auth): add clock skew tolerance to CLI token guard"
                    className="w-full bg-[#FAF8F5] border border-[#E5E0D8] rounded-lg px-3 py-1.5 text-xs text-[#0284C7] placeholder:text-[#78716C] focus:outline-none focus:border-[#0284C7]"
                  />
                </div>
                <div>
                  <label htmlFor="pr-base-select" className="block text-xs text-[#57534E] mb-1">
                    Branch Base (--base)
                  </label>
                  <select
                    id="pr-base-select"
                    value={prTargetBranch}
                    onChange={(e) => setPrTargetBranch(e.target.value)}
                    className="w-full bg-[#FAF8F5] border border-[#E5E0D8] rounded-lg px-3 py-1.5 text-xs font-mono font-bold text-[#B83314]"
                  >
                    {branches.map((b) => (
                      <option key={b} value={b} className="bg-[#FAF8F5] text-[#B83314]">
                        {b}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="pr-desc-input" className="block text-xs text-[#57534E] mb-1">
                  Resumo Técnico & Checklist
                </label>
                <input
                  id="pr-desc-input"
                  type="text"
                  value={prDescription}
                  onChange={(e) => setPrDescription(e.target.value)}
                  placeholder="Inclui revisão automática Grok CLI + cobertura JSDoc Gemini CLI"
                  className="w-full bg-[#FAF8F5] border border-[#E5E0D8] rounded-lg px-3 py-1.5 text-xs text-[#0284C7] placeholder:text-[#78716C] focus:outline-none focus:border-[#0284C7]"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-xs font-mono text-[#57534E]">
                  $ gh pr create --base {prTargetBranch} --head {activeBranch}
                </span>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#B83314] hover:bg-[#9E2B10] text-[#FFF4D6] text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap"
                >
                  <Plus className="w-3.5 h-3.5 text-[#FFF4D6]" />
                  <span>Criar Pull Request</span>
                </button>
              </div>
            </form>
          </div>

          {/* Pull Requests List */}
          <div className="border border-[#E5E0D8] rounded-xl bg-[#FFFDF9] p-5 shadow-2xs">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-base font-bold text-[#B83314]">
                  Pull Requests Ativos & Histórico de Merge
                </h2>
                <p className="text-xs text-[#57534E]">
                  Sincronizado com repositório remoto via GitHub CLI.
                </p>
              </div>

              <div className="flex items-center gap-1 bg-[#FAF8F5] p-1 rounded-lg border border-[#E5E0D8]">
                {(['all', 'Open', 'Merged'] as const).map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setPrStatusFilter(status)}
                    className={`px-2.5 py-1 text-xs rounded-md transition-colors whitespace-nowrap ${
                      prStatusFilter === status
                        ? 'bg-[#B83314] text-[#FFF4D6] font-bold'
                        : 'text-[#57534E] hover:text-[#0284C7]'
                    }`}
                  >
                    {status === 'all' ? 'Todos' : status === 'Open' ? 'Abertos' : 'Merged'}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {visiblePrs.map((pr) => (
                <div
                  key={pr.number}
                  className="p-4 rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] space-y-2"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 text-xs font-mono tabular-nums text-[#57534E]">
                        <CompanyLogoSvg provider="gh" className="w-3.5 h-3.5" />
                        <span className="text-[#0284C7] font-bold">PR #{pr.number}</span>
                        <span aria-hidden="true">·</span>
                        <span>
                          {pr.sourceBranch} → {pr.targetBranch}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span
                          className={
                            pr.status === 'Open' ? 'text-[#B45309] font-bold' : 'text-[#E11D74] font-bold'
                          }
                        >
                          {pr.status === 'Open' ? 'Aberto' : 'Merged'}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-[#0284C7] mt-1">
                        {pr.title}
                      </h3>
                    </div>

                    {pr.status === 'Open' ? (
                      <button
                        type="button"
                        onClick={() => onMergePullRequest(pr.number)}
                        className="px-3 py-1.5 bg-[#0284C7]/12 hover:bg-[#0284C7]/20 border border-[#0284C7]/40 text-[#0284C7] text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
                      >
                        <GitMerge className="w-3.5 h-3.5 text-[#E11D74]" />
                        <span>gh pr merge #{pr.number}</span>
                      </button>
                    ) : (
                      <span className="text-xs font-mono font-semibold text-[#B45309] flex items-center gap-1 shrink-0">
                        <Check className="w-3.5 h-3.5 text-[#0284C7]" />
                        <span>Integrado em {pr.targetBranch}</span>
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-[#57534E]">{pr.description}</p>

                  <div className="pt-2 border-t border-[#E5E0D8] flex flex-wrap items-center justify-between text-xs text-[#E11D74] font-mono tabular-nums">
                    <span>Revisão IA: {pr.reviewerAgent}</span>
                    <span className="text-[#B45309] font-semibold">
                      Checks CI: {pr.checks === 'Passing' ? 'Aprovados' : pr.checks} · {pr.createdAt}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
