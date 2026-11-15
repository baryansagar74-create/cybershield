import React from 'react';

export default function RiskBadge({ band }) {
  const b = (band || 'LOW').toUpperCase();
  if (b === 'HIGH') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-300">
        HIGH RISK
      </span>
    );
  }
  if (b === 'MEDIUM') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
        MEDIUM RISK
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
      LOW RISK
    </span>
  );
}
