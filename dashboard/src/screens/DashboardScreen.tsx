import React from 'react';
import { useApp } from '../lib/state';
import { translations } from '../lib/translations';
import { StatTile } from '../components/StatTile';
import { DataTable } from '../components/DataTable';
import { mock14DayTrend, mockNearestSla } from '../mock/stats';
import { SlaTimer } from '../components/SlaTimer';
import { Button } from '../components/Button';
import { ShieldAlert, Send, CheckCircle2, Search, ArrowRight, Activity, Sparkles, TrendingUp } from 'lucide-react';

export const DashboardScreen: React.FC = () => {
  const { language, accounts, setCurrentScreen, setSelectedAccountId } = useApp();
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
    <div className="space-y-6 select-none">
      {/* Screen Title & Subtitle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight font-sans">
              {t.dashboard.title}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#12D8C4]/20 border border-[#12D8C4]/40 text-[#12D8C4] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#12D8C4] animate-ping" />
              OPERATIONAL
            </span>
          </div>
          <p className="text-xs text-[#A9B9E0] mt-0.5 font-mono">
            {t.dashboard.subtitle}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setCurrentScreen('assessment')}
            icon={<Sparkles className="w-3.5 h-3.5 text-[#12D8C4]" />}
          >
            Live Assessment Dossier
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setCurrentScreen('scan')}
            icon={<Search className="w-3.5 h-3.5 text-[#032622]" />}
          >
            {t.scan.title}
          </Button>
        </div>
      </div>

      {/* Four Stat Tiles with Glossy Aesthetics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile
          label={t.dashboard.statScannedToday}
          targetValue={142}
          subtext="+18% from 7-day baseline"
          icon={<Search className="w-4 h-4 text-[#12D8C4]" />}
          staggerIndex={0}
          variant="teal"
        />
        <StatTile
          label={t.dashboard.statHighRisk}
          targetValue={38}
          subtext="Score ≥ 0.80 threshold"
          icon={<ShieldAlert className="w-4 h-4 text-[#FF3D8B]" />}
          staggerIndex={1}
          variant="high"
        />
        <StatTile
          label={t.dashboard.statReported}
          targetValue={29}
          subtext="Section 79(3)(b) active"
          icon={<Send className="w-4 h-4 text-[#FF9F2E]" />}
          staggerIndex={2}
          variant="saffron"
        />
        <StatTile
          label={t.dashboard.statRemoved}
          targetValue={24}
          subtext="96.2% compliance rate"
          icon={<CheckCircle2 className="w-4 h-4 text-[#8E6BFF]" />}
          staggerIndex={3}
          variant="purple"
        />
      </div>

      {/* Middle Grid: 14-Day Trend Chart + SLA Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* 14-Day Trend Chart */}
        <div className="lg:col-span-2 glass-panel glass-card-hover rounded-[20px] p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#12D8C4]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-white font-mono">
                  {t.dashboard.trendTitle}
                </h3>
              </div>
              <p className="text-[11px] text-[#A9B9E0] mt-0.5 font-sans">
                Flagged automated accounts vs nodal removals over 14 days
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono">
              <span className="flex items-center gap-1.5 text-white">
                <span className="w-2.5 h-2.5 rounded-full bg-[#FF3D8B] shadow-[0_0_8px_#FF3D8B]" /> Flags
              </span>
              <span className="flex items-center gap-1.5 text-white">
                <span className="w-2.5 h-2.5 rounded-full bg-[#12D8C4] shadow-[0_0_8px_#12D8C4]" /> Removals
              </span>
            </div>
          </div>

          {/* Glowing SVG Curve */}
          <div className="w-full overflow-x-auto py-2">
            <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-40 overflow-visible">
              <defs>
                <linearGradient id="gradFlags" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FF3D8B" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#FF3D8B" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="gradRemovals" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#12D8C4" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#12D8C4" stopOpacity="0.0" />
                </linearGradient>
                <filter id="neonGlowFlags" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <filter id="neonGlowRemovals" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Grid Lines */}
              <line x1={padX} y1={padY} x2={chartW - padX} y2={padY} stroke="rgba(255,255,255,0.08)" strokeDasharray="3 3" />
              <line x1={padX} y1={chartH / 2} x2={chartW - padX} y2={chartH / 2} stroke="rgba(255,255,255,0.08)" strokeDasharray="3 3" />
              <line x1={padX} y1={chartH - padY} x2={chartW - padX} y2={chartH - padY} stroke="rgba(255,255,255,0.15)" />

              {/* Flags Area Fill */}
              <polygon
                points={`${padX},${chartH - padY} ${pointsFlags} ${chartW - padX},${chartH - padY}`}
                fill="url(#gradFlags)"
              />
              {/* Removals Area Fill */}
              <polygon
                points={`${padX},${chartH - padY} ${pointsRemovals} ${chartW - padX},${chartH - padY}`}
                fill="url(#gradRemovals)"
              />

              {/* Polyline strokes with glowing filter */}
              <polyline
                points={pointsFlags}
                fill="none"
                stroke="#FF3D8B"
                strokeWidth="2.5"
                filter="url(#neonGlowFlags)"
              />
              <polyline
                points={pointsRemovals}
                fill="none"
                stroke="#12D8C4"
                strokeWidth="2.5"
                filter="url(#neonGlowRemovals)"
              />

              {/* Points */}
              {mock14DayTrend.map((d, i) => {
                const x = padX + (i / (mock14DayTrend.length - 1)) * (chartW - 2 * padX);
                const yF = chartH - padY - (d.flags / maxVal) * (chartH - 2 * padY);
                const yR = chartH - padY - (d.removals / maxVal) * (chartH - 2 * padY);
                return (
                  <g key={i}>
                    <circle cx={x} cy={yF} r="3" fill="#fff" stroke="#FF3D8B" strokeWidth="2" />
                    <circle cx={x} cy={yR} r="3" fill="#fff" stroke="#12D8C4" strokeWidth="2" />
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="flex items-center justify-between text-[11px] text-[#A9B9E0] font-mono mt-2 pt-2 border-t border-white/10">
            <span>14 days ago</span>
            <span>7 days ago</span>
            <span>Today (Triage Active)</span>
          </div>
        </div>

        {/* SLA Telemetry Card */}
        <div className="glass-panel glass-card-hover rounded-[20px] p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-white font-mono">
                {t.dashboard.slaTitle}
              </span>
              <Activity className="w-4 h-4 text-[#FF9F2E] animate-pulse" />
            </div>
            <p className="text-xs text-[#A9B9E0]">
              Statutory 36-hour takedown window under IT Rules 2021 Rule 3(1)(d).
            </p>

            <div className="my-6 p-4 rounded-[16px] bg-gradient-to-br from-white/10 to-white/5 border border-white/15">
              <span className="text-[11px] text-[#A9B9E0] uppercase font-mono block mb-1">
                Nearest Actionable Deadline
              </span>
              <div className="text-3xl font-mono font-bold text-[#FFB259] drop-shadow-[0_0_12px_rgba(255,159,46,0.6)]">
                <SlaTimer initialMinutes={mockNearestSla[0]?.remainingMinutes || 145} />
              </div>
              <div className="text-xs text-white mt-2 font-mono flex items-center justify-between">
                <span>Target: {mockNearestSla[0]?.handle || "@itbp_recruit_2024"}</span>
                <span className="text-[#FF5C7C] font-bold">HIGH RISK</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs text-[#A9B9E0] font-mono">
              <span>Section 79(3)(b) Compliance:</span>
              <span className="text-[#12D8C4] font-bold">98.4%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#12D8C4] to-[#3DDC97] w-[98.4%] shadow-[0_0_10px_#12D8C4]" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Flagged Accounts Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white tracking-tight">
            Flagged Target Pipeline ({flaggedAccounts.length})
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentScreen('flagged_queue')}
            icon={<ArrowRight className="w-3.5 h-3.5" />}
          >
            View Full Queue
          </Button>
        </div>

        <DataTable
          accounts={flaggedAccounts.slice(0, 5)}
          onSelectAccount={(acc) => {
            setSelectedAccountId(acc.id);
            setCurrentScreen('assessment');
          }}
        />
      </div>
    </div>
  );
};
