import React, { useState } from 'react';
import { useApp } from '../lib/state';
import { Button } from '../components/Button';
import { Shield, KeyRound, Lock, UserCheck } from 'lucide-react';

export const SignInScreen: React.FC = () => {
  const { login } = useApp();
  const [step, setStep] = useState<1 | 2>(1);
  const [officerId, setOfficerId] = useState<string>("ITBP-NC-104");
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
      login(`Insp. Rajesh Kumar (${officerId})`);
    }, 500);
  };

  return (
    <div className="w-full max-w-md bg-raised border border-line rounded-modal shadow-2xl p-6 md:p-8 select-none">
      {/* Brand Header */}
      <div className="flex flex-col items-center text-center mb-6">
        <div className="w-12 h-12 rounded-panel bg-teal/15 border border-teal/40 flex items-center justify-center text-teal mb-3">
          <Shield className="w-7 h-7 fill-teal/20" />
        </div>
        <h2 className="text-xl font-semibold text-txt">ProfileGuard</h2>
        <p className="text-xs text-txt-muted mt-1">
          ITBP Nodal Cyber Cell • Forensic Authentication Terminal
        </p>
      </div>

      {step === 1 ? (
        <form onSubmit={handleStep1} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-txt mb-1">
              Officer Service Identifier
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={officerId}
                onChange={(e) => setOfficerId(e.target.value)}
                placeholder="e.g. ITBP-NC-104"
                className="w-full bg-sunken border border-line rounded-input px-3 py-2 text-sm text-txt font-mono focus:border-teal focus:outline-none"
              />
              <UserCheck className="w-4 h-4 text-txt-muted absolute right-3 top-2.5" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-txt mb-1">
              Govt Credentials Password
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-sunken border border-line rounded-input px-3 py-2 text-sm text-txt font-mono focus:border-teal focus:outline-none"
              />
              <Lock className="w-4 h-4 text-txt-muted absolute right-3 top-2.5" />
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            isLoading={isLoading}
          >
            Authenticate Officer ID
          </Button>
        </form>
      ) : (
        <form onSubmit={handleStep2} className="space-y-4">
          <div className="p-3 rounded-input bg-teal/10 border border-teal/30 text-xs text-teal">
            <span className="font-semibold">Step 2:</span> Authenticated as {officerId}. Enter the 6-digit TOTP hardware code.
          </div>

          <div>
            <label className="block text-xs font-medium text-txt mb-1">
              6-Digit 2FA Security Token
            </label>
            <div className="relative">
              <input
                type="text"
                maxLength={6}
                required
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value)}
                placeholder="000000"
                className="w-full bg-sunken border border-line rounded-input px-3 py-2 text-center text-lg font-mono tracking-widest text-txt focus:border-teal focus:outline-none"
              />
              <KeyRound className="w-4 h-4 text-txt-muted absolute right-3 top-3" />
            </div>
            <p className="text-[11px] text-txt-muted mt-1 text-center font-mono">
              (Prototype mode: Any 6 digits accepted)
            </p>
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            isLoading={isLoading}
          >
            Verify & Open Workstation
          </Button>

          <Button
            type="button"
            variant="ghost"
            className="w-full text-xs"
            onClick={() => setStep(1)}
          >
            Back to Step 1
          </Button>
        </form>
      )}

      {/* Official Insignia Rule Compliance Note */}
      <div className="mt-6 pt-4 border-t border-line text-center text-[10px] text-txt-muted">
        <p>
          Notice: Original ProfileGuard shield mark is displayed. Official ITBP circular insignia is rendered strictly under ITBP Section 65B statutory evidentiary guidelines.
        </p>
      </div>
    </div>
  );
};
