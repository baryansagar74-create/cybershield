import React, { useState } from 'react';
import { useApp } from '../lib/state';
import { Modal } from '../components/Modal';
import { Button } from '../components/Button';
import { 
  ShieldAlert, 
  CheckCircle2, 
  ExternalLink, 
  Search, 
  Sparkles, 
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { clsx } from 'clsx';

export const AssessmentScreen: React.FC = () => {
  const { 
    selectedAccountId, 
    accounts, 
    confirmAsFake, 
    markAsGenuine, 
    runLiveScan,
    setCurrentScreen 
  } = useApp();

  // Find currently selected account or fallback to first
  const account = accounts.find((a) => a.id === selectedAccountId) || accounts[0];

  const [confirmModalOpen, setConfirmModalOpen] = useState<boolean>(false);
  const [confirmReason, setConfirmReason] = useState<string>("Impersonation of uniformed central police force personnel and fraudulent fee solicitation.");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isScanningLive, setIsScanningLive] = useState<boolean>(false);
  const [customHandleInput, setCustomHandleInput] = useState<string>('');

  const handleConfirmAction = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setConfirmModalOpen(false);
      confirmAsFake(account.id, confirmReason);
    }, 400);
  };

  const handleLiveScan = async (handle: string) => {
    setIsScanningLive(true);
    await runLiveScan(handle);
    setIsScanningLive(false);
  };

  // Dial calculations
  const score = account.score;
  const isHigh = account.band === 'HIGH';
  const isMed = account.band === 'MEDIUM';
  const isLow = account.band === 'LOW';

  // Needle angle for SVG
  const needleAngle = -180 + score * 180;
  const rad = (needleAngle * Math.PI) / 180;
  const nx = 100 + 72 * Math.cos(rad);
  const ny = 100 + 72 * Math.sin(rad);

  return (
    <div className="space-y-4 select-none">
      
      {/* 1. TOP HEADER: Target Handle + Mark Genuine & Confirm Fake Buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-[28px] font-bold text-white tracking-tight font-sans">
              @{account.handle}
            </h1>
            <span
              className={clsx(
                "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
                isHigh && "bg-gradient-to-b from-[#FF5C7C] to-[#B8123A] text-white shadow-[0_0_14px_rgba(255,61,100,0.6)]",
                isMed && "bg-gradient-to-b from-[#FFD479] to-[#F28C28] text-[#3A1D00] shadow-[0_0_14px_rgba(255,159,46,0.55)]",
                isLow && "bg-gradient-to-b from-[#6BF0B5] to-[#13A56B] text-[#02261A] shadow-[0_0_14px_rgba(61,220,151,0.5)]"
              )}
            >
              {account.band} ({account.score.toFixed(2)})
            </span>
          </div>
          <div className="text-xs text-[#A9B9E0] mt-1 font-mono flex items-center gap-2">
            <span className="capitalize font-semibold text-white">{account.platform}</span> · 
            created {account.accountAgeDays} days ago · 
            <span className="inline-flex items-center gap-1.5 text-[#12D8C4] font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#12D8C4] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#12D8C4]"></span>
              </span>
              Live Multi-Signal Inference
            </span>
          </div>
        </div>

        {/* Glossy Buttons from Reference Mockup */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => markAsGenuine(account.id)}
            className="glossy-btn px-5 py-2.5 rounded-[14px] text-xs font-medium text-[#EAF1FF] border border-white/30 bg-gradient-to-b from-white/20 to-white/5 shadow-[0_8px_20px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.5)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            Mark as genuine
          </button>

          <button
            onClick={() => setConfirmModalOpen(true)}
            className="glossy-btn px-6 py-2.5 rounded-[14px] text-xs font-bold text-[#3A0618] border-0 bg-gradient-to-r from-[#FF8FB1] via-[#FF3D8B] to-[#FF9F2E] shadow-[0_10px_30px_rgba(255,61,139,0.55),inset_0_1px_0_rgba(255,255,255,0.7)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            Confirm as fake
          </button>
        </div>
      </div>

      {/* 2. REAL SCAN INPUT BAR (Allows user to test ANY handle live) */}
      <div className="glass-panel rounded-[18px] p-3 flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <input
            type="text"
            placeholder="Type any live target to scan (e.g. @elonmusk, @itbp_official, @officer_rajesh_8841)..."
            value={customHandleInput}
            onChange={(e) => setCustomHandleInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && customHandleInput.trim()) {
                handleLiveScan(customHandleInput);
              }
            }}
            className="w-full glass-input rounded-[12px] px-3.5 py-2 text-xs font-mono text-white placeholder-white/40 focus:outline-none"
          />
          <Search className="w-4 h-4 text-white/40 absolute right-3 top-2.5" />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => handleLiveScan(customHandleInput || 'elonmusk')}
            disabled={isScanningLive}
            className="px-4 py-2 rounded-[12px] bg-gradient-to-r from-[#12D8C4] to-[#0FA79B] text-[#032622] font-bold text-xs shadow-glow-teal hover:scale-105 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isScanningLive ? 'Scanning...' : 'Live ML Scan'}</span>
          </button>

          {/* Quick presets */}
          <button
            onClick={() => handleLiveScan('cristiano')}
            className="px-2.5 py-1.5 rounded-[10px] bg-white/10 hover:bg-white/20 text-[11px] font-mono text-[#12D8C4] transition-colors border border-white/15 cursor-pointer"
          >
            @cristiano
          </button>
          <button
            onClick={() => handleLiveScan('nasa')}
            className="px-2.5 py-1.5 rounded-[10px] bg-white/10 hover:bg-white/20 text-[11px] font-mono text-[#34F0DB] transition-colors border border-white/15 cursor-pointer"
          >
            @nasa
          </button>
          <button
            onClick={() => handleLiveScan('itbp_official')}
            className="px-2.5 py-1.5 rounded-[10px] bg-white/10 hover:bg-white/20 text-[11px] font-mono text-[#3DDC97] transition-colors border border-white/15 cursor-pointer"
          >
            @itbp_official
          </button>
          <button
            onClick={() => handleLiveScan('officer_rajesh_8841')}
            className="px-2.5 py-1.5 rounded-[10px] bg-white/10 hover:bg-white/20 text-[11px] font-mono text-[#FF3D8B] transition-colors border border-white/15 cursor-pointer"
          >
            @officer_rajesh (Fake)
          </button>
        </div>
      </div>

      {/* 3. FOUR GLOSSY NEON STAT TILES FROM REFERENCE MOCKUP */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Scanned Today (Cyan) */}
        <div className="p-4 rounded-[18px] bg-gradient-to-br from-[#12D8C4]/40 to-[#12D8C4]/[0.06] border border-[#50FFE6]/50 shadow-[0_14px_40px_rgba(18,216,196,0.25),inset_0_1px_0_rgba(255,255,255,0.5)] backdrop-blur-xl">
          <div className="text-xs font-medium text-[#BFF5EE]">Scanned today</div>
          <div className="text-[34px] font-bold text-white font-mono mt-1 leading-tight">1,284</div>
        </div>

        {/* High Risk (Pink) */}
        <div className="p-4 rounded-[18px] bg-gradient-to-br from-[#FF3D8B]/40 to-[#FF3D8B]/[0.06] border border-[#FF82B4]/50 shadow-[0_14px_40px_rgba(255,61,139,0.25),inset_0_1px_0_rgba(255,255,255,0.5)] backdrop-blur-xl">
          <div className="text-xs font-medium text-[#FFD0E2]">High risk identified</div>
          <div className="text-[34px] font-bold text-white font-mono mt-1 leading-tight">73</div>
        </div>

        {/* Reported (Orange) */}
        <div className="p-4 rounded-[18px] bg-gradient-to-br from-[#FF9F2E]/40 to-[#FF9F2E]/[0.06] border border-[#FFC878]/50 shadow-[0_14px_40px_rgba(255,159,46,0.25),inset_0_1px_0_rgba(255,255,255,0.5)] backdrop-blur-xl">
          <div className="text-xs font-medium text-[#FFE2B8]">Reported to Sahyog</div>
          <div className="text-[34px] font-bold text-white font-mono mt-1 leading-tight">41</div>
        </div>

        {/* Removed (Purple) */}
        <div className="p-4 rounded-[18px] bg-gradient-to-br from-[#7A4DFF]/40 to-[#7A4DFF]/[0.06] border border-[#AA8CFF]/55 shadow-[0_14px_40px_rgba(122,77,255,0.28),inset_0_1px_0_rgba(255,255,255,0.5)] backdrop-blur-xl">
          <div className="text-xs font-medium text-[#DCD0FF]">Confirmed removed</div>
          <div className="text-[34px] font-bold text-white font-mono mt-1 leading-tight">29</div>
        </div>
      </div>

      {/* 4. MAIN DOSSIER & GLOSSY RISK DIAL SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* LEFT CARD (1.25fr): Profile Intelligence & Flagged Accounts Preview */}
        <div className="lg:col-span-7 glass-panel rounded-[22px] p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-3">
              {/* Profile Picture with With/Without DP Badge */}
              <div className="relative">
                {account.hasProfilePic ? (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#12D8C4] to-[#7A4DFF] p-[2px] shadow-[0_0_14px_rgba(18,216,196,0.5)]">
                    {account.profilePicUrl ? (
                      <img src={account.profilePicUrl} alt={account.handle} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <div className="w-full h-full rounded-full bg-[#081230] flex items-center justify-center font-bold text-white text-base font-mono">
                        {account.handle.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-full border-2 border-dashed border-[#FF3D8B] bg-[#FF3D8B]/15 flex items-center justify-center text-[#FF5C7C] font-mono text-[10px] font-bold shadow-[0_0_12px_rgba(255,61,139,0.4)]">
                    NO DP
                  </div>
                )}
                {/* DP Status Indicator Tag */}
                <span
                  className={clsx(
                    "absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full text-[8px] font-mono font-bold border",
                    account.hasProfilePic
                      ? "bg-[#3DDC97] text-[#02261A] border-[#3DDC97]"
                      : "bg-[#FF3D8B] text-white border-[#FF3D8B] animate-pulse"
                  )}
                >
                  {account.hasProfilePic ? "WITH DP" : "NO DP"}
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>{account.name}</span>
                  {account.hasProfilePic && (
                    <span className="text-xs text-[#12D8C4]" title="Profile Picture Present">✓</span>
                  )}
                </h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-mono text-xs text-[#A9B9E0]">@{account.handle}</span>
                  {account.profileType && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white/10 text-[#FF9F2E] border border-white/15">
                      {account.profileType}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-1">
              <span className="font-mono text-xs text-[#12D8C4] font-bold uppercase">{account.platform}</span>
              <span className="text-[10px] font-mono text-[#A9B9E0]">{account.accountAgeDays} days active</span>
            </div>
          </div>

          {/* Followers / Following / Posts Counts Strip */}
          <div className="grid grid-cols-3 gap-3 p-3 rounded-[14px] bg-white/5 border border-white/10 text-center font-mono">
            <div>
              <span className="text-[10px] text-[#A9B9E0] block uppercase">Followers</span>
              <span className="text-base font-bold text-white">{account.followers.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-[10px] text-[#A9B9E0] block uppercase">Following</span>
              <span className="text-base font-bold text-white">{account.following.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-[10px] text-[#A9B9E0] block uppercase">Posts</span>
              <span className="text-base font-bold text-white">{account.posts.toLocaleString()}</span>
            </div>
          </div>

          {/* Captured Bio Text */}
          <div className="space-y-1">
            <span className="text-[11px] font-mono uppercase text-[#A9B9E0] block">
              Captured Profile Bio / Text
            </span>
            <div className="p-3 rounded-[12px] bg-white/5 border border-white/10 text-xs text-white leading-relaxed font-sans">
              {account.bio}
            </div>
          </div>

          {/* Embedded URL / Google Safe Browsing */}
          <div className="space-y-1">
            <span className="text-[11px] font-mono uppercase text-[#A9B9E0] block">
              Google Safe Browsing v4 Threat Status
            </span>
            <div className="flex items-center justify-between p-2.5 rounded-[12px] bg-white/5 border border-white/10 text-xs font-mono">
              <span className="text-white/80 truncate">
                {account.link || "No embedded URL present in biography"}
              </span>
              <span className={clsx("font-bold px-2 py-0.5 rounded-full text-[10px]", account.urlReputation.safe ? "bg-[#3DDC97]/20 text-[#3DDC97]" : "bg-[#FF3D8B]/20 text-[#FF3D8B]")}>
                {account.urlReputation.safe ? "CLEAN" : "MALICIOUS"}
              </span>
            </div>
          </div>

          {/* Gemini AI Threat Summary */}
          <div className="p-3 rounded-[14px] bg-gradient-to-r from-white/10 to-[#7A4DFF]/15 border border-[#7A4DFF]/30 text-xs space-y-1">
            <div className="flex items-center gap-1.5 text-[#12D8C4] font-semibold text-xs">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Gemini 2.5 Flash Forensic Explanation:</span>
            </div>
            <p className="text-white/90 leading-relaxed font-sans text-[11px]">
              {account.contributingFeatures.find(f => f.name.includes("Gemini"))?.explanation || 
               "Legitimate authority profile. High follower ratio and established tenure counter-indicate synthetic bot acquisition."}
            </p>
          </div>

          {/* Flagged Accounts Table List */}
          <div className="pt-2">
            <span className="text-[11px] font-mono uppercase text-[#A9B9E0] block mb-2">
              Recent Triaged Queue Targets
            </span>
            <div className="space-y-1.5">
              {accounts.slice(0, 4).map((acc) => {
                const isCurrent = acc.id === account.id;
                return (
                  <div
                    key={acc.id}
                    onClick={() => handleLiveScan(acc.handle)}
                    className={clsx(
                      "grid grid-cols-4 items-center p-2.5 rounded-[12px] text-xs cursor-pointer transition-all",
                      isCurrent
                        ? "bg-gradient-to-r from-[#12D8C4]/20 to-[#12D8C4]/[0.04] border border-[#50FFE6]/45"
                        : "bg-white/[0.04] hover:bg-white/[0.08]"
                    )}
                  >
                    <span className="font-mono font-medium text-white truncate">@{acc.handle}</span>
                    <span className="capitalize text-[#A9B9E0]">{acc.platform}</span>
                    <span className="font-mono text-white/90">{acc.score.toFixed(2)}</span>
                    <span className="text-right">
                      <span
                        className={clsx(
                          "inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold text-white",
                          acc.band === 'HIGH' && "bg-gradient-to-b from-[#FF5C7C] to-[#B8123A] shadow-[0_0_10px_rgba(255,61,100,0.5)]",
                          acc.band === 'MEDIUM' && "bg-gradient-to-b from-[#FFD479] to-[#F28C28] text-[#3A1D00]",
                          acc.band === 'LOW' && "bg-gradient-to-b from-[#6BF0B5] to-[#13A56B] text-[#02261A]"
                        )}
                      >
                        {acc.band}
                      </span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT CARD (1fr): The Glossy Risk Dial & Feature Attribution */}
        <div className="lg:col-span-5 glass-panel rounded-[22px] p-6 flex flex-col items-center justify-between space-y-4">
          <div className="w-full flex items-center justify-between pb-2 border-b border-white/10">
            <span className="text-[17px] font-bold text-white">Risk Score</span>
            <span className="text-[11px] font-mono text-[#A9B9E0]">10,594-Profile Model</span>
          </div>

          {/* GLOWING RISK DIAL SVG FROM MAIN.DC.HTML */}
          <div className="relative flex flex-col items-center my-2">
            <svg width="280" height="160" viewBox="0 0 200 120" role="img" aria-label={`Risk dial showing ${score}`}>
              <defs>
                <filter id="gl" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="3" result="b"></feGaussianBlur>
                  <feMerge>
                    <feMergeNode in="b"></feMergeNode>
                    <feMergeNode in="SourceGraphic"></feMergeNode>
                  </feMerge>
                </filter>
              </defs>

              {/* Base Arc */}
              <path d="M20 100 A80 80 0 0 1 180 100" fill="none" stroke="rgba(255,255,255,.1)" strokeWidth="16" pathLength="100"></path>

              {/* Low Zone (Green) */}
              <path d="M20 100 A80 80 0 0 1 180 100" fill="none" stroke="#3DDC97" strokeWidth="16" pathLength="100" strokeDasharray="49 51" opacity={isLow ? "1" : ".35"}></path>

              {/* Med Zone (Orange) */}
              <path d="M20 100 A80 80 0 0 1 180 100" fill="none" stroke="#FFAF3D" strokeWidth="16" pathLength="100" strokeDasharray="29 71" strokeDashoffset="-50" opacity={isMed ? "1" : ".35"}></path>

              {/* High Zone (Pink) */}
              <path d="M20 100 A80 80 0 0 1 180 100" fill="none" stroke="#FF3D8B" strokeWidth="16" pathLength="100" strokeDasharray="20 80" strokeDashoffset="-80" filter={isHigh ? "url(#gl)" : undefined} opacity={isHigh ? "1" : ".35"}></path>

              {/* Needle Line */}
              <line x1="100" y1="100" x2={nx} y2={ny} stroke="#fff" strokeWidth="3" strokeLinecap="round" filter="url(#gl)"></line>
              <circle cx="100" cy="100" r="8" fill="#fff"></circle>
              <circle cx="100" cy="100" r="3.5" fill={isHigh ? "#FF3D8B" : isMed ? "#FFAF3D" : "#3DDC97"}></circle>
            </svg>

            {/* Glowing Big Score Display */}
            <div
              className="font-mono text-[46px] font-bold text-white tracking-tight mt-[-6px]"
              style={{
                textShadow: isHigh ? '0 0 24px rgba(255,61,139,.8)' : isMed ? '0 0 24px rgba(255,159,46,.8)' : '0 0 24px rgba(61,220,151,.8)'
              }}
            >
              {score.toFixed(2)}
            </div>

            {/* Glowing Pill from Reference */}
            <div
              className={clsx(
                "mt-2 px-4 py-1.5 rounded-full text-xs font-bold text-white tracking-wide text-center",
                isHigh && "bg-gradient-to-b from-[#FF5C7C] to-[#B8123A] shadow-[0_0_18px_rgba(255,61,100,0.65)] border-t border-white/50",
                isMed && "bg-gradient-to-b from-[#FFD479] to-[#F28C28] text-[#3A1D00] shadow-[0_0_18px_rgba(255,159,46,0.6)] border-t border-white/70",
                isLow && "bg-gradient-to-b from-[#6BF0B5] to-[#13A56B] text-[#02261A] shadow-[0_0_18px_rgba(61,220,151,0.6)] border-t border-white/70"
              )}
            >
              {isHigh ? 'HIGH · send to nodal cell after review' : isMed ? 'MEDIUM · manual forensic audit required' : 'LOW · confirmed genuine account'}
            </div>
          </div>

          {/* VIBRANT GLOWING HORIZONTAL ATTRIBUTION BARS FROM MOCKUP */}
          <div className="w-full space-y-3 pt-2">
            <div className="flex items-center gap-3 text-xs">
              <span className="w-28 text-[#C9D6F5] font-medium">Account age</span>
              <div className="flex-1 h-2.5 rounded-full bg-white/[0.12] overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#FF9F2E] to-[#FF3D8B] shadow-[0_0_10px_rgba(255,61,139,0.6)] transition-all duration-500"
                  style={{ width: `${Math.min(100, (account.accountAgeDays / 1000) * 100)}%` }}
                />
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <span className="w-28 text-[#C9D6F5] font-medium">Handle digits</span>
              <div className="flex-1 h-2.5 rounded-full bg-white/[0.12] overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#7A4DFF] to-[#FF3D8B] shadow-[0_0_10px_rgba(122,77,255,0.6)] transition-all duration-500"
                  style={{ width: `${Math.min(100, account.usernameDigitRatio * 200)}%` }}
                />
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <span className="w-28 text-[#C9D6F5] font-medium">Follow ratio</span>
              <div className="flex-1 h-2.5 rounded-full bg-white/[0.12] overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#12D8C4] to-[#7A4DFF] shadow-[0_0_10px_rgba(18,216,196,0.6)] transition-all duration-500"
                  style={{ width: `${Math.min(100, (account.followers / Math.max(account.following, 1)) * 10)}%` }}
                />
              </div>
            </div>
          </div>

          <div className="w-full pt-3 border-t border-white/10 text-center text-[10px] font-mono text-[#A9B9E0]">
            SHA-256 Digest: {account.evidenceHash.substring(0, 16)}…
          </div>
        </div>
      </div>

      {/* 5. CONNECTED GLOWING PIPELINE STRIP FROM MAIN.DC.HTML */}
      <div className="glass-panel rounded-[20px] p-4 flex items-center justify-between text-xs select-none shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_16px_40px_rgba(0,0,0,0.35)]">
        <div className="flex flex-col items-center gap-1.5">
          <div className="w-7 h-7 rounded-full bg-[radial-gradient(circle_at_30%_25%,#9FFFF1,#0FA79B)] shadow-[0_0_16px_#12D8C4] flex items-center justify-center font-bold text-[#032622] text-[11px]">✓</div>
          <span className="text-white font-medium text-[11px]">Input</span>
        </div>

        <div className="relative flex-1 h-1.5 mx-2 mb-4 rounded-full bg-gradient-to-r from-[#12D8C4] to-[#7A4DFF] shadow-[0_0_10px_#12D8C4] overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-90 animate-[pipeline-beam_2.2s_infinite_linear]" />
        </div>

        <div className="flex flex-col items-center gap-1.5">
          <div className="w-7 h-7 rounded-full bg-[radial-gradient(circle_at_30%_25%,#9FFFF1,#0FA79B)] shadow-[0_0_16px_#12D8C4] flex items-center justify-center font-bold text-[#032622] text-[11px]">✓</div>
          <span className="text-white font-medium text-[11px]">Fetch</span>
        </div>

        <div className="relative flex-1 h-1.5 mx-2 mb-4 rounded-full bg-gradient-to-r from-[#7A4DFF] to-[#8E6BFF] shadow-[0_0_10px_#7A4DFF] overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-90 animate-[pipeline-beam_2.2s_infinite_linear] [animation-delay:0.3s]" />
        </div>

        <div className="flex flex-col items-center gap-1.5">
          <div className="w-7 h-7 rounded-full bg-[radial-gradient(circle_at_30%_25%,#CDB9FF,#6A3DEB)] shadow-[0_0_16px_#7A4DFF] flex items-center justify-center font-bold text-white text-[11px]">✓</div>
          <span className="text-white font-medium text-[11px]">Features</span>
        </div>

        <div className="relative flex-1 h-1.5 mx-2 mb-4 rounded-full bg-gradient-to-r from-[#8E6BFF] to-[#FF9F2E] shadow-[0_0_10px_#FF9F2E] overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-90 animate-[pipeline-beam_2.2s_infinite_linear] [animation-delay:0.6s]" />
        </div>

        <div className="flex flex-col items-center gap-1.5">
          <div className="w-7 h-7 rounded-full bg-[radial-gradient(circle_at_30%_25%,#FFE0A8,#F28C28)] shadow-[0_0_16px_#FF9F2E] flex items-center justify-center font-bold text-[#3A1D00] text-[11px]">✓</div>
          <span className="text-white font-medium text-[11px]">Score</span>
        </div>

        <div className="relative flex-1 h-1.5 mx-2 mb-4 rounded-full bg-gradient-to-r from-[#FF9F2E] to-[#FF3D8B] shadow-[0_0_10px_#FF3D8B] overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-90 animate-[pipeline-beam_2.2s_infinite_linear] [animation-delay:0.9s]" />
        </div>

        <div className="flex flex-col items-center gap-1.5">
          <div className="w-7 h-7 rounded-full bg-[radial-gradient(circle_at_30%_25%,#FFB3CC,#D61F6B)] shadow-[0_0_16px_#FF3D8B] flex items-center justify-center font-bold text-white text-[11px]">✓</div>
          <span className="text-white font-medium text-[11px]">Risk band</span>
        </div>

        <div className="relative flex-1 h-1.5 mx-2 mb-4 rounded-full bg-white/20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-[pipeline-beam_2.2s_infinite_linear] [animation-delay:1.2s]" />
        </div>

        <div className="flex flex-col items-center gap-1.5">
          <div className="w-7 h-7 rounded-full border-2 border-dashed border-white/60 flex items-center justify-center text-white/70 text-[10px]">●</div>
          <span className="text-[#A9B9E0] font-medium text-[11px]">Analyst review</span>
        </div>
      </div>

      {/* CONFIRM MODAL */}
      <Modal
        isOpen={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        title="Confirm Account as Fake & Draft Section 79(3)(b) Notice"
        footer={
          <>
            <button
              onClick={() => setConfirmModalOpen(false)}
              className="px-4 py-2 rounded-[12px] bg-white/10 hover:bg-white/15 text-xs text-white"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmAction}
              disabled={isSubmitting}
              className="px-5 py-2 rounded-[12px] bg-gradient-to-r from-[#FF5C7C] to-[#B8123A] text-white font-bold text-xs shadow-glow-pink"
            >
              {isSubmitting ? 'Sealing Docket...' : 'Confirm & Forward to Nodal Cell'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="p-3 rounded-[12px] bg-[#FF3D8B]/15 border border-[#FF3D8B]/30 text-xs text-[#FFD0E2]">
            <span className="font-bold">Statutory Action:</span> Confirming will seal the SHA-256 evidence package and transmit this case into the Nodal Cell queue.
          </div>

          <div>
            <label className="block text-xs font-semibold text-white mb-1">
              Investigator Statutory Justification:
            </label>
            <textarea
              rows={3}
              value={confirmReason}
              onChange={(e) => setConfirmReason(e.target.value)}
              className="w-full glass-input rounded-[12px] p-2.5 text-xs text-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-white mb-1">
              Draft Notice Preview:
            </label>
            <div className="p-3 rounded-[12px] bg-black/40 border border-white/10 text-[11px] font-mono text-[#C9D6F5] leading-relaxed">
              <p className="font-bold text-[#12D8C4]">TO: Resident Grievance Officer, {account.platform.toUpperCase()} Legal Operations</p>
              <p className="mt-1">RE: Statutory Notice under Section 79(3)(b) IT Act 2000 & Rule 3(1)(d) IT Rules 2026</p>
              <p className="mt-2 text-white">TARGET: @{account.handle} (SHA-256 Seal: {account.evidenceHash})</p>
              <p className="mt-1">VIOLATIONS: {confirmReason}</p>
              <p className="mt-2">You are hereby mandated to remove/disable access within 36 hours of receipt.</p>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};
