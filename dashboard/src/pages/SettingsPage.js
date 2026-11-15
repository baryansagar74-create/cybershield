import React, { useState } from 'react';
import { Shield, Key, Database, Sliders, CheckCircle2 } from 'lucide-react';
import Header from '../components/Header';
import { useAuth } from '../utils/auth';
import api from '../utils/api';

export default function SettingsPage() {
  const { user } = useAuth();
  const [totpSetup, setTotpSetup] = useState(null);
  const [totpCode, setTotpCode] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleStart2FA = async () => {
    try {
      const res = await api.post('/auth/2fa/setup');
      setTotpSetup(res.data);
    } catch (err) {
      alert('Failed to initiate 2FA setup.');
    }
  };

  const handleVerify2FA = async (e) => {
    e.preventDefault();
    try {
      await api.post('/auth/2fa/verify', { code: totpCode });
      setSuccessMsg('2FA has been successfully activated on your account.');
      setTotpSetup(null);
    } catch (err) {
      alert(err.response?.data?.detail || 'Invalid verification code.');
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto">
      <Header
        title="Settings & System Configuration"
        subtitle="Analyst Credentials, Model Parameters and Security Controls"
      />

      <main className="p-8 space-y-6 max-w-4xl mx-auto w-full">
        {/* Security / 2FA */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
            <Key className="w-5 h-5 text-blue-700" />
            <h3 className="font-bold text-slate-800 text-sm">Two-Factor Authentication (TOTP)</h3>
          </div>

          <p className="text-xs text-slate-500">
            Enforce time-based OTP codes (Google Authenticator / Aegis) to protect takedown workflows.
          </p>

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{successMsg}</span>
            </div>
          )}

          {!totpSetup ? (
            <button
              onClick={handleStart2FA}
              className="px-4 py-2 bg-[#0B2545] hover:bg-[#134074] text-white text-xs font-semibold rounded-lg shadow-sm"
            >
              Configure / Reconfigure 2FA
            </button>
          ) : (
            <form onSubmit={handleVerify2FA} className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <p className="text-xs font-mono text-slate-800 font-bold">
                TOTP Secret: <span className="bg-slate-200 px-2 py-0.5 rounded">{totpSetup.secret}</span>
              </p>
              <p className="text-xs text-slate-500">
                Or scan into authenticator: <span className="font-mono">{totpSetup.provisioning_uri}</span>
              </p>

              <div className="flex gap-2 max-w-xs">
                <input
                  type="text"
                  required
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value)}
                  className="border border-slate-300 rounded-lg px-3 py-1.5 text-xs flex-1 text-center font-mono"
                />
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-1.5 rounded-lg"
                >
                  Verify
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Static Risk Threshold Display */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
            <Sliders className="w-5 h-5 text-blue-700" />
            <h3 className="font-bold text-slate-800 text-sm">Classification Decision Bands</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="font-bold text-red-700">HIGH RISK THRESHOLD</span>
              <p className="text-xl font-black text-slate-800 mt-1">&gt;= 0.80 (80%)</p>
              <p className="text-slate-500 mt-1">Escalates directly to Central Nodal Cell upon analyst confirmation.</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="font-bold text-amber-700">MEDIUM RISK THRESHOLD</span>
              <p className="text-xl font-black text-slate-800 mt-1">0.50 – 0.79</p>
              <p className="text-slate-500 mt-1">Triggers mandatory manual review before any action.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
