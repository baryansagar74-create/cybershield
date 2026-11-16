import React, { useState } from 'react';
import { MockAccount } from '../mock/accounts';
import { clsx } from 'clsx';
import { 
  CheckCircle2, 
  ExternalLink, 
  Copy, 
  Check, 
  Download, 
  ShieldAlert, 
  ShieldCheck, 
  Clock, 
  Fingerprint, 
  Globe, 
  Sparkles,
  AlertTriangle
} from 'lucide-react';
import { generateForensicPdf } from '../lib/pdfReport';
import { useApp } from '../lib/state';

interface ProfileCardProps {
  account: MockAccount;
  onDownloadPdf?: () => void;
  className?: string;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({ account, onDownloadPdf, className }) => {
  const { officerId, addToast } = useApp();
  const [copiedHash, setCopiedHash] = useState(false);
  const [copiedHandle, setCopiedHandle] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleCopyHash = () => {
    navigator.clipboard.writeText(account.evidenceHash);
    setCopiedHash(true);
    addToast("Evidentiary SHA-256 seal copied to clipboard", "info");
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const handleCopyHandle = () => {
    navigator.clipboard.writeText(`@${account.handle}`);
    setCopiedHandle(true);
    addToast(`Target handle @${account.handle} copied`, "info");
    setTimeout(() => setCopiedHandle(false), 2000);
  };

  const handleDownload = () => {
    setIsDownloading(true);
    try {
      if (onDownloadPdf) {
        onDownloadPdf();
      } else {
        generateForensicPdf(account, officerId);
      }
      addToast(`Downloaded PDF dossier for @${account.handle}`, "success");
    } catch (e) {
      console.error("PDF generation failed:", e);
      addToast("Failed to generate PDF dossier", "danger");
    } finally {
      setIsDownloading(false);
    }
  };

  const isHigh = account.band === 'HIGH';
  const isMed = account.band === 'MEDIUM';
  const isLow = account.band === 'LOW';

  const followRatio = account.following > 0 
    ? (account.followers / account.following).toFixed(2)
    : account.followers.toString();

  // Platform external link builder
  const getProfileUrl = () => {
    if (account.link && account.link.startsWith('http')) return account.link;
    switch (account.platform) {
      case 'instagram': return `https://instagram.com/${account.handle}`;
      case 'x': return `https://x.com/${account.handle}`;
      case 'telegram': return `https://t.me/${account.handle}`;
      case 'facebook': return `https://facebook.com/${account.handle}`;
      default: return `https://${account.platform}.com/${account.handle}`;
    }
  };

  return (
    <div className={clsx(
      "glass-panel rounded-[22px] p-5 space-y-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/20 transition-all",
      className
    )}>
      {/* 1. TOP HEADER STRIP: Platform + DP Status + Data Source + PDF Download */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          {/* Platform Tag */}
          <span className="px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-white/10 text-white border border-white/20 flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-[#12D8C4]" />
            <span>{account.platform}</span>
          </span>

          {/* Account Age */}
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono text-[#A9B9E0] bg-white/5 border border-white/10">
            {account.accountAgeDays} days active
          </span>

          {/* Data Source Pill */}
          {account.dataSource && (
            <span className={clsx(
              "px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold tracking-wider flex items-center gap-1.5 border",
              account.dataSource.includes("playwright") || account.dataSource.includes("scraped")
                ? "bg-[#12D8C4]/15 text-[#12D8C4] border-[#12D8C4]/40 shadow-[0_0_12px_rgba(18,216,196,0.3)]"
                : account.dataSource.includes("telegram") || account.dataSource.includes("github")
                ? "bg-[#3DDC97]/15 text-[#3DDC97] border-[#3DDC97]/40 shadow-[0_0_12px_rgba(61,220,151,0.3)]"
                : account.dataSource.includes("gemini")
                ? "bg-[#7A4DFF]/15 text-[#B692FF] border-[#7A4DFF]/40 shadow-[0_0_12px_rgba(122,77,255,0.3)]"
                : "bg-[#FF9F2E]/15 text-[#FFC878] border-[#FF9F2E]/40"
            )}>
              <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse"></span>
              {account.dataSource.includes("playwright") ? "Live Web Scrape"
                : account.dataSource.includes("telegram") ? "Live Telegram DOM"
                : account.dataSource.includes("github") ? "Live GitHub API"
                : account.dataSource.includes("gemini") ? "OSINT Intelligence"
                : "Forensic Heuristic"}
            </span>
          )}
        </div>

        {/* Action Controls: PDF Download & External Profile Link */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="glossy-btn px-3 py-1.5 rounded-[12px] text-xs font-mono font-medium text-white border border-[#12D8C4]/40 bg-gradient-to-r from-[#12D8C4]/20 to-[#7A4DFF]/20 hover:from-[#12D8C4]/40 hover:to-[#7A4DFF]/40 shadow-[0_4px_15px_rgba(18,216,196,0.25)] flex items-center gap-1.5 hover:scale-105 active:scale-95 transition-all cursor-pointer"
            title="Download Formal Legal Evidence Dossier PDF"
          >
            <Download className="w-3.5 h-3.5 text-[#12D8C4]" />
            <span>{isDownloading ? "Generating..." : "Download Dossier PDF"}</span>
          </button>

          <a
            href={getProfileUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-[10px] bg-white/10 hover:bg-white/20 border border-white/15 text-[#A9B9E0] hover:text-white transition-all cursor-pointer"
            title="Visit public profile on platform"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* 2. PROFILE HERO IDENTIFIER: Avatar + Names + Handle + Profile Type */}
      <div className="flex items-start gap-4">
        {/* Profile Picture with With/Without DP Badge */}
        <div className="relative shrink-0">
          {account.hasProfilePic ? (
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#12D8C4] via-[#7A4DFF] to-[#FF3D8B] p-[2px] shadow-[0_0_20px_rgba(18,216,196,0.5)]">
              {account.profilePicUrl ? (
                <img 
                  src={account.profilePicUrl} 
                  alt={account.handle} 
                  className="w-full h-full rounded-full object-cover bg-[#081230]" 
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-[#081230] flex items-center justify-center font-bold text-white text-lg font-mono">
                  {account.handle.slice(0, 2).toUpperCase()}
                </div>
              )}
            </div>
          ) : (
            <div className="w-16 h-16 rounded-full border-2 border-dashed border-[#FF3D8B] bg-[#FF3D8B]/15 flex items-center justify-center text-[#FF5C7C] font-mono text-xs font-bold shadow-[0_0_16px_rgba(255,61,139,0.5)]">
              NO DP
            </div>
          )}

          {/* With / Without DP Pill */}
          <span
            className={clsx(
              "absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full text-[8px] font-mono font-bold border tracking-wider",
              account.hasProfilePic
                ? "bg-[#3DDC97] text-[#02261A] border-[#3DDC97] shadow-[0_0_8px_rgba(61,220,151,0.6)]"
                : "bg-[#FF3D8B] text-white border-[#FF3D8B] animate-pulse shadow-[0_0_8px_rgba(255,61,139,0.7)]"
            )}
          >
            {account.hasProfilePic ? "WITH DP" : "NO DP"}
          </span>
        </div>

        {/* Identity & Classification Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-xl font-bold text-white flex items-center gap-1.5 tracking-tight font-sans">
              <span>{account.name || account.handle}</span>
              {account.hasProfilePic && (
                <CheckCircle2 className="w-4 h-4 text-[#12D8C4] fill-[#12D8C4]/20" />
              )}
            </h3>

            {/* Impersonator or Genuine Pill */}
            <span
              className={clsx(
                "px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border",
                isHigh && "bg-[#FF3D8B]/20 text-[#FF5C7C] border-[#FF3D8B]/50",
                isMed && "bg-[#FF9F2E]/20 text-[#FFC878] border-[#FF9F2E]/50",
                isLow && "bg-[#3DDC97]/20 text-[#3DDC97] border-[#3DDC97]/50"
              )}
            >
              {account.band} RISK
            </span>
          </div>

          {/* Handle with Click-to-Copy */}
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <button
              onClick={handleCopyHandle}
              className="inline-flex items-center gap-1 text-sm font-mono text-[#12D8C4] hover:text-[#50FFE6] bg-white/5 hover:bg-white/10 px-2 py-0.5 rounded-[6px] border border-white/10 transition-all cursor-pointer"
              title="Copy handle"
            >
              <span>@{account.handle}</span>
              {copiedHandle ? <Check className="w-3 h-3 text-[#3DDC97]" /> : <Copy className="w-3 h-3 opacity-60" />}
            </button>

            {account.profileType && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white/10 text-[#FF9F2E] border border-white/15">
                {account.profileType}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 3. FOUR METRIC STATS: Followers, Following, Posts, Follow Ratio */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 p-3 rounded-[16px] bg-white/5 border border-white/10 font-mono text-center">
        <div className="p-2 rounded-[10px] bg-white/[0.03]">
          <span className="text-[10px] text-[#A9B9E0] block uppercase tracking-wider">Followers</span>
          <span className="text-base font-bold text-white mt-0.5 block">{account.followers.toLocaleString()}</span>
        </div>
        <div className="p-2 rounded-[10px] bg-white/[0.03]">
          <span className="text-[10px] text-[#A9B9E0] block uppercase tracking-wider">Following</span>
          <span className="text-base font-bold text-white mt-0.5 block">{account.following.toLocaleString()}</span>
        </div>
        <div className="p-2 rounded-[10px] bg-white/[0.03]">
          <span className="text-[10px] text-[#A9B9E0] block uppercase tracking-wider">Posts / Content</span>
          <span className="text-base font-bold text-white mt-0.5 block">{account.posts.toLocaleString()}</span>
        </div>
        <div className="p-2 rounded-[10px] bg-white/[0.03]">
          <span className="text-[10px] text-[#A9B9E0] block uppercase tracking-wider">Follow Ratio</span>
          <span className="text-base font-bold text-[#12D8C4] mt-0.5 block">{followRatio}x</span>
        </div>
      </div>

      {/* 4. CAPTURED BIO CONTENT BOX */}
      <div className="space-y-1.5">
        <span className="text-[10px] font-mono uppercase font-bold text-[#A9B9E0] flex items-center justify-between">
          <span>Captured Profile Bio / Telemetry</span>
          <span className="text-[#12D8C4] text-[9px] lowercase">verified capture</span>
        </span>
        <div className="p-3 rounded-[12px] bg-white/[0.04] border border-white/10 text-xs text-[#E8EEF6] font-mono leading-relaxed break-words">
          {account.bio || "No biography provided in live telemetry."}
        </div>
      </div>

      {/* 5. GOOGLE SAFE BROWSING & REDIRECTION URL STATUS */}
      {account.link && (
        <div className="p-2.5 rounded-[12px] bg-white/[0.03] border border-white/10 flex items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-2 truncate text-[#A9B9E0]">
            <Globe className="w-3.5 h-3.5 shrink-0 text-[#12D8C4]" />
            <span className="truncate">{account.link}</span>
          </div>
          <span className={clsx(
            "px-2 py-0.5 rounded-full text-[9px] font-bold uppercase shrink-0 border",
            account.urlReputation?.safe ?? true
              ? "bg-[#3DDC97]/15 text-[#3DDC97] border-[#3DDC97]/40"
              : "bg-[#FF3D8B]/20 text-[#FF5C7C] border-[#FF3D8B]/50 animate-pulse"
          )}>
            {account.urlReputation?.safe ?? true ? "SAFE BROWSING: CLEAN" : "SAFE BROWSING: THREAT DETECTED"}
          </span>
        </div>
      )}

      {/* 6. CRYPTOGRAPHIC EVIDENCE CHAIN SEAL FOOTER */}
      <div className="pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-[#A9B9E0]">
        <button
          onClick={handleCopyHash}
          className="flex items-center gap-1.5 hover:text-[#12D8C4] transition-colors cursor-pointer"
          title="Click to copy SHA-256 evidence digest"
        >
          <Fingerprint className="w-3.5 h-3.5 text-[#12D8C4]" />
          <span>SHA-256: {account.evidenceHash.substring(0, 16)}...</span>
          {copiedHash ? <Check className="w-3 h-3 text-[#3DDC97]" /> : <Copy className="w-3 h-3 opacity-60" />}
        </button>

        <span className="text-[#7A4DFF]">
          Section 79(3)(b) IT Act • Legally Chained
        </span>
      </div>
    </div>
  );
};
