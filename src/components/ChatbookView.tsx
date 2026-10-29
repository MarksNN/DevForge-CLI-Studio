import React, { useEffect, useRef, useState } from 'react';
import { BookmarkCheck, Code2, Play, Save, Send, Sparkles } from 'lucide-react';
import {
  ChatbookMessage,
  CliProviderId,
  ProjectFile,
  getCliAutocompleteSuggestions,
} from '../utils/cliEngine';
import { CompanyLogoSvg } from './CompanyLogos';
import { MicButton } from './MicButton';

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
  listening?: boolean;
  voiceSupported?: boolean;
  interimTranscript?: string;
  onToggleVoice?: () => void;
}

const AGENTS = [
  { id: 'grok', label: 'Grok' },
  { id: 'gemini', label: 'Gemini' },
  { id: 'codex', label: 'Codex' },
  { id: 'claude', label: 'Claude' },
  { id: 'gh', label: 'GitHub' },
] as const;

const CHATBOOK_SUGGESTIONS: Array<{
  agent: Exclude<CliProviderId, 'system'>;
  label: string;
  prompt: string;
}> = [
  {
    agent: 'grok',
    label: 'Auditar token e concorrência',
    prompt:
      'Analise possíveis falhas de concorrência e expiração em src/auth/tokenGuard.ts e gere um patch seguro.',
  },
  {
    agent: 'gemini',
    label: 'Documentar o processador',
    prompt: 'Documente todas as interfaces e regras fiscais de src/core/orderProcessor.ts em formato JSDoc.',
  },
  {
    agent: 'codex',
    label: 'Gerar testes de borda',
    prompt: 'Gere testes unitários node:test cobrindo descontos e erros em src/core/orderProcessor.ts.',
  },
  {
    agent: 'claude',
    label: 'Revisar o desenho',
    prompt: 'Faça a crítica de desenho do tokenGuard e diga o que a xAI deve corrigir antes do handoff.',
  },
  {
    agent: 'gh',
    label: 'Checklist do pull request',
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
  listening = false,
  voiceSupported = true,
  interimTranscript = '',
  onToggleVoice,
}) => {
  const [selectedAgent, setSelectedAgent] = useState<Exclude<CliProviderId, 'system'>>('gemini');
  const [promptInput, setPromptInput] = useState('');
  const [filterSavedOnly, setFilterSavedOnly] = useState(false);
  const [ideasOpen, setIdeasOpen] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const autocompleteItems = getCliAutocompleteSuggestions(promptInput, files, activeBranch);
  const displayedMessages = filterSavedOnly ? messages.filter((message) => message.saved) : messages;
  const stream = [...displayedMessages].reverse();

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [stream.length, isSending, listening]);

  const handleSubmit = async (event?: { preventDefault?: () => void }) => {
    event?.preventDefault?.();
    const trimmed = promptInput.trim();
    if (!trimmed || isSending) return;
    setPromptInput('');
    setIsSending(true);
    await onSendMessage(selectedAgent, trimmed);
    setIsSending(false);
  };

  const handleGlobalSave = () => {
    onSaveAllChatbook();
    setSaveFeedback('Chatbook salvo neste navegador.');
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#FFFCF8]">
      <div className="flex items-center gap-1 overflow-x-auto border-b border-[#F0E9DF] px-3 py-2">
        {AGENTS.map((agent) => {
          const active = selectedAgent === agent.id;
          return (
            <button
              key={agent.id}
              type="button"
              onClick={() => setSelectedAgent(agent.id)}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold ${
                active
                  ? 'border-transparent bg-[#B83314] text-[#FFF7ED]'
                  : 'border-[#E7E0D6] bg-white text-[#57534E] hover:border-[#0284C7]'
              }`}
            >
              <CompanyLogoSvg provider={agent.id} className="h-3.5 w-3.5" />
              {agent.label}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-1.5 border-b border-[#F0E9DF] px-3 py-2">
        <button
          type="button"
          onClick={() => setFilterSavedOnly((value) => !value)}
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${
            filterSavedOnly ? 'bg-[#B45309] text-[#FFF7ED]' : 'bg-white text-[#57534E] ring-1 ring-[#E7E0D6]'
          }`}
        >
          <BookmarkCheck className="h-3 w-3" />
          {filterSavedOnly ? 'Salvos' : 'Tudo'}
        </button>
        <button
          type="button"
          onClick={() => setIdeasOpen((value) => !value)}
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${
            ideasOpen ? 'bg-[#0284C7] text-white' : 'bg-white text-[#57534E] ring-1 ring-[#E7E0D6]'
          }`}
        >
          <Sparkles className="h-3 w-3" />
          Ideias
        </button>
        <button
          type="button"
          onClick={handleGlobalSave}
          className="ml-auto inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-[#0284C7] ring-1 ring-[#E7E0D6]"
        >
          <Save className="h-3 w-3" />
          Salvar
        </button>
      </div>

      {saveFeedback && (
        <p className="border-b border-[#F6E7C1] bg-[#FFF8E8] px-3 py-1.5 text-[11px] text-[#B45309]">{saveFeedback}</p>
      )}

      {ideasOpen && (
        <div className="max-h-40 space-y-1.5 overflow-y-auto border-b border-[#F0E9DF] bg-[#FFF8F3] px-3 py-2">
          {CHATBOOK_SUGGESTIONS.map((idea) => (
            <div
              key={idea.label}
              className="flex items-center gap-2 rounded-xl bg-white px-2.5 py-2 text-[11px] ring-1 ring-[#E7E0D6]"
            >
              <CompanyLogoSvg provider={idea.agent} className="h-3.5 w-3.5 shrink-0" />
              <button
                type="button"
                onClick={() => {
                  setSelectedAgent(idea.agent);
                  setPromptInput(idea.prompt);
                  setIdeasOpen(false);
                }}
                className="min-w-0 flex-1 text-left"
              >
                <span className="block font-bold text-[#9F2D12]">{idea.label}</span>
                <span className="line-clamp-1 text-[#78716C]">{idea.prompt}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedAgent(idea.agent);
                  setIdeasOpen(false);
                  void onSendMessage(idea.agent, idea.prompt);
                }}
                className="shrink-0 rounded-lg bg-[#E11D74] px-2 py-1 text-[10px] font-bold text-[#FFF7ED]"
              >
                Enviar
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto px-3 py-3">
        {stream.length === 0 && (
          <p className="rounded-2xl bg-white px-3 py-4 text-center text-xs text-[#78716C] ring-1 ring-[#E7E0D6]">
            Nenhuma nota salva ainda. Fale no microfone ou escreva para {selectedAgent}.
          </p>
        )}
        {stream.map((message) => {
          const mine = message.role === 'user';
          return (
            <article
              key={message.id}
              className={`max-w-[95%] rounded-2xl px-3 py-2.5 text-xs shadow-sm ${
                mine
                  ? 'ml-auto bg-gradient-to-br from-[#B83314] to-[#C2410C] text-[#FFF7ED]'
                  : 'mr-auto bg-white text-[#3F3A36] ring-1 ring-[#E7E0D6]'
              }`}
            >
              <div className="mb-1 flex items-center gap-1.5">
                <CompanyLogoSvg provider={message.agent} className="h-3.5 w-3.5 shrink-0" />
                <span className={`truncate font-bold ${mine ? 'text-[#FFE7D1]' : 'text-[#9F2D12]'}`}>{message.title}</span>
                <span className={`ml-auto shrink-0 font-mono text-[10px] ${mine ? 'text-[#FFE7D1]' : 'text-[#A8A29E]'}`}>
                  {message.timestamp}
                </span>
              </div>
              <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
              {message.codeSnippet && (
                <div className={`mt-2 rounded-xl p-2 ${mine ? 'bg-black/15' : 'bg-[#FAF6F1]'}`}>
                  <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-[11px]">{message.codeSnippet}</pre>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => onInsertSnippetToEditor(message.codeSnippet!)}
                      className="inline-flex items-center gap-1 rounded-lg bg-[#0284C7] px-2 py-1 text-[10px] font-bold text-white"
                    >
                      <Code2 className="h-3 w-3" />
                      Inserir em {activeFile.name}
                    </button>
                    {message.suggestedCommand && (
                      <button
                        type="button"
                        onClick={() => onExecuteSuggestedCommand(message.suggestedCommand!, message.agent)}
                        className="inline-flex items-center gap-1 rounded-lg bg-[#E11D74] px-2 py-1 text-[10px] font-bold text-white"
                      >
                        <Play className="h-3 w-3" />
                        Rodar
                      </button>
                    )}
                  </div>
                </div>
              )}
              <button
                type="button"
                onClick={() => onToggleSaveMessage(message.id)}
                className={`mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  message.saved
                    ? mine
                      ? 'bg-white/20 text-white'
                      : 'bg-[#F6E7C1] text-[#B45309]'
                    : mine
                      ? 'bg-black/10 text-[#FFE7D1]'
                      : 'bg-[#FAF6F1] text-[#78716C]'
                }`}
              >
                <Save className="h-3 w-3" />
                {message.saved ? 'Nota salva' : 'Salvar nota'}
              </button>
            </article>
          );
        })}
        <div ref={endRef} />
      </div>

      <form onSubmit={handleSubmit} className="space-y-2 border-t border-[#F0E9DF] bg-white/80 p-3">
        {promptInput.trim().length > 0 && autocompleteItems.length > 0 && (
          <div className="flex gap-1.5 overflow-x-auto">
            {autocompleteItems.slice(0, 4).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setPromptInput(item.command)}
                className="shrink-0 rounded-full bg-[#FAF6F1] px-2.5 py-1 font-mono text-[10px] text-[#0F3A56] ring-1 ring-[#E7E0D6]"
              >
                {item.command}
              </button>
            ))}
          </div>
        )}
        {listening && (
          <p className="flex items-center gap-2 text-[11px] font-semibold text-[#E11D74]">
            <span className="voice-bars" aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
            </span>
            {interimTranscript || 'Ouvindo o comando de voz…'}
          </p>
        )}
        <div className="flex items-end gap-2">
          {onToggleVoice && (
            <MicButton
              listening={listening}
              supported={voiceSupported}
              onClick={onToggleVoice}
              className="h-11 w-11"
            />
          )}
          <textarea
            value={promptInput}
            onChange={(event) => setPromptInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                void handleSubmit(event);
              }
            }}
            rows={2}
            aria-label="Mensagem ou comando para o Chatbook"
            placeholder={`Fale ou escreva para ${selectedAgent}…`}
            className="max-h-28 min-h-11 flex-1 resize-none rounded-2xl border border-[#E7E0D6] bg-[#FFFCF8] px-3 py-2 text-xs text-[#3F3A36] placeholder:text-[#A8A29E] focus:border-[#E11D74] focus:outline-none"
          />
          <button
            type="submit"
            disabled={isSending}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#B83314] text-[#FFF7ED] disabled:opacity-60"
            aria-label="Enviar ao Chatbook"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
