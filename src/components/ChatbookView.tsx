import React, { useState } from 'react';
import {
  BookOpen,
  Send,
  Save,
  BookmarkCheck,
  Play,
  Code2,
  Sparkles,
} from 'lucide-react';
import {
  ChatbookMessage,
  CliProviderId,
  ProjectFile,
  getCliAutocompleteSuggestions,
} from '../utils/cliEngine';
import { CompanyLogoSvg } from './CompanyLogos';

interface ChatbookViewProps {
  messages: ChatbookMessage[];
  activeFile: ProjectFile;
  activeBranch: string;
  files: ProjectFile[];
  onSendMessage: (
    agent: Exclude<CliProviderId, 'system'>,
    promptText: string
  ) => Promise<void>;
  onToggleSaveMessage: (msgId: string) => void;
  onSaveAllChatbook: () => void;
  onInsertSnippetToEditor: (codeSnippet: string) => void;
  onExecuteSuggestedCommand: (cmd: string, agent: Exclude<CliProviderId, 'system'>) => void;
}

const CHATBOOK_SUGGESTIONS: Array<{
  agent: Exclude<CliProviderId, 'system'>;
  label: string;
  prompt: string;
}> = [
  {
    agent: 'grok',
    label: 'Auditar vulnerabilidades de token e race conditions (Grok 1.1)',
    prompt: 'Analise possíveis falhas de concorrência e expiração em src/auth/tokenGuard.ts e gere um patch seguro.',
  },
  {
    agent: 'gemini',
    label: 'Gerar especificação JSDoc e resumo arquitetural (Gemini 1.2)',
    prompt: 'Documente todas as interfaces e regras fiscais de src/core/orderProcessor.ts em formato JSDoc.',
  },
  {
    agent: 'codex',
    label: 'Criar suíte de testes unitários para casos-limite (Codex 1.3)',
    prompt: 'Gere testes unitários node:test cobrindo descontos e erros em src/core/orderProcessor.ts.',
  },
  {
    agent: 'claude',
    label: 'Revisar trade-offs de desenho (Claude 1.5)',
    prompt: 'Faça a crítica de desenho do tokenGuard e diga o que a xAI deve corrigir antes do handoff.',
  },
  {
    agent: 'gh',
    label: 'Preparar checklist de Pull Request e release canary (GitHub 1.4)',
    prompt: 'Monte o comando gh pr create e valide o workflow de deploy para a branch atual.',
  },
];

export const ChatbookView: React.FC<ChatbookViewProps> = ({
  messages,
  activeFile,
  activeBranch,
  files,
  onSendMessage,
  onToggleSaveMessage,
  onSaveAllChatbook,
  onInsertSnippetToEditor,
  onExecuteSuggestedCommand,
}) => {
  const [selectedAgent, setSelectedAgent] = useState<Exclude<CliProviderId, 'system'>>('gemini');
  const [promptInput, setPromptInput] = useState('');
  const [filterSavedOnly, setFilterSavedOnly] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  const autocompleteItems = getCliAutocompleteSuggestions(promptInput, files, activeBranch);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = promptInput.trim();
    if (!trimmed) return;
    setPromptInput('');
    setIsSending(true);
    await onSendMessage(selectedAgent, trimmed);
    setIsSending(false);
  };

  const handleGlobalSave = () => {
    onSaveAllChatbook();
    setSaveFeedback('Chatbook e células de código salvos no armazenamento local com sucesso!');
  };

  const displayedMessages = filterSavedOnly
    ? messages.filter((m) => m.saved)
    : messages;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0284C7] flex items-center gap-2.5">
            <BookOpen className="w-6 h-6 text-[#B83314]" />
            <span>Chatbook Interativo Multi-CLI & Notebook IA</span>
          </h1>
          <p className="text-sm text-[#57534E] mt-1">
            Fale com xAI, Google, OpenAI, Anthropic ou GitHub. O DevForge guarda a rota e o handoff no terminal.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setFilterSavedOnly(!filterSavedOnly)}
            className={`px-3.5 py-2 text-xs font-bold rounded-lg border transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              filterSavedOnly
                ? 'bg-[#B83314] border-[#B83314] text-[#FFF4D6]'
                : 'bg-[#FFFDF9] border-[#E5E0D8] text-[#57534E] hover:text-[#0284C7]'
            }`}
          >
            <BookmarkCheck className={`w-3.5 h-3.5 ${filterSavedOnly ? 'text-[#FFF4D6]' : 'text-[#E11D74]'}`} />
            <span>{filterSavedOnly ? 'Mostrando Salvos' : 'Filtrar Salvos'}</span>
          </button>

          <button
            type="button"
            onClick={handleGlobalSave}
            className="px-4 py-2 text-xs font-bold bg-[#B83314] hover:bg-[#9E2B10] text-[#FFF4D6] rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap"
          >
            <Save className="w-3.5 h-3.5 text-[#FFF4D6]" />
            <span>Salvar Chatbook</span>
          </button>
        </div>
      </div>

      {saveFeedback && (
        <div
          role="status"
          className="px-4 py-2.5 rounded-lg border border-[#D97706]/50 bg-[#FFFDF9] text-xs text-[#B45309] flex items-center justify-between"
        >
          <span>{saveFeedback}</span>
          <button
            type="button"
            onClick={() => setSaveFeedback(null)}
            className="text-[#E11D74] hover:text-[#DC2626] font-bold ml-4"
          >
            Fechar
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left / Main Chatbook Stream (8 cols) */}
        <div className="lg:col-span-8 border border-[#E5E0D8] rounded-xl bg-[#FFFDF9] overflow-hidden shadow-2xs">
          {/* Agent Selector Bar with Company SVGs */}
          <div className="p-3.5 border-b border-[#E5E0D8] bg-[#F3EFE6] flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs font-bold text-[#B83314]">
              Selecionar Motor IA do Chatbook:
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {(
                [
                  { id: 'grok', label: '1.1 Grok CLI' },
                  { id: 'gemini', label: '1.2 Gemini CLI' },
                  { id: 'codex', label: '1.3 Codex' },
                  { id: 'claude', label: '1.5 Claude' },
                  { id: 'gh', label: '1.4 GitHub' },
                ] as const
              ).map((ag) => (
                <button
                  key={ag.id}
                  type="button"
                  onClick={() => setSelectedAgent(ag.id)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-mono transition-colors flex items-center gap-2 whitespace-nowrap ${
                    selectedAgent === ag.id
                      ? 'bg-[#B83314] border-[#B83314] text-[#FFF4D6] font-bold'
                      : 'bg-[#FFFDF9] border-[#E5E0D8] text-[#57534E] hover:text-[#0284C7]'
                  }`}
                >
                  <CompanyLogoSvg provider={ag.id} className="w-4 h-4" />
                  <span>{ag.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Chatbook Cells / Entries */}
          <div className="p-4 space-y-4 max-h-[430px] overflow-y-auto bg-[#FAF8F5]">
            {displayedMessages.map((msg) => (
              <div
                key={msg.id}
                className="p-4 rounded-xl border border-[#E5E0D8] bg-[#FFFDF9] space-y-3 shadow-2xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <CompanyLogoSvg provider={msg.agent} className="w-5 h-5" />
                    <span className="text-xs font-bold text-[#B83314]">
                      {msg.title}
                    </span>
                    <span className="text-xs font-mono text-[#57534E] tabular-nums">
                      · {msg.timestamp}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => onToggleSaveMessage(msg.id)}
                    className={`px-2.5 py-1 text-xs font-mono rounded-lg border transition-colors flex items-center gap-1 whitespace-nowrap ${
                      msg.saved
                        ? 'border-[#D97706]/60 bg-[#D97706]/10 text-[#B45309] font-semibold'
                        : 'border-[#E5E0D8] text-[#57534E] hover:text-[#0284C7]'
                    }`}
                  >
                    <Save className="w-3 h-3" />
                    <span>{msg.saved ? 'Nota Salva' : 'Salvar Nota'}</span>
                  </button>
                </div>

                <p className="text-xs text-[#0284C7] leading-relaxed whitespace-pre-wrap">
                  {msg.content}
                </p>

                {msg.codeSnippet && (
                  <div className="p-3 rounded-lg border border-[#E5E0D8] bg-[#F3EFE6] space-y-2">
                    <pre className="text-xs font-mono text-[#B45309] whitespace-pre-wrap overflow-x-auto">
                      {msg.codeSnippet}
                    </pre>
                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#E5E0D8]">
                      <button
                        type="button"
                        onClick={() => onInsertSnippetToEditor(msg.codeSnippet!)}
                        className="px-2.5 py-1 text-xs font-mono font-semibold bg-[#0284C7]/12 hover:bg-[#0284C7]/20 border border-[#0284C7]/40 text-[#0284C7] rounded-md flex items-center gap-1"
                      >
                        <Code2 className="w-3 h-3" />
                        <span>Inserir em {activeFile.name}</span>
                      </button>
                      {msg.suggestedCommand && (
                        <button
                          type="button"
                          onClick={() =>
                            onExecuteSuggestedCommand(msg.suggestedCommand!, msg.agent)
                          }
                          className="px-2.5 py-1 text-xs font-mono font-semibold bg-[#E11D74]/12 hover:bg-[#E11D74]/20 border border-[#E11D74]/40 text-[#E11D74] rounded-md flex items-center gap-1"
                        >
                          <Play className="w-3 h-3" />
                          <span>Rodar: $ {msg.suggestedCommand}</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Chatbook Input with Live Autocomplete */}
          <div className="p-4 border-t border-[#E5E0D8] bg-[#F3EFE6] space-y-3">
            {/* Live Autocomplete Bar */}
            {promptInput.trim().length > 0 && autocompleteItems.length > 0 && (
              <div className="p-2.5 rounded-lg border border-[#D97706]/40 bg-[#FFFDF9] space-y-1.5">
                <div className="text-[11px] font-mono font-semibold text-[#B45309]">
                  Autocompletar Inteligente (clique para preencher):
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {autocompleteItems.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setPromptInput(item.command)}
                      className="px-2.5 py-1 text-xs font-mono rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] text-[#0284C7] hover:border-[#E11D74] hover:text-[#B83314] transition-colors flex items-center gap-1.5"
                    >
                      <CompanyLogoSvg provider={item.provider} className="w-3.5 h-3.5" />
                      <span>{item.command}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex items-center gap-2.5">
              <input
                type="text"
                value={promptInput}
                onChange={(e) => setPromptInput(e.target.value)}
                aria-label="Mensagem ou comando para o Chatbook"
                placeholder="Pergunte ao agente ou digite devforge / grok / gemini / codex / claude / gh..."
                className="w-full bg-[#FFFDF9] border border-[#E5E0D8] rounded-lg px-3.5 py-2 text-xs font-mono text-[#0284C7] placeholder:text-[#78716C] focus:outline-none focus:border-[#0284C7]"
              />
              <button
                type="submit"
                disabled={isSending}
                className="px-4 py-2 bg-[#B83314] hover:bg-[#9E2B10] text-[#FFF4D6] text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
              >
                <Send className="w-3.5 h-3.5 text-[#FFF4D6]" />
                <span>{isSending ? 'Consultando...' : 'Enviar ao Chatbook'}</span>
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Contextual Suggestions & Saved Notes Summary (4 cols) */}
        <div className="lg:col-span-4 space-y-5">
          <div className="p-5 rounded-xl border border-[#E5E0D8] bg-[#FFFDF9] space-y-3.5 shadow-2xs">
            <h2 className="text-sm font-bold text-[#B83314] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#E11D74]" />
              <span>Sugestões Contextuais de Engenharia</span>
            </h2>
            <p className="text-xs text-[#57534E]">
              Clique em uma sugestão para preencher ou consultar diretamente o agente respectivo:
            </p>

            <div className="space-y-2.5">
              {CHATBOOK_SUGGESTIONS.map((sug, index) => (
                <div
                  key={index}
                  className="p-3 rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] space-y-2 hover:border-[#0284C7]/60 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-[#0284C7] flex items-center gap-2">
                      <CompanyLogoSvg provider={sug.agent} className="w-4 h-4 shrink-0" />
                      <span>{sug.label}</span>
                    </span>
                  </div>
                  <p className="text-[11px] text-[#57534E] leading-relaxed">
                    {sug.prompt}
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedAgent(sug.agent);
                        setPromptInput(sug.prompt);
                      }}
                      className="px-2.5 py-1 text-xs font-mono font-semibold border border-[#0284C7]/40 bg-[#FFFDF9] text-[#0284C7] hover:text-[#B83314] rounded-md"
                    >
                      Autocompletar Prompt
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedAgent(sug.agent);
                        onSendMessage(sug.agent, sug.prompt);
                      }}
                      className="px-2.5 py-1 text-xs font-mono font-semibold border border-[#E11D74]/40 bg-[#FFFDF9] text-[#E11D74] hover:text-[#B83314] rounded-md"
                    >
                      Executar Agora
                    </button>
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
