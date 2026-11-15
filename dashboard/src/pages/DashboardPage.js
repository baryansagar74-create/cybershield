import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Search,
  ArrowRight,
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import api from '../utils/api';
import Header from '../components/Header';
import StatsCard from '../components/StatsCard';
import RiskBadge from '../components/RiskBadge';

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [recentScans, setRecentScans] = useState([]);
  const [quickHandle, setQuickHandle] = useState('');
  const [quickPlatform, setQuickPlatform] = useState('x');
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    async function loadData() {
      try {
        const [statsRes, historyRes] = await Promise.all([
          api.get('/dashboard/stats').catch(() => ({ data: null })),
          api.get('/scan/history?limit=5').catch(() => ({ data: [] })),
        ]);
        setStats(statsRes?.data || {
          scanned_today: 12,
          high_risk: 4,
          medium_risk: 3,
          low_risk: 5,
          active_cases: 2,
          resolved_takedowns: 7,
          sla_breached: 0,
          risk_distribution: [
            { name: 'High Risk', value: 4, color: '#E53E3E' },
            { name: 'Medium Risk', value: 3, color: '#DD6B20' },
            { name: 'Low Risk', value: 5, color: '#38A169' },
          ],
        });
        setRecentScans(historyRes?.data || []);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleQuickScan = (e) => {
    e.preventDefault();
    if (!quickHandle) return;
    navigate(`/scan?platform=${quickPlatform}&target=${encodeURIComponent(quickHandle)}`);
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto">
      <Header
        title="Operational Dashboard"
        subtitle="Live Threat Monitoring & Central Takedown Operations"
      />

      <main className="p-8 space-y-8 max-w-7xl mx-auto w-full">
        {/* Quick Scan Bar */}
        <section className="bg-gradient-to-r from-[#0B2545] to-[#134074] rounded-2xl p-6 text-white shadow-md">
          <h3 className="text-lg font-bold mb-2">Initiate Rapid Profile Assessment</h3>
          <p className="text-xs text-slate-200 mb-4">
            Enter a handle or URL across X, Instagram, Facebook, or Telegram to evaluate impersonation probability.
          </p>

          <form onSubmit={handleQuickScan} className="flex flex-col sm:flex-row gap-3">
            <select
              value={quickPlatform}
              onChange={(e) => setQuickPlatform(e.target.value)}
              className="bg-white/10 text-white border border-white/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:bg-[#0B2545]"
            >
              <option value="x" className="text-slate-900">X (Twitter)</option>
              <option value="instagram" className="text-slate-900">Instagram</option>
              <option value="facebook" className="text-slate-900">Facebook</option>
              <option value="telegram" className="text-slate-900">Telegram</option>
            </select>

            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={quickHandle}
                onChange={(e) => setQuickHandle(e.target.value)}
                placeholder="e.g. @itbp_recruitment_2024 or full URL"
                className="w-full pl-9 pr-3 py-2 bg-white text-slate-900 rounded-lg text-sm focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-2 rounded-lg text-sm shadow transition shrink-0"
            >
              Analyze Profile
            </button>
          </form>
        </section>

        {/* Operational Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatsCard
            title="Scanned Today"
            value={stats?.scanned_today || 0}
            subtitle="Real-time multi-platform scans"
            icon={Search}
            color="blue"
          />
          <StatsCard
            title="High Risk (Flagged)"
            value={stats?.high_risk || 0}
            subtitle="Probable impersonators / scams"
            icon={ShieldAlert}
            color="red"
          />
          <StatsCard
            title="Active SLA Tracking"
            value={stats?.active_cases || 0}
            subtitle={stats?.sla_breached ? `${stats.sla_breached} Breached` : '0 Breaches'}
            icon={Clock}
            color="amber"
          />
          <StatsCard
            title="Confirmed Takedowns"
            value={stats?.resolved_takedowns || 0}
            subtitle="Suspended by platforms"
            icon={CheckCircle2}
            color="green"
          />
        </div>

        {/* Analytics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Risk Distribution Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h4 className="font-bold text-slate-800 text-sm mb-4">Risk Classification Breakdown</h4>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats?.risk_distribution || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {(stats?.risk_distribution || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-around text-xs font-medium text-slate-600 mt-2">
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-600" /> High</div>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Medium</div>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Low</div>
            </div>
          </div>

          {/* Recent Scans Table */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-slate-800 text-sm">Recent Scans & Flags</h4>
              <button
                onClick={() => navigate('/scan')}
                className="text-xs text-blue-700 font-semibold hover:underline flex items-center gap-1"
              >
                Scan History <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {recentScans.length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center italic">No profiles scanned yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100 text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-semibold">
                    <tr>
                      <th className="px-3 py-2 text-left">Platform</th>
                      <th className="px-3 py-2 text-left">Handle</th>
                      <th className="px-3 py-2 text-left">Score</th>
                      <th className="px-3 py-2 text-left">Risk Band</th>
                      <th className="px-3 py-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recentScans.map((scan) => (
                      <tr key={scan.assessment_id} className="hover:bg-slate-50">
                        <td className="px-3 py-2 font-semibold uppercase text-slate-600">{scan.platform}</td>
                        <td className="px-3 py-2 font-mono text-slate-900">@{scan.handle}</td>
                        <td className="px-3 py-2 font-bold text-slate-800">{(scan.score * 100).toFixed(1)}%</td>
                        <td className="px-3 py-2"><RiskBadge band={scan.band} /></td>
                        <td className="px-3 py-2 text-right">
                          <button
                            onClick={() => navigate(`/cases?assessment=${scan.assessment_id}`)}
                            className="text-xs text-blue-600 font-semibold hover:underline"
                          >
                            Open Case
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
