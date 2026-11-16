import React, { useState } from 'react';
import { useApp } from '../lib/state';
import { AuditEntry } from '../mock/auditLogs';
import { EvidenceChip } from '../components/EvidenceChip';
import { Button } from '../components/Button';
import { ShieldCheck, AlertOctagon, Check, Play, RefreshCw, KeyRound, Sparkles } from 'lucide-react';
import { clsx } from 'clsx';

export const AuditLogScreen: React.FC = () => {
  const { auditLogs, simulateTampering, setSimulateTampering, reducedMotion } = useApp();

  const [verifying, setVerifying] = useState<boolean>(false);
  const [verifiedIndices, setVerifiedIndices] = useState<Set<number>>(new Set());
  const [activeScanningIndex, setActiveScanningIndex] = useState<number | null>(null);
  const [brokenIndex, setBrokenIndex] = useState<number | null>(null);

  // If tampering simulated, tampered entry is index 4 (log-005)
  const tamperedIndexTarget = simulateTampering ? 4 : -1;

  const handleVerifyChain = () => {
    setVerifying(true);
    setVerifiedIndices(new Set());
    setBrokenIndex(null);

    if (reducedMotion) {
      if (simulateTampering) {
        setVerifiedIndices(new Set([0, 1, 2, 3]));
        setBrokenIndex(4);
      } else {
        setVerifiedIndices(new Set(auditLogs.map((_, i) => i)));
      }
      setVerifying(false);
      return;
    }

    let currentIndex = 0;

    const runStep = () => {
      setActiveScanningIndex(currentIndex);

      // Check if this row fails
      if (currentIndex === tamperedIndexTarget) {
        setTimeout(() => {
          setActiveScanningIndex(null);
          setBrokenIndex(currentIndex);
          setVerifying(false);
        }, 140);
        return;
      }

      // Successful row: 60ms per row easing out
      setTimeout(() => {
        setVerifiedIndices((prev) => new Set(prev).add(currentIndex));
        currentIndex += 1;

        if (currentIndex < auditLogs.length) {
          runStep();
        } else {
          setActiveScanningIndex(null);
          setVerifying(false);
        }
      }, 70 + currentIndex * 8);
    };

    runStep();
  };

  const handleReset = () => {
    setVerifiedIndices(new Set());
    setActiveScanningIndex(null);
    setBrokenIndex(null);
  };

  return (
    <div className="space-y-6 select-none">
      {/* Title + Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-white/10 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight font-sans">
              Cryptographic Audit Ledger
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#8E6BFF]/20 border border-[#8E6BFF]/40 text-[#CDB9FF] font-mono">
              SECTION 65B BSA
            </span>
          </div>
          <p className="text-xs text-[#A9B9E0] mt-0.5 font-mono">
            Immutable SHA-256 chained evidence trail admissible under Section 65B Indian Evidence Act
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Simulate Tampering Toggle */}
          <label className="flex items-center gap-2 text-xs font-mono text-[#A9B9E0] cursor-pointer select-none glass-panel px-3 py-2 rounded-[14px] border border-white/15">
            <input
              type="checkbox"
              checked={simulateTampering}
              onChange={(e) => {
                setSimulateTampering(e.target.checked);
                handleReset();
              }}
              className="rounded border-white/30 text-[#FF3D8B] focus:ring-[#FF3D8B] bg-white/10"
            />
            <span className={simulateTampering ? "text-[#FF5C7C] font-bold drop-shadow-[0_0_8px_rgba(255,92,124,0.6)]" : "text-white"}>
              Simulate tampering (Entry #5)
            </span>
          </label>

          <Button
            variant="primary"
            size="sm"
            isLoading={verifying}
            onClick={handleVerifyChain}
            icon={<Play className="w-3.5 h-3.5" />}
          >
            Verify chain
          </Button>
        </div>
      </div>

      {/* Broken Chain Alert Banner */}
      {brokenIndex !== null && (
        <div className="p-4 rounded-[18px] bg-[#FF3D8B]/20 border-2 border-[#FF3D8B] text-[#FF5C7C] text-xs space-y-1 shadow-[0_0_25px_rgba(255,61,139,0.4)] animate-in zoom-in-95 duration-200">
          <div className="flex items-center gap-2 font-bold text-sm text-white">
            <AlertOctagon className="w-5 h-5 flex-shrink-0 text-[#FF3D8B]" />
            <span>Cryptographic Chain Verification Failed at Entry #{brokenIndex + 1}</span>
          </div>
          <p className="pl-7 text-[#EAF1FF] leading-relaxed">
            Hash mismatch: The stored <code className="font-mono text-xs font-bold text-[#FF5C7C] bg-black/40 px-1 py-0.5 rounded">prev_hash</code> does not match the computed digest of block #{brokenIndex}. Sequence halted immediately to preserve judicial chain of custody.
          </p>
          <p className="pl-7 text-[#A9B9E0] font-mono text-[11px]">
            Recommendation: File forensic discrepancy alert with Nodal Cyber Command; subsequent entries marked unverified.
          </p>
        </div>
      )}

      {/* Chain Success Banner */}
      {brokenIndex === null && verifiedIndices.size === auditLogs.length && (
        <div className="p-4 rounded-[18px] bg-[#12D8C4]/20 border-2 border-[#12D8C4] text-[#12D8C4] text-xs flex items-center justify-between shadow-[0_0_25px_rgba(18,216,196,0.4)] animate-in zoom-in-95 duration-200">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 flex-shrink-0 text-[#12D8C4]" />
            <div>
              <span className="font-bold text-sm block text-white">Cryptographic Chain Verified: 100% Integrity</span>
              <span className="text-[11px] text-[#A9B9E0]">All {auditLogs.length} blocks traversed from Genesis without modification.</span>
            </div>
          </div>
          <Button size="sm" variant="secondary" onClick={handleReset} icon={<RefreshCw className="w-3.5 h-3.5" />}>
            Reset
          </Button>
        </div>
      )}

      {/* Chained Ledger Table */}
      <div className="glass-panel rounded-[20px] overflow-hidden border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-[#081230]/90 text-[11px] uppercase font-mono text-[#A9B9E0] border-b border-white/15">
              <tr>
                <th className="p-3.5 w-12 text-center font-bold text-white">Status</th>
                <th className="p-3.5 font-bold text-white">Sequence & Action</th>
                <th className="p-3.5 font-bold text-white">Actor</th>
                <th className="p-3.5 font-bold text-white">Target Handle</th>
                <th className="p-3.5 font-bold text-white">Timestamp (UTC)</th>
                <th className="p-3.5 font-bold text-white">Previous Hash (Hn-1)</th>
                <th className="p-3.5 font-bold text-white">Current Hash (Hn)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10 font-mono text-[11px]">
              {auditLogs.map((log, index) => {
                const isVerified = verifiedIndices.has(index);
                const isScanning = activeScanningIndex === index;
                const isBroken = brokenIndex === index;

                return (
                  <tr
                    key={log.id}
                    className={clsx(
                      "relative transition-all duration-150",
                      isBroken && "bg-[#FF3D8B]/25 border-y border-[#FF3D8B]",
                      isScanning && "bg-[#12D8C4]/25 border-y border-[#12D8C4]",
                      isVerified && !isBroken && "bg-[#12D8C4]/5",
                      !isVerified && !isScanning && !isBroken && "hover:bg-white/[0.06]"
                    )}
                  >
                    <td className="p-3.5 text-center">
                      {isBroken ? (
                        <span className="w-5 h-5 rounded-full bg-[#FF3D8B] text-white inline-flex items-center justify-center font-bold text-xs shadow-[0_0_8px_#FF3D8B]">
                          ✕
                        </span>
                      ) : isVerified ? (
                        <span className="w-5 h-5 rounded-full bg-[#12D8C4] text-[#032622] inline-flex items-center justify-center shadow-[0_0_8px_#12D8C4]">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </span>
                      ) : isScanning ? (
                        <span className="w-2.5 h-2.5 rounded-full bg-[#12D8C4] animate-ping inline-block" />
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-white/20 inline-block" />
                      )}
                    </td>

                    <td className="p-3.5">
                      <span className="font-bold text-white block">{log.action}</span>
                      <span className="text-[10px] text-[#A9B9E0] font-mono">{log.id}</span>
                    </td>

                    <td className="p-3.5 font-sans text-xs text-[#EAF1FF]">{log.actor}</td>
                    <td className="p-3.5 text-[#12D8C4] font-bold">{log.targetHandle}</td>
                    <td className="p-3.5 text-[#A9B9E0]">{log.timestamp}</td>
                    
                    {/* Previous Hash with Evidence Chip */}
                    <td className="p-3.5">
                      <EvidenceChip hash={isBroken ? "TAMPERED_BROKEN_DIGEST_HASH_CORRUPT" : log.prevHash} label="Prev" />
                    </td>

                    {/* Current Hash with Evidence Chip */}
                    <td className="p-3.5">
                      <EvidenceChip hash={log.thisHash} label="This" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
