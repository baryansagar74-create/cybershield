import React from 'react';
import { useApp } from '../lib/state';
import { translations } from '../lib/translations';
import { StatTile } from '../components/StatTile';
import { DataTable } from '../components/DataTable';
import { mock14DayTrend, mockNearestSla } from '../mock/stats';
import { SlaTimer } from '../components/SlaTimer';
import { Button } from '../components/Button';
import { ShieldAlert, Send, CheckCircle2, Search, ArrowRight } from 'lucide-react';

export const DashboardScreen: React.FC = () => {
  const { language, accounts, setCurrentScreen } = useApp();
  const t = translations[language];

  // Accounts requiring action (flagged)
  const flaggedAccounts = accounts.filter((a) => a.status === 'flagged');

  // Chart SVG calculation (14-day trend: flags vs removals)
  const maxVal = 45;
  const chartW = 560;
  const chartH = 150;
  const padX = 30;
  const padY = 20;

  const pointsFlags = mock14DayTrend.map((d, i) => {
    const x = padX + (i / (mock14DayTrend.length - 1)) * (chartW - 2 * padX);
    const y = chartH - padY - (d.flags / maxVal) * (chartH - 2 * padY);
    return `${x},${y}`;
  }).join(' ');

  const pointsRemovals = mock14DayTrend.map((d, i) => {
    const x = padX + (i / (mock14DayTrend.length - 1)) * (chartW - 2 * padX);
    const y = chartH - padY - (d.removals / maxVal) * (chartH - 2 * padY);
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="space-y-6">
      {/* Screen Title & Subtitle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-line">
        <div>
          <h1 className="text-xl font-semibold text-txt tracking-tight">
            {t.dashboard.title}
          </h1>
          <p className="text-xs text-txt-muted mt-0.5">
            {t.dashboard.subtitle}
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setCurrentScreen('scan')}
          icon={<Search className="w-3.5 h-3.5" />}
        >
          {t.scan.title}
        </Button>
      </div>

      {/* Four Stat Tiles with 80ms Staggered Count-Up */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile
          label={t.dashboard.statScannedToday}
          targetValue={142}
          subtext="+18% from 7-day baseline"
          icon={<Search className="w-4 h-4 text-teal" />}
          staggerIndex={0}
        />
        <StatTile
          label={t.dashboard.statHighRisk}
          targetValue={38}
          subtext="Score ≥ 0.80 threshold"
          icon={<ShieldAlert className="w-4 h-4 text-risk-high" />}
          staggerIndex={1}
          variant="high"
        />
        <StatTile
          label={t.dashboard.statReported}
          targetValue={29}
          subtext="Section 79(3)(b) active"
          icon={<Send className="w-4 h-4 text-saffron" />}
          staggerIndex={2}
        />
        <StatTile
          label={t.dashboard.statRemoved}
          targetValue={24}
          subtext="96.2% compliance rate"
          icon={<CheckCircle2 className="w-4 h-4 text-teal" />}
          staggerIndex={3}
          variant="teal"
        />
      </div>

      {/* Middle Grid: 14-Day Trend Chart + SLA Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 14-Day Trend Chart */}
        <div className="lg:col-span-2 bg-raised border border-line rounded-panel p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-txt font-mono">
                {t.dashboard.trendTitle}
              </h3>
              <p className="text-[11px] text-txt-muted mt-0.5">
                Daily flagged impersonation volume vs platform takedown confirmations
              </p>
            </div>
            <div className="flex items-center gap-4 text-2xs font-mono">
              <span className="flex items-center gap-1.5 text-txt">
                <span className="w-2.5 h-2.5 rounded-full bg-saffron" /> Flags
              </span>
              <span className="flex items-center gap-1.5 text-txt">
                <span className="w-2.5 h-2.5 rounded-full bg-teal" /> Removals
              </span>
            </div>
          </div>

          <div className="relative w-full overflow-hidden">
            <svg
              viewBox={`0 0 ${chartW} ${chartH}`}
              className="w-full h-40 overflow-visible"
              aria-label="14-day trend graph of flags and removals"
            >
              {/* Horizontal grid lines */}
              <line x1={padX} y1={padY} x2={chartW - padX} y2={padY} stroke="var(--line)" strokeDasharray="3 3" />
              <line x1={padX} y1={chartH / 2} x2={chartW - padX} y2={chartH / 2} stroke="var(--line)" strokeDasharray="3 3" />
              <line x1={padX} y1={chartH - padY} x2={chartW - padX} y2={chartH - padY} stroke="var(--line)" />

              {/* Flags Polyline */}
              <polyline
                fill="none"
                stroke="var(--brand-saffron)"
                strokeWidth="2.5"
                points={pointsFlags}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-all duration-600 ease-out"
              />

              {/* Removals Polyline */}
              <polyline
                fill="none"
                stroke="var(--brand-teal)"
                strokeWidth="2.5"
                points={pointsRemovals}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-all duration-600 ease-out"
              />

              {/* X-axis date labels */}
              {mock14DayTrend.filter((_, i) => i % 3 === 0).map((d, i) => {
                const x = padX + ((i * 3) / (mock14DayTrend.length - 1)) * (chartW - 2 * padX);
                return (
                  <text
                    key={d.day}
                    x={x}
                    y={chartH - 4}
                    fill="var(--text-muted)"
                    fontSize="9"
                    fontFamily="IBM Plex Mono"
                    textAnchor="middle"
                  >
                    {d.day}
                  </text>
                );
              })}
            </svg>
          </div>
        </div>

        {/* SLA Telemetry Panel */}
        <div className="bg-raised border border-line rounded-panel p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-line mb-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-txt font-mono">
                {t.dashboard.slaTitle}
              </h3>
              <span className="font-mono text-2xs text-saffron">IT Rules 2026</span>
            </div>

            <div className="space-y-3">
              {mockNearestSla.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-input bg-sunken/60 border border-line flex flex-col gap-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-semibold text-txt">
                      {item.handle}
                    </span>
                    <SlaTimer initialMinutes={item.remainingMinutes} />
                  </div>
                  <span className="text-[11px] text-txt-muted">
                    {item.type} • <span className="font-mono font-medium text-txt">{item.platform}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="w-full mt-4 text-xs font-medium justify-between text-txt-muted hover:text-txt"
            onClick={() => setCurrentScreen('cases')}
          >
            <span>View all active statutory cases</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Flagged Accounts Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-txt">
              {t.dashboard.flaggedTableTitle}
            </h3>
            <p className="text-xs text-txt-muted">
              Use J/K keys to navigate rows, Enter to open dossier.
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setCurrentScreen('flagged_queue')}
          >
            {t.dashboard.viewAll} ({flaggedAccounts.length})
          </Button>
        </div>

        <DataTable accounts={flaggedAccounts.slice(0, 7)} />
      </div>
    </div>
  );
};
