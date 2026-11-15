import React, { useEffect, useState } from 'react';
import { ShieldCheck, AlertOctagon, RefreshCw, Key } from 'lucide-react';
import api from '../utils/api';
import Header from '../components/Header';

export default function AuditLogPage() {
  const [logs, setLogs] = useState([]);
  const [chainStatus, setChainStatus] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/audit/log?limit=50');
      setLogs(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyChain = async () => {
    setVerifying(true);
    try {
      const res = await api.get('/audit/verify');
      setChainStatus(res.data);
    } catch (err) {
      alert('Integrity verification check failed.');
    } finally {
      setVerifying(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    handleVerifyChain();
  }, []);

  return (
    <div className="flex-1 flex flex-col overflow-y-auto">
      <Header
        title="Tamper-Evident Audit Trail"
        subtitle="Cryptographic SHA-256 Hash Chained Evidence Ledger"
      />

      <main className="p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* Verification Status Card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {chainStatus?.is_valid ? (
              <div className="p-3 bg-emerald-100 text-emerald-800 rounded-xl">
                <ShieldCheck className="w-6 h-6" />
              </div>
            ) : (
              <div className="p-3 bg-red-100 text-red-800 rounded-xl">
                <AlertOctagon className="w-6 h-6" />
              </div>
            )}
            <div>
              <h4 className="font-bold text-slate-900 text-sm">
                Chain Integrity Status:{' '}
                {chainStatus?.is_valid ? (
                  <span className="text-emerald-700">100% Cryptographically Verified</span>
                ) : (
                  <span className="text-red-700">Integrity Violation / Not Checked</span>
                )}
              </h4>
              <p className="text-xs text-slate-500">
                Every scan, status transition, and evidence accession is irreversibly hashed.
              </p>
            </div>
          </div>

          <button
            onClick={handleVerifyChain}
            disabled={verifying}
            className="flex items-center gap-2 px-4 py-2 bg-[#0B2545] hover:bg-[#134074] text-white text-xs font-semibold rounded-lg shadow-sm transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${verifying ? 'animate-spin' : ''}`} />
            {verifying ? 'Verifying Hashes...' : 'Re-verify Entire Chain'}
          </button>
        </div>

        {/* Audit Log Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-left">Timestamp (UTC)</th>
                  <th className="px-4 py-3 text-left">Action</th>
                  <th className="px-4 py-3 text-left">Actor ID</th>
                  <th className="px-4 py-3 text-left">Details</th>
                  <th className="px-4 py-3 text-left font-mono">This Entry SHA-256</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 font-mono text-[11px]">
                    <td className="px-4 py-2.5 text-slate-500 whitespace-nowrap">
                      {new Date(log.created_at).toISOString()}
                    </td>
                    <td className="px-4 py-2.5 font-bold text-slate-800 whitespace-nowrap">
                      {log.action}
                    </td>
                    <td className="px-4 py-2.5 text-slate-500">
                      {log.actor_id ? log.actor_id.substring(0, 8) + '...' : 'SYSTEM'}
                    </td>
                    <td className="px-4 py-2.5 text-slate-600 max-w-xs truncate">
                      {JSON.stringify(log.details)}
                    </td>
                    <td className="px-4 py-2.5 text-blue-700 font-semibold truncate max-w-[140px]">
                      {log.this_hash?.substring(0, 16)}...
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
