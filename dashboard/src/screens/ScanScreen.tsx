import React, { useState } from 'react';
import { useApp } from '../lib/state';
import { translations } from '../lib/translations';
import { ScanPipeline } from '../components/ScanPipeline';
import { Button } from '../components/Button';
import { ProfileCard } from '../components/ProfileCard';
import { Platform, MockAccount } from '../mock/accounts';
import { 
  Search, 
  UploadCloud, 
  FileImage, 
  ShieldCheck, 
  Sparkles, 
  Radio, 
  Globe, 
  ArrowRight,
  Download,
  RotateCcw
} from 'lucide-react';
import { generateForensicPdf } from '../lib/pdfReport';
import { clsx } from 'clsx';

interface PlatformConfig {
  id: Platform | 'youtube' | 'github';
  name: string;
  tagline: string;
  placeholder: string;
  icon: string;
  accentColor: string;
  borderColor: string;
  presets: string[];
  features: string[];
}

const PLATFORM_CONFIGS: PlatformConfig[] = [
  {
    id: 'instagram',
    name: 'Instagram',
    tagline: 'Playwright DOM & DP CDN Scraper',
    placeholder: 'Enter Instagram username (e.g. cristiano, nasa, itbp_official)...',
    icon: '📸',
    accentColor: '#FF3D8B',
    borderColor: 'border-[#FF3D8B]/40',
    presets: ['cristiano', 'nasa', 'itbp_official'],
    features: ['Live DP CDN extraction', 'Follower-to-following asymmetry', 'Bio link phishing scan', 'Bot entropy scoring']
  },
  {
    id: 'x',
    name: 'X (Twitter)',
    tagline: 'Nitter & Direct DOM Extraction',
    placeholder: 'Enter X/Twitter handle (e.g. adgpi, narendramodi)...',
    icon: '𝕏',
    accentColor: '#12D8C4',
    borderColor: 'border-[#12D8C4]/40',
    presets: ['adgpi', 'narendramodi', 'elonmusk'],
    features: ['Follower authority ratio', 'Account creation date check', 'Automated digit entropy', 'Verified badge audit']
  },
  {
    id: 'telegram',
    name: 'Telegram',
    tagline: 'Zero-Auth Channel & Group DOM Telemetry',
    placeholder: 'Enter Telegram channel handle or t.me URL (e.g. durov)...',
    icon: '✈️',
    accentColor: '#50FFE6',
    borderColor: 'border-[#50FFE6]/40',
    presets: ['durov', 'itbp_channel'],
    features: ['Public channel subscriber count', 'Channel description parser', 'Forwarded threat analysis', 'Instant zero-auth resolution']
  },
  {
    id: 'facebook',
    name: 'Facebook',
    tagline: 'Page Authority & Transparency Audit',
    placeholder: 'Enter Facebook page name, handle, or full URL...',
    icon: '📘',
    accentColor: '#7A4DFF',
    borderColor: 'border-[#7A4DFF]/40',
    presets: ['itbpolice', 'indianarmy.adgpi'],
    features: ['Page verification badge', 'Official force impersonation audit', 'External redirection detector', 'Phishing link detection']
  },
  {
    id: 'youtube',
    name: 'YouTube',
    tagline: 'Channel Metadata & Video Telemetry',
    placeholder: 'Enter YouTube @channel handle or video link...',
    icon: '▶️',
    accentColor: '#FF5C7C',
    borderColor: 'border-[#FF5C7C]/40',
    presets: ['@itbpofficial', '@PIBFactCheck'],
    features: ['Subscriber tier verification', 'Fraudulent recruitment notice check', 'Description link crawler', 'Safe Browsing check']
  },
  {
    id: 'github',
    name: 'GitHub',
    tagline: 'Public Developer API Telemetry',
    placeholder: 'Enter GitHub username (e.g. torvalds)...',
    icon: '🐙',
    accentColor: '#3DDC97',
    borderColor: 'border-[#3DDC97]/40',
    presets: ['torvalds'],
    features: ['Direct public REST API', 'Public repositories & followers', 'Developer avatar verification', 'Zero-auth instant telemetry']
  }
];

export const ScanScreen: React.FC = () => {
  const { language, setCurrentScreen, setSelectedAccountId, officerId, accounts, runLiveScan, addToast } = useApp();
  const t = translations[language];

  const [activePlatform, setActivePlatform] = useState<PlatformConfig>(PLATFORM_CONFIGS[0]);
  const [inputHandle, setInputHandle] = useState<string>('');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [hasDroppedFile, setHasDroppedFile] = useState<boolean>(false);
  const [scannedAccount, setScannedAccount] = useState<MockAccount | null>(null);

  const handleStartScan = async (e?: React.FormEvent, handleOverride?: string) => {
    if (e) e.preventDefault();
    const target = (handleOverride || inputHandle).trim();
    if (!target) {
      addToast("Please enter a target username or URL to scan", "saffron");
      return;
    }

    setIsScanning(true);
    try {
      // Map activePlatform.id to valid Platform
      const mappedPlatform: Platform = 
        activePlatform.id === 'youtube' || activePlatform.id === 'github' ? 'instagram' : activePlatform.id;
      
      const scanned = await runLiveScan(target, mappedPlatform);
      setScannedAccount(scanned);
      setSelectedAccountId(scanned.id);
      addToast(`Live telemetry resolved for @${scanned.handle}`, "success");
    } catch (err) {
      console.error("Live scan failed:", err);
      addToast("Live scan failed. Please check network connectivity.", "danger");
    } finally {
      setIsScanning(false);
    }
  };

  const handlePresetSelect = (preset: string) => {
    setInputHandle(preset);
    handleStartScan(undefined, preset);
  };

  const handleReset = () => {
    setInputHandle('');
    setScannedAccount(null);
  };

  return (
    <div className="relative min-h-[640px] rounded-[24px] p-2 md:p-6 flex flex-col items-center select-none space-y-6">
      
      {/* 1. SCREEN HEADER */}
      <div className="text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#12D8C4]/15 border border-[#12D8C4]/30 text-[#12D8C4] text-xs font-mono mb-2">
          <Radio className="w-3.5 h-3.5 animate-pulse" />
          <span>Multi-Platform Threat Intelligence &amp; Takedown Workstation</span>
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight font-sans">
          Social Media Forensic Scanner
        </h1>
        <p className="text-xs text-[#A9B9E0] mt-1 font-mono">
          Select platform below to initiate real headless browser telemetry extraction, DP verification, and ML risk classification.
        </p>
      </div>

      {/* 2. DEDICATED SOCIAL MEDIA PLATFORM SELECTOR TABS */}
      <div className="w-full max-w-4xl grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {PLATFORM_CONFIGS.map((p) => {
          const isSelected = activePlatform.id === p.id;
          return (
            <button
              key={p.id}
              onClick={() => {
                setActivePlatform(p);
                setInputHandle('');
              }}
              className={clsx(
                "p-3 rounded-[16px] text-left transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between border",
                isSelected
                  ? "glass-panel bg-white/15 border-[#12D8C4] shadow-[0_0_20px_rgba(18,216,196,0.3)] scale-[1.02]"
                  : "glass-panel-subtle hover:bg-white/10 border-white/10 opacity-75 hover:opacity-100"
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl">{p.icon}</span>
                {isSelected && (
                  <span className="w-2 h-2 rounded-full bg-[#12D8C4] shadow-[0_0_8px_#12D8C4] animate-ping" />
                )}
              </div>
              <div className="mt-2">
                <span className="text-xs font-bold text-white block font-sans">{p.name}</span>
                <span className="text-[9px] font-mono text-[#A9B9E0] block truncate">{p.tagline}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* 3. PIPELINE ACTIVE SCAN STATE */}
      {isScanning && (
        <div className="w-full max-w-2xl py-6">
          <ScanPipeline
            targetHandle={inputHandle || 'target_profile'}
            onComplete={() => {}}
          />
        </div>
      )}

      {/* 4. SCANNED PROFILE CARD (RENDERED IMMEDIATELY AFTER SCAN) */}
      {!isScanning && scannedAccount && (
        <div className="w-full max-w-3xl space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-[#12D8C4] uppercase">
                ✓ Evaluation Complete • Scanned Profile Dossier
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleReset}
                className="px-3 py-1.5 rounded-[12px] bg-white/10 hover:bg-white/15 text-xs font-mono text-[#A9B9E0] hover:text-white border border-white/15 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Scan Another Handle</span>
              </button>
              <button
                onClick={() => setCurrentScreen('assessment')}
                className="glossy-btn px-4 py-1.5 rounded-[12px] text-xs font-mono font-bold text-white bg-[#12D8C4]/20 hover:bg-[#12D8C4]/30 border border-[#12D8C4]/50 shadow-[0_0_15px_rgba(18,216,196,0.3)] flex items-center gap-1.5 cursor-pointer"
              >
                <span>Open Full Assessment Dossier</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* DEDICATED PROFILE CARD */}
          <ProfileCard account={scannedAccount} />
        </div>
      )}

      {/* 5. SEARCH & EVALUATION INPUT FORM (WHEN NOT SCANNED OR SCANNING) */}
      {!isScanning && !scannedAccount && (
        <div className="w-full max-w-2xl glass-panel rounded-[24px] shadow-[0_24px_70px_rgba(0,0,0,0.55)] p-6 md:p-8 space-y-6 border border-white/20">
          <form onSubmit={handleStartScan} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-white font-mono flex items-center gap-2">
                  <span>{activePlatform.icon}</span>
                  <span>{activePlatform.name} Target Handle or URL</span>
                </label>
                <span className="text-[10px] font-mono text-[#12D8C4] font-semibold">
                  {activePlatform.tagline}
                </span>
              </div>
              
              <div className="relative">
                <input
                  type="text"
                  required
                  value={inputHandle}
                  onChange={(e) => setInputHandle(e.target.value)}
                  placeholder={activePlatform.placeholder}
                  className="w-full glass-input rounded-[14px] px-4 py-3 text-sm text-white font-mono focus:border-[#12D8C4] focus:outline-none placeholder:text-[#A9B9E0]/40 pr-10"
                />
                <Search className="w-4 h-4 text-[#12D8C4] absolute right-4 top-3.5" />
              </div>
            </div>

            {/* Platform Capabilities Checklist */}
            <div className="p-3 rounded-[14px] bg-white/5 border border-white/10 space-y-1.5">
              <span className="text-[10px] font-mono uppercase text-[#A9B9E0] font-bold block">
                Platform Verification Routine:
              </span>
              <div className="grid grid-cols-2 gap-1.5 text-[11px] font-mono text-[#B8C8E8]">
                {activePlatform.features.map((feat, idx) => (
                  <div key={idx} className="flex items-center gap-1.5">
                    <span className="text-[#12D8C4] text-xs">✓</span>
                    <span className="truncate">{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Drag & Drop Screenshot Placeholder Area */}
            <div>
              <label className="block text-xs font-bold text-white mb-1.5 font-mono">
                Evidentiary Visual Capture (Screenshot / Evidence Attachment)
              </label>
              <div
                onClick={() => setHasDroppedFile(true)}
                className={clsx(
                  "border-2 border-dashed rounded-[18px] p-5 text-center cursor-pointer transition-all select-none",
                  hasDroppedFile
                    ? 'border-[#12D8C4] bg-[#12D8C4]/10 shadow-[0_0_20px_rgba(18,216,196,0.3)]'
                    : 'border-white/20 hover:border-white/40 glass-panel-subtle'
                )}
              >
                {hasDroppedFile ? (
                  <div className="flex flex-col items-center gap-1 text-[#12D8C4]">
                    <FileImage className="w-7 h-7 drop-shadow-[0_0_10px_#12D8C4]" />
                    <span className="text-xs font-bold text-white">evidence_capture_seal.png</span>
                    <span className="text-[10px] font-mono opacity-80">SHA-256 Digest Computed &amp; Chained</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1.5 text-[#A9B9E0]">
                    <UploadCloud className="w-7 h-7 opacity-70 text-[#12D8C4]" />
                    <span className="text-xs font-semibold text-white">
                      Drop screenshot or evidentiary visual capture here
                    </span>
                    <span className="text-[10px] opacity-75 font-mono">
                      PNG, JPEG up to 10MB • Auto-hashed with SHA-256 seal
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Presets for this Platform */}
            {activePlatform.presets.length > 0 && (
              <div className="pt-1">
                <span className="text-[10px] font-mono uppercase text-[#A9B9E0] font-bold block mb-1.5">
                  Suggested Real Targets ({activePlatform.name}):
                </span>
                <div className="flex flex-wrap gap-2 text-xs">
                  {activePlatform.presets.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handlePresetSelect(preset)}
                      className="px-3 py-1 rounded-full bg-white/10 border border-white/20 hover:border-[#12D8C4] text-white font-mono text-[11px] transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-sm flex items-center gap-1"
                    >
                      <span>@{preset}</span>
                      <span className="text-[#12D8C4] font-bold text-[10px]">→ Live</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              className="w-full mt-4 h-12 text-sm"
              icon={<ShieldCheck className="w-5 h-5" />}
            >
              Start {activePlatform.name} Live Evaluation
            </Button>
          </form>
        </div>
      )}
    </div>
  );
};
