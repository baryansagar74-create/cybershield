import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, KeyRound, Mail, AlertCircle } from 'lucide-react';
import { useAuth } from '../utils/auth';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [needs2FA, setNeeds2FA] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const result = await login(email, password, needs2FA ? totpCode : null);
      if (result.success) {
        navigate('/');
      } else if (result.requires2FA) {
        setNeeds2FA(true);
      } else {
        setErrorMsg(result.message || 'Authentication failed');
      }
    } catch (err) {
      setErrorMsg('Network error. Check if ProfileGuard API is running on localhost:8000.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-700">
        <div className="bg-[#0B2545] p-8 text-center text-white">
          <div className="w-14 h-14 bg-red-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-extrabold tracking-wide">ProfileGuard</h2>
          <p className="text-xs text-slate-300 mt-1 uppercase tracking-widest font-semibold">
            ITBP / MHA Fake Account Detection Cell
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Official Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="analyst@itbp.gov.in"
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0B2545]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0B2545]"
              />
            </div>
          </div>

          {needs2FA && (
            <div>
              <label className="block text-xs font-bold text-red-700 uppercase tracking-wider mb-1.5">
                Two-Factor Security Code (TOTP)
              </label>
              <input
                type="text"
                required
                maxLength={6}
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value)}
                placeholder="123456"
                className="w-full px-3 py-2 border-2 border-red-400 rounded-lg text-sm text-center font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-red-600"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-[#0B2545] hover:bg-[#134074] text-white rounded-lg font-semibold text-sm shadow transition disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : needs2FA ? 'Verify 2FA & Access' : 'Sign In to Console'}
          </button>

          <p className="text-[11px] text-center text-slate-400">
            Authorized Personnel Only. All access is logged to the immutable audit chain.
          </p>
        </form>
      </div>
    </div>
  );
}
