import React, { useState } from 'react';
import { useApp } from '../lib/state';
import { translations } from '../lib/translations';
import { ScanPipeline } from '../components/ScanPipeline';
import { Button } from '../components/Button';
import { Search, UploadCloud, FileImage, ShieldCheck } from 'lucide-react';

export const ScanScreen: React.FC = () => {
  const { language, setCurrentScreen, setSelectedAccountId, accounts } = useApp();
  const t = translations[language];

  const [inputHandle, setInputHandle] = useState<string>('officer_rajesh_8841');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [hasDroppedFile, setHasDroppedFile] = useState<boolean>(false);

  const handleStartScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputHandle.trim()) return;
    setIsScanning(true);
  };

  const handlePipelineComplete = () => {
    // Check if target matches existing mock account or assign first
    const clean = inputHandle.replace('@', '').trim();
    const found = accounts.find((a) => a.handle.toLowerCase() === clean.toLowerCase());
    if (found) {
      setSelectedAccountId(found.id);
    } else {
      setSelectedAccountId("acc-001");
    }
    setCurrentScreen('assessment');
  };

  return (
    <div className="relative min-h-[600px] bg-dot-grid rounded-panel p-4 md:p-8 flex flex-col items-center justify-center">
      {/* Header */}
      <div className="text-center max-w-xl mx-auto mb-8">
        <h1 className="text-2xl font-semibold text-txt tracking-tight">
          {t.scan.title}
        </h1>
        <p className="text-xs text-txt-muted mt-1">
          {t.scan.subtitle}
        </p>
      </div>

      {isScanning ? (
        <ScanPipeline
          targetHandle={inputHandle}
          onComplete={handlePipelineComplete}
        />
      ) : (
        <div className="w-full max-w-2xl bg-raised border border-line rounded-modal shadow-xl p-6 md:p-8 space-y-6">
          <form onSubmit={handleStartScan} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-txt mb-1">
                Target Profile Handle or URL
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={inputHandle}
                  onChange={(e) => setInputHandle(e.target.value)}
                  placeholder={t.scan.inputPlaceholder}
                  className="w-full bg-sunken border border-line rounded-input px-3.5 py-2.5 text-sm text-txt font-mono focus:border-teal focus:outline-none"
                />
                <Search className="w-4 h-4 text-txt-muted absolute right-3.5 top-3" />
              </div>
            </div>

            {/* Drag & Drop Screenshot Placeholder Area */}
            <div>
              <label className="block text-xs font-medium text-txt mb-1">
                Evidentiary Visual Capture (Analyst Screenshot)
              </label>
              <div
                onClick={() => setHasDroppedFile(true)}
                className={`border-2 border-dashed rounded-panel p-6 text-center cursor-pointer transition-colors select-none ${
                  hasDroppedFile
                    ? 'border-teal bg-teal/5'
                    : 'border-line hover:border-txt-muted bg-sunken/40'
                }`}
              >
                {hasDroppedFile ? (
                  <div className="flex flex-col items-center gap-1.5 text-teal">
                    <FileImage className="w-8 h-8" />
                    <span className="text-xs font-semibold">screenshot_evidence_capture_20261116.png</span>
                    <span className="text-[11px] font-mono opacity-80">SHA-256: d8201a4e92b81029c48192a01928471b (Loaded)</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-txt-muted">
                    <UploadCloud className="w-8 h-8 opacity-60" />
                    <span className="text-xs font-medium text-txt">
                      {t.scan.dropzoneText}
                    </span>
                    <span className="text-[10px] opacity-70">
                      PNG, JPEG up to 10MB • Cryptographic SHA-256 seal computed on drop
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Preset Buttons for Testing */}
            <div className="pt-2">
              <span className="text-2xs font-mono uppercase text-txt-muted block mb-1.5">
                Quick Evaluation Presets:
              </span>
              <div className="flex flex-wrap gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setInputHandle('officer_rajesh_8841')}
                  className="px-2.5 py-1 rounded-chip bg-sunken border border-line hover:border-teal text-txt font-mono text-2xs"
                >
                  @officer_rajesh_8841 (HIGH)
                </button>
                <button
                  type="button"
                  onClick={() => setInputHandle('itbp_recruit_2024')}
                  className="px-2.5 py-1 rounded-chip bg-sunken border border-line hover:border-teal text-txt font-mono text-2xs"
                >
                  @itbp_recruit_2024 (HIGH)
                </button>
                <button
                  type="button"
                  onClick={() => setInputHandle('bsf.jawan.fan')}
                  className="px-2.5 py-1 rounded-chip bg-sunken border border-line hover:border-teal text-txt font-mono text-2xs"
                >
                  @bsf.jawan.fan (MEDIUM)
                </button>
                <button
                  type="button"
                  onClick={() => setInputHandle('priya.sharma')}
                  className="px-2.5 py-1 rounded-chip bg-sunken border border-line hover:border-teal text-txt font-mono text-2xs"
                >
                  @priya.sharma (LOW)
                </button>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full mt-4"
              icon={<ShieldCheck className="w-4 h-4" />}
            >
              {t.scan.runScanBtn}
            </Button>
          </form>
        </div>
      )}
    </div>
  );
};
