import React, { useState } from 'react';
import { useApp } from '../lib/state';
import { AuditEntry } from '../mock/auditLogs';
import { EvidenceChip } from '../components/EvidenceChip';
import { Button } from '../components/Button';
import { ShieldCheck, AlertOctagon, Check, Play, RefreshCw } from 'lucide-react';
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
        }, 120);
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
    <div className="space-y-6">
      {/* Title + Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-line gap-3 select-none">
        <div>
          <h1 className="text-xl font-semibold text-txt tracking-tight">
            Cryptographic Audit Ledger
          </h1>
          <p className="text-xs text-txt-muted mt-0.5">
            Immutable SHA-256 chained evidence trail admissible under Section 65B Indian Evidence Act
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Simulate Tampering Toggle */}
          <label className="flex items-center gap-2 text-xs font-mono text-txt-muted cursor-pointer select-none bg-sunken px-2.5 py-1.5 rounded-input border border-line">
            <input
              type="checkbox"
              checked={simulateTampering}
              onChange={(e) => {
                setSimulateTampering(e.target.checked);
                handleReset();
              }}
              className="rounded-input text-teal focus:ring-teal"
            />
            <span className={simulateTampering ? "text-risk-high font-semibold" : ""}>
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
        <div className="p-4 rounded-panel bg-risk-high/15 border-2 border-risk-high text-risk-high text-xs space-y-1 animate-in zoom-in-95 duration-200">
          <div className="flex items-center gap-2 font-semibold text-sm">
            <AlertOctagon className="w-5 h-5 flex-shrink-0" />
            <span>Cryptographic Chain Verification Failed at Entry #{brokenIndex + 1}</span>
          </div>
          <p className="pl-7 text-txt leading-relaxed">
            Hash mismatch: The stored <code className="font-mono text-xs font-bold text-risk-high">prev_hash</code> does not match the computed digest of block #{brokenIndex}. Sequence halted immediately to preserve judicial chain of custody.
          </p>
          <p className="pl-7 text-txt-muted font-mono text-2xs">
            Recommendation: File forensic discrepancy alert with Nodal Cyber Command; subsequent entries marked unverified.
          </p>
        </div>
      )}

      {/* Chain Success Banner */}
      {brokenIndex === null && verifiedIndices.size === auditLogs.length && (
        <div className="p-4 rounded-panel bg-teal/15 border-2 border-teal text-teal text-xs flex items-center justify-between animate-in zoom-in-95 duration-200">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 flex-shrink-0" />
            <div>
              <span className="font-semibold text-sm block">Cryptographic Chain Verified: 100% Integrity</span>
              <span className="text-[11px] opacity-90">All {auditLogs.length} blocks traversed from Genesis without modification.</span>
            </div>
          </div>
          <Button size="sm" variant="secondary" onClick={handleReset} icon={<RefreshCw className="w-3.5 h-3.5" />}>
            Reset
          </Button>
        </div>
      )}

      {/* Chained Ledger Table */}
      <div className="border border-line rounded-panel bg-raised overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-sunken text-2xs uppercase font-mono text-txt-muted border-b border-line select-none">
              <tr>
                <th className="p-3 w-12 text-center">Status</th>
                <th className="p-3">Sequence & Action</th>
                <th className="p-3">Actor</th>
                <th className="p-3">Target Handle</th>
                <th className="p-3">Timestamp (UTC)</th>
                <th className="p-3">Previous Hash (Hn-1)</th>
                <th className="p-3">Current Hash (Hn)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line font-mono text-2xs">
              {auditLogs.map((log, index) => {
                const isVerified = verifiedIndices.has(index);
                const isScanning = activeScanningIndex === index;
                const isBroken = brokenIndex === index;

                return (
                  <tr
                    key={log.id}
                    className={clsx(
                      "relative transition-all duration-150",
                      isBroken && "bg-risk-high/20 border-y-2 border-risk-high",
                      isScanning && "bg-teal/20 border-y-2 border-teal",
                      isVerified && !isBroken && "bg-teal/5",
                      !isVerified && !isScanning && !isBroken && "hover:bg-sunken/40"
                    )}
                  >
                    <td className="p-3 text-center">
                      {isBroken ? (
                        <span className="w-5 h-5 rounded-full bg-risk-high text-white inline-flex items-center justify-center font-bold text-xs">
                          ✕
                        </span>
                      ) : isVerified ? (
                        <span className="w-5 h-5 rounded-full bg-teal text-white inline-flex items-center justify-center">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </span>
                      ) : isScanning ? (
                        <span className="w-2.5 h-2.5 rounded-full bg-teal animate-ping inline-block" />
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-line inline-block" />
                      )}
                    </td>

                    <td className="p-3">
                      <span className="font-bold text-txt block">{log.action}</span>
                      <span className="text-[10px] text-txt-muted opacity-75">{log.id}</span>
                    </td>

                    <td className="p-3 font-sans text-xs text-txt">{log.actor}</td>
                    <td className="p-3 text-teal font-semibold">{log.targetHandle}</td>
                    <td className="p-3 text-txt-muted">{log.timestamp}</td>
                    
                    {/* Previous Hash with Evidence Chip */}
                    <td className="p-3">
                      <EvidenceChip hash={isBroken ? "TAMPERED_BROKEN_DIGEST_HASH_CORRUPT" : log.prevHash} label="Prev" />
                    </td>

                    {/* Current Hash with Evidence Chip */}
                    <td className="p-3">
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
