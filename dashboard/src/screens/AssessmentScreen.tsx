import React, { useState } from 'react';
import { useApp } from '../lib/state';
import { Modal } from '../components/Modal';
import { Button } from '../components/Button';
import { ProfileCard } from '../components/ProfileCard';
import { Platform } from '../mock/accounts';
import { 
  ShieldAlert, 
  CheckCircle2, 
  ExternalLink, 
  Search, 
  Sparkles, 
  AlertTriangle,
  RotateCcw,
  Download,
  Globe,
  Radio,
  ArrowRight,
  ShieldCheck,
  Fingerprint
} from 'lucide-react';
import { clsx } from 'clsx';
import { generateForensicPdf } from '../lib/pdfReport';

interface PlatformTab {
  id: Platform | 'youtube' | 'github';
  name: string;
  icon: string;
  placeholder: string;
  tagline: string;
}

const PLATFORM_TABS: PlatformTab[] = [
  { id: 'instagram', name: 'Instagram', icon: '/icons/instagram.png', placeholder: 'Enter Instagram handle (e.g. cristiano, nasa)...', tagline: 'Live DOM & Avatar Scraper' },
  { id: 'x', name: 'X / Twitter', icon: '/icons/x.png', placeholder: 'Enter X handle (e.g. adgpi, narendramodi)...', tagline: 'Tweet & Follower Ratio Check' },
  { id: 'telegram', name: 'Telegram', icon: '/icons/telegram.png', placeholder: 'Enter Telegram channel handle (e.g. durov)...', tagline: 'Zero-Auth Channel Audit' },
  { id: 'facebook', name: 'Facebook', icon: '/icons/facebook.png', placeholder: 'Enter Facebook page / user link...', tagline: 'Page Authority & Impersonation' },
  { id: 'youtube', name: 'YouTube', icon: '/icons/youtube.png', placeholder: 'Enter YouTube channel handle...', tagline: 'Subscriber Tier & Video Audit' },
  { id: 'github', name: 'GitHub', icon: '/icons/github.png', placeholder: 'Enter GitHub username (e.g. torvalds)...', tagline: 'Developer API Telemetry' },
];

export const AssessmentScreen: React.FC = () => {
  const { 
    selectedAccountId, 
    accounts, 
    officerId,
    confirmAsFake, 
    markAsGenuine, 
    runLiveScan,
    setSelectedAccountId,
    setCurrentScreen,
    addToast
  } = useApp();

  // Find currently selected account (no hardcoded fallback by default)
  const account = accounts.find((a) => a.id === selectedAccountId);

  const [activePlatformTab, setActivePlatformTab] = useState<PlatformTab>(PLATFORM_TABS[0]);
  const [confirmModalOpen, setConfirmModalOpen] = useState<boolean>(false);
  const [confirmReason, setConfirmReason] = useState<string>("Impersonation of uniformed central police force personnel and fraudulent fee solicitation.");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isScanningLive, setIsScanningLive] = useState<boolean>(false);
  const [customHandleInput, setCustomHandleInput] = useState<string>('');

  const handleConfirmAction = () => {
    if (!account) return;
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setConfirmModalOpen(false);
      confirmAsFake(account.id, confirmReason);
    }, 400);
  };

  const handleLiveScan = async (handle: string, platform?: string) => {
    if (!handle.trim()) return;
    setIsScanningLive(true);
    try {
      const mappedPlatform = (platform || (activePlatformTab.id === 'youtube' || activePlatformTab.id === 'github' ? 'instagram' : activePlatformTab.id)) as Platform;
      const scanned = await runLiveScan(handle.trim(), mappedPlatform);
      setSelectedAccountId(scanned.id);
      addToast(`Telemetry captured for @${scanned.handle}`, "success");
    } catch (e) {
      console.error("Scan error:", e);
      addToast("Failed to resolve live profile.", "danger");
    } finally {
      setIsScanningLive(false);
    }
  };

  const handleDownloadDossier = () => {
    if (!account) return;
    try {
      generateForensicPdf(account, officerId);
      addToast(`Downloaded PDF dossier for @${account.handle}`, "success");
    } catch (err) {
      console.error("PDF download error:", err);
      addToast("Error generating PDF dossier", "danger");
    }
  };

  // Dial calculations (if account is present)
  const score = account ? account.score : 0;
  const isHigh = account ? account.band === 'HIGH' : false;
  const isMed = account ? account.band === 'MEDIUM' : false;
  const isLow = account ? account.band === 'LOW' : false;

  const needleAngle = -180 + score * 180;
  const rad = (needleAngle * Math.PI) / 180;
  const nx = 100 + 72 * Math.cos(rad);
  const ny = 100 + 72 * Math.sin(rad);

  return (
    <div className="space-y-4 select-none">
      
      {/* 1. TOP SEARCH & REAL-TIME EVALUATION BAR */}
      <div className="glass-panel rounded-[20px] p-4 shadow-[0_10px_35px_rgba(0,0,0,0.4)] border border-white/15 space-y-3">
        {/* Platform Selection Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-[10px] font-mono font-bold text-[#A9B9E0] uppercase tracking-wider mr-2 shrink-0">
            Platform Section:
          </span>
          {PLATFORM_TABS.map((tab) => {
            const isSelected = activePlatformTab.id === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActivePlatformTab(tab);
                  setCustomHandleInput('');
                }}
                className={clsx(
                  "px-3 py-1.5 rounded-full text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 border",
                  isSelected
                    ? "bg-[#12D8C4]/20 text-white border-[#12D8C4] shadow-[0_0_12px_rgba(18,216,196,0.4)]"
                    : "bg-white/5 text-[#A9B9E0] hover:text-white border-white/10 hover:bg-white/10"
                )}
              >
                <img src={tab.icon} alt={tab.name} className="w-4 h-4 rounded-full object-cover shrink-0" />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </div>

        {/* Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (customHandleInput.trim()) {
              handleLiveScan(customHandleInput.trim());
            }
          }}
          className="flex flex-col sm:flex-row items-center gap-2.5"
        >
          <div className="relative flex-1 w-full">
            <input
              type="text"
              placeholder={activePlatformTab.placeholder}
              value={customHandleInput}
              onChange={(e) => setCustomHandleInput(e.target.value)}
              className="w-full glass-input rounded-[12px] px-3.5 py-2.5 text-xs font-mono text-white placeholder-white/40 focus:outline-none focus:border-[#12D8C4] pr-8"
            />
            <Search className="w-4 h-4 text-[#12D8C4] absolute right-3 top-3 opacity-70" />
          </div>

          <button
            type="submit"
            disabled={isScanningLive}
            className="w-full sm:w-auto px-5 py-2.5 rounded-[12px] text-xs font-bold text-[#04161C] bg-[#12D8C4] hover:bg-[#50FFE6] shadow-[0_0_20px_rgba(18,216,196,0.4)] transition-all flex items-center justify-center gap-1.5 cursor-pointer font-mono shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isScanningLive ? "Scanning Web..." : "Run Live Scan"}</span>
          </button>
        </form>

        {/* Suggested Live Targets for Fast Verification */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] font-mono">
          <span className="text-[#A9B9E0]">Quick Live Targets:</span>
          <button
            type="button"
            onClick={() => handleLiveScan('cristiano', 'instagram')}
            className="px-2.5 py-0.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/15 text-[#12D8C4] hover:border-[#12D8C4] transition-all cursor-pointer"
          >
            @cristiano (Instagram Live DP)
          </button>
          <button
            type="button"
            onClick={() => handleLiveScan('nasa', 'instagram')}
            className="px-2.5 py-0.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/15 text-[#3DDC97] hover:border-[#3DDC97] transition-all cursor-pointer"
          >
            @nasa (Instagram Org)
          </button>
          <button
            type="button"
            onClick={() => handleLiveScan('durov', 'telegram')}
            className="px-2.5 py-0.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/15 text-[#50FFE6] hover:border-[#50FFE6] transition-all cursor-pointer"
          >
            @durov (Telegram DOM)
          </button>
          <button
            type="button"
            onClick={() => handleLiveScan('torvalds', 'github')}
            className="px-2.5 py-0.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/15 text-[#B692FF] hover:border-[#B692FF] transition-all cursor-pointer"
          >
            @torvalds (GitHub API)
          </button>
        </div>
      </div>

      {/* SCANNING ACTIVE BANNER */}
      {isScanningLive && (
        <div className="p-4 rounded-[16px] bg-gradient-to-r from-[#12D8C4]/20 via-[#7A4DFF]/20 to-[#FF3D8B]/20 border border-[#12D8C4]/50 shadow-[0_0_30px_rgba(18,216,196,0.35)] flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#12D8C4] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#12D8C4]"></span>
            </span>
            <div>
              <span className="text-xs font-bold text-white font-mono block">
                Visiting platform &amp; extracting live telemetry via Playwright Headless Browser...
              </span>
              <span className="text-[11px] text-[#A9B9E0] font-mono">
                Extracting real profile picture • Verifying follower velocity • Running Google Safe Browsing • Random Forest inference
              </span>
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-[#12D8C4] bg-[#12D8C4]/20 px-2.5 py-1 rounded-full border border-[#12D8C4]/40">SCANNING ACTIVE</span>
        </div>
      )}

      {/* 2. IF NO ACCOUNT IS SELECTED: EMPTY LAUNCHPAD HUB */}
      {!account ? (
        <div className="glass-panel rounded-[24px] p-8 md:p-12 text-center space-y-6 border border-white/15 shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
          <div className="max-w-md mx-auto space-y-2">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#12D8C4]/20 to-[#7A4DFF]/20 border border-[#12D8C4]/40 flex items-center justify-center mx-auto text-2xl text-[#12D8C4] shadow-[0_0_20px_rgba(18,216,196,0.3)]">
              🛡️
            </div>
            <h2 className="text-2xl font-bold text-white font-sans tracking-tight">
              Ready for Live Profile Assessment
            </h2>
            <p className="text-xs text-[#A9B9E0] font-mono leading-relaxed">
              No mock user account is loaded. Enter any public target handle above or select a platform below to initiate real headless browser data extraction.
            </p>
          </div>

          {/* 6 Platform Section Quick-Launch Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 max-w-4xl mx-auto pt-2">
            {PLATFORM_TABS.map((tab) => (
              <div
                key={tab.id}
                onClick={() => {
                  setActivePlatformTab(tab);
                  setCustomHandleInput(tab.id === 'instagram' ? 'cristiano' : tab.id === 'telegram' ? 'durov' : tab.id === 'github' ? 'torvalds' : 'adgpi');
                }}
                className="p-4 rounded-[18px] bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-[#12D8C4]/50 transition-all cursor-pointer text-left space-y-2 group"
              >
                <div className="flex items-center justify-between">
                  <img src={tab.icon} alt={tab.name} className="w-8 h-8 rounded-full object-cover shrink-0 shadow-[0_0_12px_rgba(255,255,255,0.25)]" />
                  <span className="text-[10px] font-mono text-[#12D8C4] opacity-0 group-hover:opacity-100 transition-opacity">Select →</span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white font-sans">{tab.name} Scanner</h4>
                  <p className="text-[11px] font-mono text-[#A9B9E0]">{tab.tagline}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2">
            <button
              onClick={() => setCurrentScreen('scan')}
              className="glossy-btn px-6 py-2.5 rounded-[14px] text-xs font-mono font-bold text-white bg-gradient-to-r from-[#12D8C4]/30 to-[#7A4DFF]/30 border border-[#12D8C4]/40 hover:scale-105 active:scale-95 transition-all inline-flex items-center gap-2 cursor-pointer"
            >
              <Radio className="w-4 h-4 text-[#12D8C4]" />
              <span>Switch to Advanced Multi-Signal Scan Studio</span>
            </button>
          </div>
        </div>
      ) : (
        /* 3. ACTIVE ACCOUNT ASSESSMENT DOSSIER */
        <div className="space-y-4">
          
          {/* HEADER BAR: Handle + Risk Pill + Download PDF Dossier + Actions */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-white/10">
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
                  Live Multi-Signal Inference Active
                </span>
              </div>
            </div>

            {/* Action Buttons: Download PDF, Mark Genuine, Confirm Fake */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={handleDownloadDossier}
                className="glossy-btn px-4 py-2 rounded-[14px] text-xs font-mono font-medium text-white border border-[#12D8C4]/40 bg-gradient-to-r from-[#12D8C4]/20 to-[#7A4DFF]/20 hover:from-[#12D8C4]/35 hover:to-[#7A4DFF]/35 shadow-[0_4px_15px_rgba(18,216,196,0.2)] flex items-center gap-1.5 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                title="Download Official Legal Assessment PDF Dossier"
              >
                <Download className="w-3.5 h-3.5 text-[#12D8C4]" />
                <span>Download Dossier PDF</span>
              </button>

              <button
                onClick={() => markAsGenuine(account.id)}
                className="glossy-btn px-4 py-2 rounded-[14px] text-xs font-medium text-[#EAF1FF] border border-white/30 bg-gradient-to-b from-white/20 to-white/5 hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                Mark as genuine
              </button>

              <button
                onClick={() => setConfirmModalOpen(true)}
                className="glossy-btn px-5 py-2 rounded-[14px] text-xs font-bold text-[#3A0618] border-0 bg-gradient-to-r from-[#FF8FB1] via-[#FF3D8B] to-[#FF9F2E] shadow-[0_10px_30px_rgba(255,61,139,0.55)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                Confirm as fake
              </button>
            </div>
          </div>

          {/* MAIN TWO-COLUMN DOSSIER LAYOUT */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            
            {/* LEFT COLUMN: Dedicated Profile Card for Scanned User */}
            <div className="lg:col-span-7 space-y-4">
              <ProfileCard account={account} onDownloadPdf={handleDownloadDossier} />

              {/* Forensic Explanation Summary Card */}
              <div className="p-4 rounded-[18px] bg-gradient-to-r from-white/[0.06] to-[#7A4DFF]/15 border border-[#7A4DFF]/30 text-xs space-y-2">
                <div className="flex items-center justify-between text-[#12D8C4]">
                  <div className="flex items-center gap-1.5 font-semibold font-mono">
                    <Sparkles className="w-4 h-4" />
                    <span>Cyber Threat Intelligence (CTI) Forensic Summary:</span>
                  </div>
                  <span className="text-[10px] font-mono text-[#A9B9E0]">Model rf_v1 calibrated</span>
                </div>
                <p className="text-white/95 leading-relaxed font-sans text-xs">
                  {account.contributingFeatures.find(f => f.name.includes("Gemini"))?.explanation ||
                   (account.score >= 0.5 
                     ? "Anomalous telemetry detected: extreme follower/following ratio asymmetry, deficient avatar presence, and keyword tokens matching unauthorized state force recruitment fraud patterns."
                     : "Verified organic telemetry: established account tenure, high organic follower authority, custom avatar present, and clean safe browsing status decrease spoofing probability.")}
                </p>
              </div>

              {/* Recent Triaged Targets Quick-Switch Strip */}
              <div className="pt-2">
                <span className="text-[11px] font-mono uppercase text-[#A9B9E0] block mb-2 font-bold">
                  Triaged Targets In Session Queue:
                </span>
                <div className="space-y-1.5">
                  {accounts.slice(0, 4).map((acc) => {
                    const isCurrent = acc.id === account.id;
                    return (
                      <div
                        key={acc.id}
                        onClick={() => setSelectedAccountId(acc.id)}
                        className={clsx(
                          "grid grid-cols-4 items-center p-2.5 rounded-[12px] text-xs cursor-pointer transition-all",
                          isCurrent
                            ? "bg-[#12D8C4]/20 border border-[#50FFE6]/45"
                            : "bg-white/[0.04] hover:bg-white/[0.08] border border-white/5"
                        )}
                      >
                        <span className="font-mono font-medium text-white truncate">@{acc.handle}</span>
                        <span className="capitalize text-[#A9B9E0]">{acc.platform}</span>
                        <span className="font-mono text-white/90">{acc.score.toFixed(2)}</span>
                        <div className="text-right">
                          <span
                            className={clsx(
                              "inline-block px-2 py-0.5 rounded-full text-[10px] font-bold text-white",
                              acc.band === 'HIGH' && "bg-[#FF3D8B]",
                              acc.band === 'MEDIUM' && "bg-[#FF9F2E]",
                              acc.band === 'LOW' && "bg-[#3DDC97] text-[#02261A]"
                            )}
                          >
                            {acc.band}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: The Risk Dial & SHAP Feature Bars */}
            <div className="lg:col-span-5 glass-panel rounded-[22px] p-6 flex flex-col items-center justify-between space-y-4">
              <div className="w-full flex items-center justify-between pb-2 border-b border-white/10">
                <span className="text-[17px] font-bold text-white font-sans">Multi-Signal Risk Score</span>
                <span className="text-[11px] font-mono text-[#A9B9E0]">10,594-Profile Model</span>
              </div>

              {/* Glowing Risk Dial SVG */}
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

                {/* Score Digits */}
                <div
                  className="font-mono text-[46px] font-bold text-white tracking-tight mt-[-6px]"
                  style={{
                    textShadow: isHigh ? '0 0 24px rgba(255,61,139,.8)' : isMed ? '0 0 24px rgba(255,159,46,.8)' : '0 0 24px rgba(61,220,151,.8)'
                  }}
                >
                  {score.toFixed(2)}
                </div>

                {/* Risk Classification Banner */}
                <div className="mt-1">
                  <span
                    className={clsx(
                      "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg",
                      isHigh && "bg-gradient-to-r from-[#FF5C7C] to-[#B8123A] text-white shadow-[0_0_15px_rgba(255,61,100,0.6)]",
                      isMed && "bg-gradient-to-r from-[#FFD479] to-[#F28C28] text-[#3A1D00] shadow-[0_0_15px_rgba(255,159,46,0.6)]",
                      isLow && "bg-gradient-to-r from-[#6BF0B5] to-[#13A56B] text-[#02261A] shadow-[0_0_15px_rgba(61,220,151,0.6)]"
                    )}
                  >
                    <span>{account.band}</span>
                    <span>•</span>
                    <span className="font-normal normal-case">
                      {isHigh ? "send to nodal cell after review" : isMed ? "escalate for manual corroboration" : "confirmed genuine account"}
                    </span>
                  </span>
                </div>
              </div>

              {/* Feature Attribution Bar Graph */}
              <div className="w-full space-y-3 pt-2 border-t border-white/10">
                <span className="text-[11px] font-mono uppercase text-[#A9B9E0] block font-bold">
                  Top Contributing Signals (Attribution):
                </span>
                <div className="space-y-2">
                  {account.contributingFeatures.slice(0, 4).map((f, i) => {
                    const isPositive = f.weight > 0;
                    return (
                      <div key={i} className="space-y-1 text-xs font-mono">
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-white/90 truncate max-w-[200px]">{f.name}</span>
                          <span className={clsx("font-bold", isPositive ? "text-[#FF5C7C]" : "text-[#3DDC97]")}>
                            {isPositive ? "+" : ""}{f.weight.toFixed(2)} ({f.value})
                          </span>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={clsx("h-full rounded-full transition-all duration-500", isPositive ? "bg-gradient-to-r from-[#FF9F2E] to-[#FF3D8B]" : "bg-gradient-to-r from-[#12D8C4] to-[#3DDC97]")}
                            style={{ width: `${Math.min(100, Math.abs(f.weight) * 200)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Single Click Legal PDF Export Button */}
              <div className="w-full pt-2">
                <button
                  onClick={handleDownloadDossier}
                  className="w-full py-2.5 rounded-[12px] bg-white/10 hover:bg-white/15 border border-[#12D8C4]/40 text-xs font-mono font-bold text-white flex items-center justify-center gap-2 transition-all cursor-pointer hover:border-[#12D8C4]"
                >
                  <Download className="w-4 h-4 text-[#12D8C4]" />
                  <span>Download Legal Evidence Dossier PDF</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM AS FAKE TAKEDOWN MODAL */}
      {account && (
        <Modal
          isOpen={confirmModalOpen}
          onClose={() => setConfirmModalOpen(false)}
          title="Draft Statutory Takedown Notice"
        >
          <div className="space-y-4 text-xs font-mono select-none">
            <div className="p-3 rounded-[12px] bg-[#FF3D8B]/15 border border-[#FF3D8B]/30 text-[#FF5C7C] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>
                Statutory Notice under Section 79(3)(b) Information Technology Act 2000 &amp; IT Rules 2026.
              </span>
            </div>

            <div>
              <label className="block text-[11px] uppercase text-[#A9B9E0] font-bold mb-1">
                Forensic Confirmation Reason
              </label>
              <textarea
                rows={3}
                value={confirmReason}
                onChange={(e) => setConfirmReason(e.target.value)}
                className="w-full glass-input rounded-[10px] p-2.5 text-xs text-white focus:outline-none focus:border-[#12D8C4]"
              />
            </div>

            <div className="p-3 rounded-[10px] bg-white/5 border border-white/10 space-y-1">
              <span className="text-[10px] uppercase text-[#A9B9E0] block font-bold">Draft Notice Excerpt:</span>
              <p className="text-[11px] text-white/90 leading-relaxed font-sans">
                "Pursuant to Rule 3(1)(d) of the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules,
                account @{account.handle} on {account.platform.toUpperCase()} has been verified by the Cyber Forensic Cell as an impersonation
                or unauthorized operational entity. Immediate disablement of access is required within 24 hours."
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setConfirmModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                isLoading={isSubmitting}
                onClick={handleConfirmAction}
              >
                Sign &amp; Forward to Nodal Cell
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
