import React from 'react';

export default function FeatureBreakdown({ features, explanation }) {
  if (!features || Object.keys(features).length === 0) {
    return <p className="text-sm text-slate-500 italic">No feature parameters available.</p>;
  }

  const entries = Object.entries(features);

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50 text-slate-600 font-semibold text-xs uppercase tracking-wider">
          <tr>
            <th className="px-4 py-2.5 text-left">Feature Name</th>
            <th className="px-4 py-2.5 text-left">Observed Value</th>
            <th className="px-4 py-2.5 text-left">Model Weight / Signal</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {entries.map(([key, val]) => {
            const importance = explanation && explanation[key] ? explanation[key] : null;
            return (
              <tr key={key} className="hover:bg-slate-50">
                <td className="px-4 py-2 font-mono text-xs text-slate-700">{key}</td>
                <td className="px-4 py-2 text-slate-900 font-medium">{String(val)}</td>
                <td className="px-4 py-2 text-slate-500">
                  {importance !== null ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="w-16 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                        <span
                          className="bg-blue-600 h-1.5 block"
                          style={{ width: `${Math.min(importance * 300, 100)}%` }}
                        />
                      </span>
                      <span className="text-xs">{importance}</span>
                    </span>
                  ) : (
                    'Evaluated'
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
