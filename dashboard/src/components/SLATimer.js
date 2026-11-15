import React from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

export default function SLATimer({ hoursRemaining, isBreached }) {
  if (isBreached) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold bg-red-600 text-white animate-pulse">
        <AlertTriangle className="w-3.5 h-3.5" />
        SLA BREACHED ({Math.abs(hoursRemaining || 0)}h ago)
      </span>
    );
  }

  const hours = Number(hoursRemaining || 0);
  const isUrgent = hours <= 1.0;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium border ${
        isUrgent
          ? 'bg-amber-100 text-amber-900 border-amber-300 font-bold animate-pulse'
          : 'bg-slate-100 text-slate-800 border-slate-300'
      }`}
    >
      <Clock className="w-3.5 h-3.5" />
      {hours > 0 ? `${hours.toFixed(1)}h remaining` : 'Due now'}
    </span>
  );
}
