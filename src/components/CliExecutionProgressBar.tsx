import React from 'react';
import { Loader2 } from 'lucide-react';
import { CliProviderId, computeCliExecutionStage } from '../utils/cliEngine';
import { CompanyLogoSvg } from './CompanyLogos';

interface CliExecutionProgressBarProps {
  isExecuting: boolean;
  progressPct: number;
  activeProvider: CliProviderId;
  activeCommand: string;
}

function getTailwindWidthClass(pct: number): string {
  if (pct >= 96) return 'w-full';
  if (pct >= 85) return 'w-11/12';
  if (pct >= 72) return 'w-3/4';
  if (pct >= 58) return 'w-2/3';
  if (pct >= 45) return 'w-1/2';
  if (pct >= 30) return 'w-1/3';
  if (pct >= 18) return 'w-1/4';
  return 'w-1/6';
}

export const CliExecutionProgressBar: React.FC<CliExecutionProgressBarProps> = ({
  isExecuting,
  progressPct,
  activeProvider,
  activeCommand,
}) => {
  if (!isExecuting && progressPct <= 0) {
    return null;
  }

  const { clampedPct, stageLabel } = computeCliExecutionStage(
    progressPct,
    activeProvider,
    activeCommand || 'cli task'
  );

  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="cli-execution-progress"
      className="px-6 py-2.5 bg-[#FFFDF9] border-b border-[#B83314]/35 space-y-1.5"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
        <div className="flex items-center gap-2 min-w-0">
          <Loader2 className="w-3.5 h-3.5 text-[#B83314] animate-spin shrink-0" />
          <CompanyLogoSvg provider={activeProvider} className="w-4 h-4 shrink-0" />
          <span className="font-bold text-[#B83314] truncate">{stageLabel}</span>
        </div>

        <div className="flex items-center gap-2 shrink-0 tabular-nums">
          <span className="text-[#0284C7] font-semibold">
            $ {activeCommand}
          </span>
          <span className="px-2 py-0.5 rounded bg-[#F3EFE6] border border-[#E5E0D8] text-[#B45309] font-bold">
            {clampedPct}%
          </span>
        </div>
      </div>

      {/* Barra de Progresso Visual */}
      <div className="w-full h-2 rounded-full bg-[#F3EFE6] border border-[#E5E0D8] overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r from-[#0284C7] via-[#E11D74] to-[#B83314] transition-all duration-150 ${getTailwindWidthClass(
            clampedPct
          )}`}
        />
      </div>
    </div>
  );
};
