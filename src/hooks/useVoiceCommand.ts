import { useCallback, useEffect, useRef, useState } from 'react';

interface SpeechResultLike {
  isFinal: boolean;
  0: { transcript: string };
}

interface SpeechEventLike {
  resultIndex: number;
  results: ArrayLike<SpeechResultLike>;
}

interface SpeechErrorLike {
  error: string;
}

interface SpeechRec {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechEventLike) => void) | null;
  onerror: ((event: SpeechErrorLike) => void) | null;
  onend: (() => void) | null;
}

type SpeechCtor = new () => SpeechRec;

function getSpeechCtor(): SpeechCtor | null {
  if (typeof window === 'undefined') return null;
  const host = window as Window & {
    SpeechRecognition?: SpeechCtor;
    webkitSpeechRecognition?: SpeechCtor;
  };
  return host.SpeechRecognition || host.webkitSpeechRecognition || null;
}

function describeSpeechError(code: string): string {
  if (code === 'not-allowed' || code === 'service-not-allowed') {
    return 'Permita o microfone neste navegador para usar o comando de voz.';
  }
  if (code === 'no-speech') return 'Não ouvi nada. Clique no microfone e fale de novo.';
  if (code === 'audio-capture') return 'Nenhum microfone foi encontrado.';
  if (code === 'network') return 'O reconhecimento de voz precisa de rede neste navegador.';
  if (code === 'aborted') return '';
  return 'Não foi possível ouvir o comando de voz.';
}

export function useVoiceCommand() {
  const recRef = useRef<SpeechRec | null>(null);
  const [supported, setSupported] = useState(true);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interim, setInterim] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSupported(Boolean(getSpeechCtor()));
  }, []);

  const stop = useCallback(() => {
    const rec = recRef.current;
    recRef.current = null;
    try {
      rec?.stop();
    } catch {
      // Já encerrado.
    }
    setListening(false);
  }, []);

  const start = useCallback(() => {
    const Ctor = getSpeechCtor();
    if (!Ctor) {
      setSupported(false);
      setError('Este navegador não oferece reconhecimento de voz. Use Chrome ou Edge.');
      return;
    }

    stop();
    setError(null);
    setInterim('');

    const rec = new Ctor();
    rec.lang = 'pt-BR';
    rec.continuous = false;
    rec.interimResults = true;
    rec.onresult = (event) => {
      let finalText = '';
      let interimText = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const piece = event.results[i][0]?.transcript ?? '';
        if (event.results[i].isFinal) finalText += piece;
        else interimText += piece;
      }
      if (interimText) setInterim(interimText.trim());
      const said = finalText.trim();
      if (said) {
        setInterim('');
        setTranscript(said);
      }
    };
    rec.onerror = (event) => {
      if (recRef.current !== rec) return;
      const message = describeSpeechError(event.error);
      if (message) setError(message);
      setListening(false);
    };
    rec.onend = () => {
      if (recRef.current !== rec) return;
      recRef.current = null;
      setListening(false);
    };
    recRef.current = rec;
    setListening(true);
    try {
      rec.start();
    } catch {
      setListening(false);
      setError('Não foi possível iniciar o microfone.');
    }
  }, [stop]);

  const toggle = useCallback(() => {
    if (listening) stop();
    else start();
  }, [listening, start, stop]);

  const clearTranscript = useCallback(() => setTranscript(''), []);
  const clearError = useCallback(() => setError(null), []);

  return {
    supported,
    listening,
    transcript,
    interim,
    error,
    toggle,
    clearTranscript,
    clearError,
  };
}
