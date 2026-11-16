import React, { useEffect, useState } from 'react';
import { useApp } from '../lib/state';
import { clsx } from 'clsx';

interface StatTileProps {
  label: string;
  targetValue: number;
  subtext: string;
  icon?: React.ReactNode;
  staggerIndex?: number;
  variant?: 'default' | 'high' | 'teal' | 'saffron' | 'purple';
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
    const duration = 650;

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

  const variantGradients = {
    default: "from-white/15 to-white/5 border-white/20 hover:border-white/40",
    teal: "from-[#12D8C4]/20 via-[#12D8C4]/10 to-transparent border-[#12D8C4]/40 hover:border-[#12D8C4] hover:shadow-[0_0_25px_rgba(18,216,196,0.35)]",
    high: "from-[#FF3D8B]/25 via-[#FF3D8B]/10 to-transparent border-[#FF3D8B]/40 hover:border-[#FF3D8B] hover:shadow-[0_0_25px_rgba(255,61,139,0.35)]",
    saffron: "from-[#FF9F2E]/25 via-[#FF9F2E]/10 to-transparent border-[#FF9F2E]/40 hover:border-[#FF9F2E] hover:shadow-[0_0_25px_rgba(255,159,46,0.35)]",
    purple: "from-[#8E6BFF]/25 via-[#8E6BFF]/10 to-transparent border-[#8E6BFF]/40 hover:border-[#8E6BFF] hover:shadow-[0_0_25px_rgba(142,107,255,0.35)]",
  };

  const textGradients = {
    default: "text-white",
    teal: "text-[#12D8C4] drop-shadow-[0_0_12px_rgba(18,216,196,0.5)]",
    high: "text-[#FF5C7C] drop-shadow-[0_0_12px_rgba(255,61,100,0.5)]",
    saffron: "text-[#FFB259] drop-shadow-[0_0_12px_rgba(255,159,46,0.5)]",
    purple: "text-[#CDB9FF] drop-shadow-[0_0_12px_rgba(142,107,255,0.5)]",
  };

  return (
    <div
      className={clsx(
        "glass-panel glass-card-hover rounded-[18px] p-4 flex flex-col justify-between transition-all select-none bg-gradient-to-br cursor-pointer",
        variantGradients[variant]
      )}
    >
      <div className="flex items-center justify-between text-[#A9B9E0] mb-2">
        <span className="text-xs font-semibold tracking-wide uppercase font-mono">{label}</span>
        {icon && <span className="opacity-80 transition-transform group-hover:scale-110">{icon}</span>}
      </div>

      <div className="flex items-baseline gap-2 my-1">
        <span className={clsx("font-mono text-3xl font-bold tracking-tight tabular-nums", textGradients[variant])}>
          {count.toLocaleString()}
        </span>
      </div>

      <p className="text-[11px] text-[#A9B9E0] font-sans truncate mt-1">{subtext}</p>
    </div>
  );
};
