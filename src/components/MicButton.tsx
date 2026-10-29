import { Mic } from 'lucide-react';

interface MicButtonProps {
  listening: boolean;
  supported: boolean;
  onClick: () => void;
  className?: string;
}

export function MicButton({ listening, supported, onClick, className = '' }: MicButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!supported}
      aria-pressed={listening}
      aria-label={listening ? 'Parar comando de voz' : 'Ativar microfone e comando de voz'}
      title={
        supported
          ? listening
            ? 'Ouvindo… clique para parar'
            : 'Comando de voz'
          : 'Reconhecimento de voz indisponível neste navegador'
      }
      className={`relative grid h-10 w-10 shrink-0 place-items-center rounded-full text-[#FFF7ED] transition disabled:cursor-not-allowed disabled:opacity-40 ${
        listening
          ? 'bg-[#E11D74] mic-live'
          : 'bg-gradient-to-br from-[#E11D74] to-[#B83314] shadow-[0_10px_24px_-14px_rgba(225,29,116,0.9)] hover:brightness-110'
      } ${className}`}
    >
      <Mic className="h-4 w-4" />
      {listening && (
        <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-[#FBBF24]" />
      )}
    </button>
  );
}
