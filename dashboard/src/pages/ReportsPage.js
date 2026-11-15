import React, { useEffect, useState } from 'react';
import { Download, Calendar, BarChart2, ShieldCheck } from 'lucide-react';
import api from '../utils/api';
import Header from '../components/Header';
import StatsCard from '../components/StatsCard';

export default function ReportsPage() {
  const [weekly, setWeekly] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReport() {
      try {
        const res = await api.get('/reports/weekly');
        setWeekly(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchReport();
  }, []);

  return (
    <div className="flex-1 flex flex-col overflow-y-auto">
      <Header
        title="Intelligence & Performance Reports"
        subtitle="Weekly Operational Summaries and High-Level Command Metrics"
      />

      <main className="p-8 space-y-6 max-w-6xl mx-auto w-full">
        {/* Weekly Summary */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Operational Takedown Summary</h3>
              <p className="text-xs text-slate-500">Period: {weekly?.period || 'Last 7 Days'}</p>
            </div>
            <span className="text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 rounded-full">
              Automated MHA Weekly Briefing
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <StatsCard
              title="Profiles Scanned"
              value={weekly?.total_scans || 0}
              subtitle="7-day volume"
            />
            <StatsCard
              title="High Risk Profiles"
              value={weekly?.high_risk_profiles || 0}
              subtitle="Escalated to review"
              color="red"
            />
            <StatsCard
              title="Cases Opened"
              value={weekly?.takedown_cases_opened || 0}
              subtitle="Notices sent"
              color="amber"
            />
            <StatsCard
              title="Action Rate"
              value={`${((weekly?.action_rate || 0) * 100).toFixed(1)}%`}
              subtitle="Platform enforcement"
              color="green"
            />
          </div>
        </div>
      </main>
    </div>
  );
}
