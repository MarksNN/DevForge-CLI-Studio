import type { CliProviderId } from '../utils/cliEngine';

export type VoiceAgent = Exclude<CliProviderId, 'system'>;

export type CanvasView = 'terminal' | 'editor' | 'github' | 'tasks';

export type VoiceAction =
  | { kind: 'save' }
  | { kind: 'open-chat' }
  | { kind: 'close-chat' }
  | { kind: 'navigate'; view: CanvasView }
  | { kind: 'execute'; command: string }
  | { kind: 'chat'; agent: VoiceAgent; text: string };

const CLI_VERBS = new Set([
  'analyze',
  'docs',
  'test',
  'pr',
  'status',
  'ask',
  'audit',
  'search',
  'install',
  'i',
  'checkout',
  'commit',
  'push',
  'auth',
  'release',
  'workflow',
  'run',
  'metrics',
  'config',
  'explain',
  'coverage',
  'synthesize-test',
  'chatbook',
  'simulate-incident',
  'webhook',
  'repo',
]);

function fold(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
}

function asAgent(token: string): VoiceAgent | null {
  if (token === 'grok') return 'grok';
  if (token === 'gemini') return 'gemini';
  if (token === 'codex') return 'codex';
  if (token === 'claude') return 'claude';
  if (token === 'gh' || token === 'github') return 'gh';
  return null;
}

export function interpretVoiceCommand(raw: string): VoiceAction {
  const original = raw.trim();
  const text = fold(original);
  if (!text) return { kind: 'chat', agent: 'gemini', text: original };

  if (/^(salvar|salva|guardar)( workspace| tudo| modulo)?$/.test(text)) {
    return { kind: 'save' };
  }

  if (/^(fechar|recolher|minimizar)( o)? chat(book)?$/.test(text)) {
    return { kind: 'close-chat' };
  }

  if (/^(abrir|abre|mostrar|mostra)?\s*(o |a )?(chatbook|chat|conversa)$/.test(text)) {
    return { kind: 'open-chat' };
  }

  const routes: Array<[RegExp, CanvasView]> = [
    [/^(abrir|abre|ir para|vai para|mostrar|mostra)?\s*(o |a )?(painel( central)?|terminal|dashboard|hub|inicio)$/, 'terminal'],
    [/^(abrir|abre|ir para|vai para|mostrar|mostra)?\s*(o |a )?(editor|codigo)$/, 'editor'],
    [/^(abrir|abre|ir para|vai para|mostrar|mostra)?\s*(o |a )?(git|github|pull request|pull requests|prs?)$/, 'github'],
    [/^(abrir|abre|ir para|vai para|mostrar|mostra)?\s*(a |as |o )?(agenda|tarefas?|ci|cicd|pipeline)$/, 'tasks'],
  ];
  for (const [pattern, view] of routes) {
    if (pattern.test(text)) return { kind: 'navigate', view };
  }

  const spokenRun = original.match(/^(executar|rodar|run)\s+(.+)$/i);
  if (spokenRun) return { kind: 'execute', command: spokenRun[2].trim() };

  if (/^devforge\b/.test(text) || /^(npm|git)\b/.test(text)) {
    return { kind: 'execute', command: original };
  }

  const lead = text.match(/^(grok|gemini|codex|claude|gh|github)\b[:,]?\s*(.*)$/);
  if (lead) {
    const agent = asAgent(lead[1]);
    const rest = lead[2].trim();
    if (!agent) return { kind: 'chat', agent: 'gemini', text: original };
    if (!rest) return { kind: 'open-chat' };
    const verb = rest.split(' ')[0];
    if (CLI_VERBS.has(verb)) return { kind: 'execute', command: original };
    const restOriginal = original.replace(/^(grok|gemini|codex|claude|gh|github)\b[:,]?\s*/i, '').trim();
    return { kind: 'chat', agent, text: restOriginal || rest };
  }

  const directed = text.match(
    /^(perguntar|pergunta|falar|fala|perguntar ao|falar com)\s+(grok|gemini|codex|claude|github|gh)\s+(.+)$/
  );
  if (directed) {
    const agent = asAgent(directed[2]) ?? 'gemini';
    const restOriginal = original
      .replace(/^(perguntar ao|perguntar|pergunta|falar com|falar|fala)\s+(grok|gemini|codex|claude|github|gh)\s+/i, '')
      .trim();
    return { kind: 'chat', agent, text: restOriginal || directed[3] };
  }

  return { kind: 'chat', agent: 'gemini', text: original };
}
