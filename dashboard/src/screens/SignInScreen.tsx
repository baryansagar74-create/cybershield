import React, { useState } from 'react';
import { useApp } from '../lib/state';
import { Button } from '../components/Button';
import { Shield, KeyRound, Lock, UserCheck, Sparkles } from 'lucide-react';

export const SignInScreen: React.FC = () => {
  const { login } = useApp();
  const [step, setStep] = useState<1 | 2>(1);
  const [officerId, setOfficerId] = useState<string>("Cyber Analyst");
  const [password, setPassword] = useState<string>("••••••••••••");
  const [twoFactorCode, setTwoFactorCode] = useState<string>("729401");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setStep(2);
    }, 400);
  };

  const handleStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      login(officerId || "Cyber Analyst (Active Session)");
    }, 500);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md glass-panel rounded-[24px] shadow-[0_24px_70px_rgba(0,0,0,0.6)] p-6 md:p-8 select-none border border-white/20">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <svg width="48" height="52" viewBox="0 0 40 44" role="img" aria-label="ProfileGuard shield" className="mb-3 drop-shadow-[0_0_16px_rgba(255,77,141,0.6)]">
            <defs>
              <linearGradient id="sh_sign" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FFC15A"></stop><stop offset="1" stopColor="#FF4D8D"></stop></linearGradient>
              <linearGradient id="sh2_sign" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1B2C6B"></stop><stop offset="1" stopColor="#080E30"></stop></linearGradient>
            </defs>
            <path d="M20 2 L37 8 V22 C37 33 29 39 20 42 C11 39 3 33 3 22 V8 Z" fill="url(#sh_sign)"></path>
            <path d="M20 5.5 L34 10.5 V22 C34 31 27.5 36 20 38.8 C12.5 36 6 31 6 22 V10.5 Z" fill="url(#sh2_sign)"></path>
            <circle cx="20" cy="16" r="4.2" fill="#2EE6D0"></circle>
            <path d="M12 28 C12 22 28 22 28 28 Z" fill="#2EE6D0"></path>
          </svg>
          <h2 className="text-2xl font-bold text-white tracking-tight font-sans">ProfileGuard</h2>
          <p className="text-xs text-[#A9B9E0] mt-1 font-mono">
            ITBP Nodal Cyber Cell • Forensic Authentication Terminal
          </p>
        </div>

        {step === 1 ? (
          <form onSubmit={handleStep1} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-white mb-1.5 font-mono">
                Officer Service Identifier
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={officerId}
                  onChange={(e) => setOfficerId(e.target.value)}
                  placeholder="e.g. Cyber Analyst"
                  className="w-full glass-input rounded-[14px] px-3.5 py-2.5 text-sm text-white font-mono focus:border-[#12D8C4] focus:outline-none"
                />
                <UserCheck className="w-4 h-4 text-[#12D8C4] absolute right-3.5 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-white mb-1.5 font-mono">
                Govt Credentials Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full glass-input rounded-[14px] px-3.5 py-2.5 text-sm text-white font-mono focus:border-[#12D8C4] focus:outline-none"
                />
                <Lock className="w-4 h-4 text-[#A9B9E0] absolute right-3.5 top-3" />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full h-11 text-sm mt-2"
              isLoading={isLoading}
            >
              Authenticate Officer ID
            </Button>
          </form>
        ) : (
          <form onSubmit={handleStep2} className="space-y-4">
            <div className="p-3.5 rounded-[14px] bg-[#12D8C4]/15 border border-[#12D8C4]/30 text-xs text-[#12D8C4] font-mono">
              <span className="font-bold text-white">Step 2:</span> Authenticated as {officerId}. Enter the 6-digit TOTP hardware code.
            </div>

            <div>
              <label className="block text-xs font-bold text-white mb-1.5 font-mono">
                6-Digit 2FA Security Token
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value)}
                  placeholder="000000"
                  className="w-full glass-input rounded-[14px] px-3.5 py-2.5 text-center text-lg text-[#12D8C4] font-mono tracking-widest focus:border-[#12D8C4] focus:outline-none"
                />
                <KeyRound className="w-4 h-4 text-[#12D8C4] absolute right-3.5 top-3.5" />
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                type="submit"
                variant="primary"
                className="flex-1 h-11 text-sm"
                isLoading={isLoading}
              >
                Access Workstation
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setStep(1)}
              >
                Back
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
