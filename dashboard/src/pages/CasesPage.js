import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Filter, Eye, AlertCircle, Clock } from 'lucide-react';
import api from '../utils/api';
import Header from '../components/Header';
import RiskBadge from '../components/RiskBadge';
import SLATimer from '../components/SLATimer';

export default function CasesPage() {
  const [cases, setCases] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchCases() {
      setLoading(true);
      try {
        const url = statusFilter ? `/cases?status=${statusFilter}` : '/cases';
        const res = await api.get(url);
        setCases(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchCases();
  }, [statusFilter]);

  return (
    <div className="flex-1 flex flex-col overflow-y-auto">
      <Header
        title="Takedown Cases & Statutory SLAs"
        subtitle="MHA / I4C Sahyog Channel and Intermediary Grievance Operations"
      />

      <main className="p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* Filter bar */}
        <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-bold text-slate-700 uppercase">Filter Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-slate-300 rounded-lg px-2.5 py-1 text-xs focus:outline-none"
            >
              <option value="">All Active & Closed Cases</option>
              <option value="draft">Draft</option>
              <option value="submitted">Submitted to Nodal Cell</option>
              <option value="platform_review">Platform Under Review</option>
              <option value="resolved">Resolved / Suspended</option>
              <option value="escalated">Escalated (CERT-In / FIR)</option>
            </select>
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Showing <span className="font-bold text-slate-800">{cases.length}</span> cases
          </div>
        </div>

        {/* Case Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {cases.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-sm italic">
              No cases found matching the criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-slate-600 font-semibold text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3 text-left">Case Reference</th>
                    <th className="px-5 py-3 text-left">Platform & Handle</th>
                    <th className="px-5 py-3 text-left">Risk Assessment</th>
                    <th className="px-5 py-3 text-left">Status</th>
                    <th className="px-5 py-3 text-left">SLA Countdown</th>
                    <th className="px-5 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {cases.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50 transition">
                      <td className="px-5 py-3 font-mono font-bold text-xs text-slate-800">
                        {c.notice_ref}
                      </td>
                      <td className="px-5 py-3">
                        <span className="font-bold text-slate-900">@{c.handle}</span>
                        <span className="block text-[11px] text-slate-400 uppercase">{c.platform}</span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <RiskBadge band={c.risk_band} />
                          <span className="text-xs font-semibold text-slate-700">
                            {(c.risk_score * 100).toFixed(0)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold uppercase bg-slate-100 text-slate-700 border border-slate-200">
                          {c.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <SLATimer
                          hoursRemaining={c.sla_hours_remaining}
                          isBreached={c.is_sla_breached}
                        />
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button
                          onClick={() => navigate(`/cases/${c.id}`)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0B2545] hover:bg-[#134074] text-white text-xs font-semibold rounded-lg shadow-sm transition"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View Case
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
