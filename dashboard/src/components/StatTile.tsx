import React, { useEffect, useState } from 'react';
import { useApp } from '../lib/state';
import { clsx } from 'clsx';

interface StatTileProps {
  label: string;
  targetValue: number;
  subtext: string;
  icon?: React.ReactNode;
  staggerIndex?: number;
  variant?: 'default' | 'high' | 'teal';
}

export const StatTile: React.FC<StatTileProps> = ({
  label,
  targetValue,
  subtext,
  icon,
  staggerIndex = 0,
  variant = 'default',
}) => {
  const { reducedMotion } = useApp();
  const [count, setCount] = useState<number>(reducedMotion ? targetValue : 0);

  useEffect(() => {
    if (reducedMotion) {
      setCount(targetValue);
      return;
    }

    const delay = staggerIndex * 80;
    const duration = 600;

    const timer = setTimeout(() => {
      let startTimestamp: number | null = null;
      const step = (timestamp: number) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min(1, (timestamp - startTimestamp) / duration);
        setCount(Math.floor(progress * targetValue));
        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          setCount(targetValue);
        }
      };
      requestAnimationFrame(step);
    }, delay);

    return () => clearTimeout(timer);
  }, [targetValue, staggerIndex, reducedMotion]);

  const borderStyles = {
    default: "border-line",
    high: "border-risk-high/30",
    teal: "border-teal/30",
  };

  return (
    <div
      className={clsx(
        "stat-tile bg-raised border rounded-panel p-4 flex flex-col justify-between transition-colors select-none",
        borderStyles[variant]
      )}
    >
      <div className="flex items-center justify-between text-txt-muted mb-2">
        <span className="text-xs font-medium text-txt-muted">{label}</span>
        {icon && <span className="opacity-70">{icon}</span>}
      </div>

      <div className="flex items-baseline gap-2 my-1">
        <span className="font-mono text-2xl font-semibold tabular-nums text-txt">
          {count.toLocaleString()}
        </span>
      </div>

      <p className="text-2xs text-txt-muted truncate">{subtext}</p>
    </div>
  );
};
