import React, { useState } from 'react';
import { useApp } from '../lib/state';
import { translations } from '../lib/translations';
import { ScanPipeline } from '../components/ScanPipeline';
import { Button } from '../components/Button';
import { Search, UploadCloud, FileImage, ShieldCheck, Sparkles, Radio } from 'lucide-react';

export const ScanScreen: React.FC = () => {
  const { language, setCurrentScreen, setSelectedAccountId, accounts, runLiveScan } = useApp();
  const t = translations[language];

  const [inputHandle, setInputHandle] = useState<string>('officer_rajesh_8841');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [hasDroppedFile, setHasDroppedFile] = useState<boolean>(false);

  const handleStartScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputHandle.trim()) return;
    setIsScanning(true);
    try {
      const scanned = await runLiveScan(inputHandle.trim());
      setSelectedAccountId(scanned.id);
    } catch (err) {
      console.error("Live scan failed:", err);
    } finally {
      setIsScanning(false);
      setCurrentScreen('assessment');
    }
  };

  const handlePresetClick = async (preset: string) => {
    setInputHandle(preset);
    setIsScanning(true);
    try {
      const scanned = await runLiveScan(preset);
      setSelectedAccountId(scanned.id);
    } catch (err) {
      console.error("Live scan failed:", err);
    } finally {
      setIsScanning(false);
      setCurrentScreen('assessment');
    }
  };

  return (
    <div className="relative min-h-[640px] rounded-[24px] p-4 md:p-8 flex flex-col items-center justify-center select-none">
      {/* Header */}
      <div className="text-center max-w-xl mx-auto mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#12D8C4]/15 border border-[#12D8C4]/30 text-[#12D8C4] text-xs font-mono mb-3">
          <Radio className="w-3.5 h-3.5 animate-pulse" />
          <span>Real-Time Multi-Signal Forensic Scanner</span>
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight font-sans">
          {t.scan.title}
        </h1>
        <p className="text-xs text-[#A9B9E0] mt-1.5 font-mono">
          {t.scan.subtitle}
        </p>
      </div>

      {isScanning ? (
        <ScanPipeline
          targetHandle={inputHandle}
          onComplete={() => setCurrentScreen('assessment')}
        />
      ) : (
        <div className="w-full max-w-2xl glass-panel rounded-[24px] shadow-[0_24px_70px_rgba(0,0,0,0.55)] p-6 md:p-8 space-y-6 border border-white/20">
          <form onSubmit={handleStartScan} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-white mb-1.5 font-mono">
                Target Profile Handle or URL
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={inputHandle}
                  onChange={(e) => setInputHandle(e.target.value)}
                  placeholder={t.scan.inputPlaceholder}
                  className="w-full glass-input rounded-[14px] px-4 py-3 text-sm text-white font-mono focus:border-[#12D8C4] focus:outline-none placeholder:text-[#A9B9E0]/50"
                />
                <Search className="w-4 h-4 text-[#12D8C4] absolute right-4 top-3.5" />
              </div>
            </div>

            {/* Drag & Drop Screenshot Placeholder Area */}
            <div>
              <label className="block text-xs font-bold text-white mb-1.5 font-mono">
                Evidentiary Visual Capture (Analyst Screenshot)
              </label>
              <div
                onClick={() => setHasDroppedFile(true)}
                className={`border-2 border-dashed rounded-[18px] p-6 text-center cursor-pointer transition-all select-none ${
                  hasDroppedFile
                    ? 'border-[#12D8C4] bg-[#12D8C4]/10 shadow-[0_0_20px_rgba(18,216,196,0.3)]'
                    : 'border-white/20 hover:border-white/40 glass-panel-subtle'
                }`}
              >
                {hasDroppedFile ? (
                  <div className="flex flex-col items-center gap-1.5 text-[#12D8C4]">
                    <FileImage className="w-8 h-8 drop-shadow-[0_0_10px_#12D8C4]" />
                    <span className="text-xs font-bold text-white">screenshot_evidence_capture_20261116.png</span>
                    <span className="text-[11px] font-mono opacity-80">SHA-256: d8201a4e92b81029c48192a01928471b (Loaded)</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-[#A9B9E0]">
                    <UploadCloud className="w-8 h-8 opacity-70 text-[#12D8C4]" />
                    <span className="text-xs font-semibold text-white">
                      {t.scan.dropzoneText}
                    </span>
                    <span className="text-[10px] opacity-75 font-mono">
                      PNG, JPEG up to 10MB • Cryptographic SHA-256 seal computed on drop
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Preset Buttons for Testing */}
            <div className="pt-2">
              <span className="text-[11px] font-mono uppercase text-[#A9B9E0] font-bold block mb-2">
                Quick Evaluation Presets:
              </span>
              <div className="flex flex-wrap gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => handlePresetClick('officer_rajesh_8841')}
                  className="px-3 py-1.5 rounded-full bg-white/10 border border-white/20 hover:border-[#FF3D8B] text-white font-mono text-[11px] transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-sm"
                >
                  @officer_rajesh_8841 <span className="text-[#FF5C7C] font-bold">(HIGH)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handlePresetClick('cristiano')}
                  className="px-3 py-1.5 rounded-full bg-white/10 border border-white/20 hover:border-[#12D8C4] text-white font-mono text-[11px] transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-sm"
                >
                  @cristiano <span className="text-[#12D8C4] font-bold">(GENUINE)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handlePresetClick('itbp_recruit_2024')}
                  className="px-3 py-1.5 rounded-full bg-white/10 border border-white/20 hover:border-[#FF3D8B] text-white font-mono text-[11px] transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-sm"
                >
                  @itbp_recruit_2024 <span className="text-[#FF5C7C] font-bold">(HIGH)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handlePresetClick('nasa')}
                  className="px-3 py-1.5 rounded-full bg-white/10 border border-white/20 hover:border-[#3DDC97] text-white font-mono text-[11px] transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-sm"
                >
                  @nasa <span className="text-[#3DDC97] font-bold">(ORGANIZATION)</span>
                </button>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full mt-4 h-12 text-sm"
              icon={<ShieldCheck className="w-5 h-5" />}
            >
              {t.scan.runScanBtn}
            </Button>
          </form>
        </div>
      )}
    </div>
  );
};
