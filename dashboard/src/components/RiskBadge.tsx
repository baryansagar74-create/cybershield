import React from 'react';
import { RiskBand } from '../mock/accounts';
import { clsx } from 'clsx';

interface RiskBadgeProps {
  band: RiskBand;
  score?: number;
  showScore?: boolean;
  className?: string;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({
  band,
  score,
  showScore = true,
  className,
}) => {
  const configs = {
    HIGH: {
      label: "HIGH",
      symbol: "▲",
      bg: "bg-gradient-to-r from-[#FF5C7C] to-[#B8123A] text-white shadow-[0_0_12px_rgba(255,61,100,0.55),inset_0_1px_0_rgba(255,255,255,0.4)] border-transparent",
    },
    MEDIUM: {
      label: "MEDIUM",
      symbol: "◆",
      bg: "bg-gradient-to-r from-[#FFD479] to-[#F28C28] text-[#3A1D00] shadow-[0_0_12px_rgba(255,159,46,0.5),inset_0_1px_0_rgba(255,255,255,0.4)] border-transparent",
    },
    LOW: {
      label: "LOW",
      symbol: "●",
      bg: "bg-gradient-to-r from-[#6BF0B5] to-[#13A56B] text-[#02261A] shadow-[0_0_12px_rgba(61,220,151,0.5),inset_0_1px_0_rgba(255,255,255,0.4)] border-transparent",
    },
  };

  const c = configs[band];

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold select-none tabular-nums border",
        c.bg,
        className
      )}
      role="status"
      aria-label={`Risk band: ${c.label}${score !== undefined ? `, score: ${score.toFixed(2)}` : ''}`}
    >
      <span className="text-[9px] leading-none" aria-hidden="true">{c.symbol}</span>
      <span className="font-sans font-bold tracking-wider">{c.label}</span>
      {showScore && score !== undefined && (
        <span className="opacity-90 font-mono">({score.toFixed(2)})</span>
      )}
    </span>
  );
};
