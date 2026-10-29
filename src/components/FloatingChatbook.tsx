import React, { useRef, useState } from 'react';
import { MessageSquare, Minus, Sparkles } from 'lucide-react';
import { MicButton } from './MicButton';

interface FloatingChatbookProps {
  open: boolean;
  title: string;
  subtitle: string;
  hint?: string | null;
  listening: boolean;
  voiceSupported: boolean;
  onToggleVoice: () => void;
  onToggle: () => void;
  children: React.ReactNode;
}

export function FloatingChatbook({
  open,
  title,
  subtitle,
  hint,
  listening,
  voiceSupported,
  onToggleVoice,
  onToggle,
  children,
}: FloatingChatbookProps) {
  const panelRef = useRef<HTMLElement>(null);
  const dragRef = useRef<{ dx: number; dy: number } | null>(null);
  const [origin, setOrigin] = useState<{ x: number; y: number } | null>(null);

  const onPointerDown = (event: React.PointerEvent<HTMLElement>) => {
    if ((event.target as HTMLElement).closest('button')) return;
    const rect = panelRef.current?.getBoundingClientRect();
    if (!rect) return;
    dragRef.current = { dx: event.clientX - rect.left, dy: event.clientY - rect.top };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLElement>) => {
    if (!dragRef.current) return;
    const width = panelRef.current?.offsetWidth ?? 400;
    const x = Math.min(window.innerWidth - width - 8, Math.max(8, event.clientX - dragRef.current.dx));
    const y = Math.min(window.innerHeight - 72, Math.max(8, event.clientY - dragRef.current.dy));
    setOrigin({ x, y });
  };

  const onPointerUp = () => {
    dragRef.current = null;
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={onToggle}
        className={`fixed bottom-5 right-5 z-50 flex items-center gap-3 rounded-full border border-white/70 bg-white/90 py-2 pl-2 pr-4 text-left shadow-[0_18px_50px_-22px_rgba(184,51,20,0.55)] backdrop-blur-xl transition hover:-translate-y-0.5 ${
          listening ? 'mic-live' : ''
        }`}
      >
        <span className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-[#E11D74] to-[#B83314] text-[#FFF7ED]">
          <MessageSquare className="h-5 w-5" />
        </span>
        <span className="leading-tight">
          <span className="block text-sm font-bold text-[#B83314]">Chatbook</span>
          <span className="block text-[11px] font-medium text-[#78716C]">
            {listening ? 'Ouvindo você…' : 'Flutuante · clique para abrir'}
          </span>
        </span>
      </button>
    );
  }

  return (
    <section
      ref={panelRef}
      aria-label="Chatbook flutuante"
      style={origin ? { left: origin.x, top: origin.y } : undefined}
      className={`fixed z-50 flex w-[min(420px,calc(100vw-1.25rem))] flex-col overflow-hidden rounded-[28px] border border-white/80 bg-[#FFFCF8]/95 shadow-[0_28px_80px_-28px_rgba(68,40,20,0.55)] backdrop-blur-xl animate-pop ${
        origin ? '' : 'bottom-5 right-5'
      } h-[min(700px,calc(100vh-5.5rem))]`}
    >
      <header
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        className="cursor-grab touch-none bg-gradient-to-r from-[#9F2D12] via-[#C2410C] to-[#E11D74] px-4 py-3 text-[#FFF7ED] active:cursor-grabbing"
      >
        <div className="flex items-start gap-3">
          <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-white/15">
            <Sparkles className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold tracking-tight">{title}</p>
            <p className="truncate text-[11px] text-[#FFE7D1]">{subtitle}</p>
          </div>
          <MicButton listening={listening} supported={voiceSupported} onClick={onToggleVoice} className="h-9 w-9" />
          <button
            type="button"
            onClick={onToggle}
            aria-label="Recolher Chatbook"
            className="grid h-9 w-9 place-items-center rounded-full bg-white/15 hover:bg-white/25"
          >
            <Minus className="h-4 w-4" />
          </button>
        </div>
        {hint && <p className="mt-2 line-clamp-2 text-[11px] leading-relaxed text-[#FFE7D1]">{hint}</p>}
      </header>
      <div className="min-h-0 flex-1">{children}</div>
    </section>
  );
}
