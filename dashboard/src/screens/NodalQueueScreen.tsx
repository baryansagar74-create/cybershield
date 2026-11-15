import React, { useState } from 'react';
import { useApp } from '../lib/state';
import { TakedownCase } from '../mock/cases';
import { SlaTimer } from '../components/SlaTimer';
import { Button } from '../components/Button';
import { EvidenceChip } from '../components/EvidenceChip';
import { Scale, CheckCircle2, RotateCcw, FileText, Send } from 'lucide-react';

export const NodalQueueScreen: React.FC = () => {
  const { cases, updateCaseStatus, addToast } = useApp();

  // Nodal queue consists of cases with status 'with_nodal_cell'
  const pendingCases = cases.filter((c) => c.status === 'with_nodal_cell');

  const [selectedCase, setSelectedCase] = useState<TakedownCase | null>(pendingCases[0] || null);

  const handleApproveAndFile = (caseId: string) => {
    updateCaseStatus(caseId, 'notice_filed');
    addToast(`Approved & Filed: Case notice dispatched under Section 79(3)(b)`, "success");
    setSelectedCase(null);
  };

  const handleSendBack = (caseId: string) => {
    updateCaseStatus(caseId, 'drafted');
    addToast(`Sent back: Returned to investigating analyst for supplementary evidence`, "info");
    setSelectedCase(null);
  };

  // Weekly report metrics preview
  const weeklyPending = cases.filter((c) => c.status === 'with_nodal_cell' || c.status === 'drafted').length;
  const weeklyActioned = cases.filter((c) => c.status === 'actioned' || c.status === 'notice_filed').length;
  const weeklyRejected = cases.filter((c) => c.status === 'rejected_appealed').length;

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-line gap-3 select-none">
        <div>
          <h1 className="text-xl font-semibold text-txt tracking-tight flex items-center gap-2">
            <Scale className="w-5 h-5 text-teal" />
            <span>Nodal Officer Authorization Queue</span>
          </h1>
          <p className="text-xs text-txt-muted mt-0.5">
            Confirmed takedown dossiers requiring statutory executive sign-off prior to platform transmission
          </p>
        </div>

        <span className="font-mono text-xs px-2.5 py-1 rounded-chip bg-teal/15 text-teal border border-teal/40 font-semibold">
          {pendingCases.length} Pending Approval
        </span>
      </div>

      {/* Weekly Report Preview Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-raised border border-line rounded-panel p-4">
        <div className="p-3 bg-sunken rounded-input border border-line">
          <span className="text-[10px] uppercase font-mono text-txt-muted block">Weekly Pending Authorization</span>
          <span className="text-xl font-semibold font-mono text-saffron">{weeklyPending} Cases</span>
        </div>
        <div className="p-3 bg-sunken rounded-input border border-line">
          <span className="text-[10px] uppercase font-mono text-txt-muted block">Weekly Actioned & Filed</span>
          <span className="text-xl font-semibold font-mono text-teal">{weeklyActioned} Notices</span>
        </div>
        <div className="p-3 bg-sunken rounded-input border border-line">
          <span className="text-[10px] uppercase font-mono text-txt-muted block">Weekly Dismissed on Appeal</span>
          <span className="text-xl font-semibold font-mono text-txt-muted">{weeklyRejected} Cleared</span>
        </div>
      </div>

      {/* Main Review Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left List of Pending Cases */}
        <div className="lg:col-span-5 bg-raised border border-line rounded-panel p-4 space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-txt font-mono pb-2 border-b border-line">
            Dossiers Awaiting Sign-Off
          </h3>

          {pendingCases.length === 0 ? (
            <div className="py-12 text-center text-xs text-txt-muted font-mono">
              All confirmed dossiers have been actioned. Queue is clear.
            </div>
          ) : (
            pendingCases.map((c) => {
              const isSelected = selectedCase?.id === c.id;

              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedCase(c)}
                  className={`p-3 rounded-input border transition-all cursor-pointer select-none space-y-2 ${
                    isSelected
                      ? 'bg-teal/10 border-teal'
                      : 'bg-sunken hover:bg-sunken/60 border-line'
                  }`}
                >
                  <div className="flex items-center justify-between text-2xs font-mono">
                    <span className="font-semibold text-teal">{c.caseRef}</span>
                    <SlaTimer initialMinutes={c.slaDueMinutes} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-xs text-txt">{c.targetHandle}</h4>
                    <p className="text-[11px] text-txt-muted truncate">{c.targetName}</p>
                  </div>
                  <div className="text-[10px] font-mono text-txt-muted flex justify-between">
                    <span>Analyst: {c.assignedAnalyst}</span>
                    <span className="uppercase text-teal font-semibold">{c.platform}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Dossier Detail & Action Buttons */}
        <div className="lg:col-span-7 bg-raised border border-line rounded-panel p-6 space-y-5">
          {selectedCase ? (
            <>
              <div className="flex items-start justify-between pb-3 border-b border-line">
                <div>
                  <span className="text-[10px] uppercase font-mono text-txt-muted">Selected Docket</span>
                  <h3 className="text-base font-semibold text-txt flex items-center gap-2">
                    <span>{selectedCase.caseRef}</span>
                    <span className="font-mono text-teal">({selectedCase.targetHandle})</span>
                  </h3>
                </div>
                <EvidenceChip hash={selectedCase.evidenceSummary.sha256EvidenceHash} />
              </div>

              {/* Statutory Notice Preview */}
              <div>
                <span className="text-xs font-medium text-txt block mb-1">
                  Draft Notice Transmission Text (Section 79(3)(b))
                </span>
                <div className="p-3 bg-sunken rounded-input border border-line text-xs font-mono text-txt leading-relaxed space-y-2">
                  <p className="font-semibold text-teal">{selectedCase.noticeDraft.addressedTo}</p>
                  <p className="text-txt-muted">{selectedCase.noticeDraft.section}</p>
                  <p className="border-t border-line pt-2 text-txt">{selectedCase.noticeDraft.body}</p>
                </div>
              </div>

              {/* Sign-Off Action Controls */}
              <div className="pt-4 border-t border-line flex flex-col sm:flex-row items-center gap-3">
                <Button
                  variant="primary"
                  className="flex-1 w-full"
                  onClick={() => handleApproveAndFile(selectedCase.id)}
                  icon={<Send className="w-4 h-4" />}
                >
                  Approve and file notice
                </Button>

                <Button
                  variant="secondary"
                  className="flex-1 w-full"
                  onClick={() => handleSendBack(selectedCase.id)}
                  icon={<RotateCcw className="w-4 h-4" />}
                >
                  Send back to analyst
                </Button>
              </div>
            </>
          ) : (
            <div className="py-24 text-center text-xs text-txt-muted font-mono">
              Select a pending dossier from the left list to review evidence and sign off.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
