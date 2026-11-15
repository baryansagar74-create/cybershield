import React from 'react';

export default function RiskGauge({ score }) {
  const percentage = Math.round((score || 0) * 100);
  const color = percentage >= 80 ? '#E53E3E' : percentage >= 50 ? '#DD6B20' : '#38A169';

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="relative w-36 h-36 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="40"
            stroke="#E2E8F0"
            strokeWidth="10"
            fill="transparent"
          />
          <circle
            cx="50"
            cy="50"
            r="40"
            stroke={color}
            strokeWidth="10"
            strokeDasharray={2 * Math.PI * 40}
            strokeDashoffset={2 * Math.PI * 40 * (1 - percentage / 100)}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className="text-3xl font-extrabold text-slate-800">{percentage}%</span>
          <span className="text-xs uppercase tracking-wider text-slate-500 font-medium">Risk Score</span>
        </div>
      </div>
    </div>
  );
}
