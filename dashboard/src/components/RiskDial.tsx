import React, { useEffect, useState, useRef } from 'react';
import { RiskBand } from '../mock/accounts';
import { useApp } from '../lib/state';

interface RiskDialProps {
  score: number; // 0.00 to 1.00
  band: RiskBand;
  width?: number;
  height?: number;
}

export const RiskDial: React.FC<RiskDialProps> = ({
  score,
  band,
  width = 280,
  height = 180,
}) => {
  const { reducedMotion } = useApp();
  const [currentScore, setCurrentScore] = useState<number>(reducedMotion ? score : 0);
  const [pulse050, setPulse050] = useState<boolean>(false);
  const [pulse080, setPulse080] = useState<boolean>(false);
  const [breatheRing, setBreatheRing] = useState<boolean>(false);
  
  const animRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (reducedMotion) {
      setCurrentScore(score);
      return;
    }

    // Spring-like sweep from 0 to score over 1.1s with slight 3% overshoot
    const duration = 1100;
    const target = score;
    const overshoot = Math.min(1.0, target * 1.03);

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(1, elapsed / duration);

      // Damped spring approximation: f(t) = 1 - e^(-6t) * cos(6t)
      // Ease out with slight overshoot around 70% of duration
      let val = 0;
      if (progress < 0.7) {
        const p = progress / 0.7;
        val = overshoot * (1 - Math.pow(1 - p, 3));
      } else {
        const p = (progress - 0.7) / 0.3;
        val = overshoot - (overshoot - target) * (1 - Math.pow(1 - p, 2));
      }

      // Check threshold crossings for tick pulses (80ms)
      if (val >= 0.50 && currentScore < 0.50) {
        setPulse050(true);
        setTimeout(() => setPulse050(false), 80);
      }
      if (val >= 0.80 && currentScore < 0.80) {
        setPulse080(true);
        setTimeout(() => setPulse080(false), 80);
      }

      setCurrentScore(Math.min(1.0, Math.max(0, val)));

      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        setCurrentScore(target);
        // Thin ring breathes once (opacity 0.4 to 0 over 900ms)
        setBreatheRing(true);
        setTimeout(() => setBreatheRing(false), 950);
      }
    };

    animRef.current = requestAnimationFrame(animate);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [score, reducedMotion]);

  // Semicircle geometry
  // Angles: 0 score = -180 deg (left), 1 score = 0 deg (right)
  const angle = -180 + currentScore * 180;
  const rad = (angle * Math.PI) / 180;

  const cx = 140;
  const cy = 135;
  const r = 95;
  const strokeW = 14;

  // Arc paths
  // Low zone: 0 to 0.50 (-180 to -90 deg)
  // Med zone: 0.50 to 0.80 (-90 to -36 deg)
  // High zone: 0.80 to 1.00 (-36 to 0 deg)
  const isLowActive = band === 'LOW';
  const isMedActive = band === 'MEDIUM';
  const isHighActive = band === 'HIGH';

  const bandColor = band === 'HIGH' ? 'var(--risk-high)' : band === 'MEDIUM' ? 'var(--brand-saffron)' : 'var(--risk-low)';

  // Needle tip
  const needleLength = r - 12;
  const nx = cx + needleLength * Math.cos(rad);
  const ny = cy + needleLength * Math.sin(rad);

  // Tick positions
  const tick50x = cx + r * Math.cos((-90 * Math.PI) / 180);
  const tick50y = cy + r * Math.sin((-90 * Math.PI) / 180);
  const tick80x = cx + r * Math.cos((-36 * Math.PI) / 180);
  const tick80y = cy + r * Math.sin((-36 * Math.PI) / 180);

  return (
    <div className="relative flex flex-col items-center justify-center p-3 select-none">
      <svg
        width={width}
        height={height}
        viewBox="0 0 280 170"
        className="overflow-visible"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="dialGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--risk-low)" />
            <stop offset="50%" stopColor="var(--brand-saffron)" />
            <stop offset="85%" stopColor="var(--risk-high)" />
          </linearGradient>
        </defs>

        {/* Breathing ring after settling */}
        {breatheRing && !reducedMotion && (
          <path
            d={`M ${cx - r - 10} ${cy} A ${r + 10} ${r + 10} 0 0 1 ${cx + r + 10} ${cy}`}
            fill="none"
            stroke={bandColor}
            strokeWidth="2"
            className="animate-out fade-out duration-900"
          />
        )}

        {/* Base Track */}
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke="var(--bg-sunken)"
          strokeWidth={strokeW}
          strokeLinecap="round"
        />

        {/* Zone 1: Low Risk (0 to 0.50) */}
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx} ${cy - r}`}
          fill="none"
          stroke="var(--risk-low)"
          strokeWidth={strokeW}
          opacity={isLowActive ? 1 : 0.35}
          className="transition-opacity duration-300"
        />

        {/* Zone 2: Medium Risk (0.50 to 0.80) */}
        <path
          d={`M ${cx} ${cy - r} A ${r} ${r} 0 0 1 ${tick80x} ${tick80y}`}
          fill="none"
          stroke="var(--brand-saffron)"
          strokeWidth={strokeW}
          opacity={isMedActive ? 1 : 0.35}
          className="transition-opacity duration-300"
        />

        {/* Zone 3: High Risk (0.80 to 1.00) */}
        <path
          d={`M ${tick80x} ${tick80y} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke="var(--risk-high)"
          strokeWidth={strokeW}
          opacity={isHighActive ? 1 : 0.35}
          className="transition-opacity duration-300"
        />

        {/* Threshold Tick Marks */}
        {/* 0.50 Tick */}
        <circle
          cx={tick50x}
          cy={tick50y}
          r={pulse050 ? 5 : 3}
          fill="var(--bg-base)"
          stroke="var(--brand-saffron)"
          strokeWidth="2"
          className="transition-all duration-75"
        />
        {/* 0.80 Tick */}
        <circle
          cx={tick80x}
          cy={tick80y}
          r={pulse080 ? 5 : 3}
          fill="var(--bg-base)"
          stroke="var(--risk-high)"
          strokeWidth="2"
          className="transition-all duration-75"
        />

        {/* Threshold Labels */}
        <text x={cx - r - 4} y={cy + 18} fill="var(--text-muted)" fontSize="10" fontFamily="IBM Plex Mono" textAnchor="middle">0.0</text>
        <text x={cx} y={cy - r - 8} fill="var(--text-muted)" fontSize="10" fontFamily="IBM Plex Mono" textAnchor="middle">0.50</text>
        <text x={tick80x + 12} y={tick80y - 6} fill="var(--text-muted)" fontSize="10" fontFamily="IBM Plex Mono" textAnchor="start">0.80</text>
        <text x={cx + r + 4} y={cy + 18} fill="var(--text-muted)" fontSize="10" fontFamily="IBM Plex Mono" textAnchor="middle">1.0</text>

        {/* Needle */}
        <line
          x1={cx}
          y1={cy}
          x2={nx}
          y2={ny}
          stroke="var(--text)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        {/* Needle Hub */}
        <circle cx={cx} cy={cy} r="6" fill="var(--text)" />
        <circle cx={cx} cy={cy} r="3" fill="var(--bg-base)" />
      </svg>

      {/* Synchronized Score Readout */}
      <div className="text-center mt-[-10px]">
        <div className="font-mono text-3xl font-semibold tabular-nums text-txt">
          {currentScore.toFixed(2)}
        </div>
        <div className="text-2xs uppercase tracking-wider text-txt-muted font-sans font-medium">
          Multi-Signal Risk Score
        </div>
      </div>
    </div>
  );
};
