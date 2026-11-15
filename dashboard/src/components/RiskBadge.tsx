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
      symbol: "▲", // filled triangle
      bg: "bg-risk-high/10",
      text: "text-risk-high",
      border: "border-risk-high/30",
    },
    MEDIUM: {
      label: "MEDIUM",
      symbol: "◆", // diamond
      bg: "bg-saffron/10",
      text: "text-saffron",
      border: "border-saffron/30",
    },
    LOW: {
      label: "LOW",
      symbol: "●", // circle
      bg: "bg-risk-low/10",
      text: "text-risk-low",
      border: "border-risk-low/30",
    },
  };

  const c = configs[band];

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-chip text-2xs font-mono font-medium border select-none tabular-nums",
        c.bg,
        c.text,
        c.border,
        className
      )}
      role="status"
      aria-label={`Risk band: ${c.label}${score !== undefined ? `, score: ${score.toFixed(2)}` : ''}`}
    >
      <span className="text-[10px] leading-none" aria-hidden="true">{c.symbol}</span>
      <span className="font-sans font-semibold tracking-wide">{c.label}</span>
      {showScore && score !== undefined && (
        <span className="opacity-80">({score.toFixed(2)})</span>
      )}
    </span>
  );
};
