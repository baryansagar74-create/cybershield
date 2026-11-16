import React, { useState } from 'react';
import { useApp } from '../lib/state';
import { TakedownCase } from '../mock/cases';
import { SlaTimer } from '../components/SlaTimer';
import { Button } from '../components/Button';
import { EvidenceChip } from '../components/EvidenceChip';
import { Scale, CheckCircle2, RotateCcw, FileText, Send, Sparkles } from 'lucide-react';

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
    <div className="space-y-6 select-none">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-white/10 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight font-sans flex items-center gap-2.5">
              <Scale className="w-6 h-6 text-[#12D8C4]" />
              <span>Nodal Officer Authorization Queue</span>
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#12D8C4]/20 border border-[#12D8C4]/40 text-[#12D8C4] font-mono">
              NODAL DESK ACTIVE
            </span>
          </div>
          <p className="text-xs text-[#A9B9E0] mt-0.5 font-mono">
            Confirmed takedown dossiers requiring statutory executive sign-off prior to platform transmission
          </p>
        </div>

        <span className="font-mono text-xs px-3 py-1 rounded-full bg-[#12D8C4]/20 text-[#12D8C4] border border-[#12D8C4]/40 font-bold shadow-[0_0_12px_rgba(18,216,196,0.4)]">
          {pendingCases.length} Pending Approval
        </span>
      </div>

      {/* Weekly Report Preview Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel glass-card-hover rounded-[18px] p-4 border border-[#FF9F2E]/30 bg-gradient-to-br from-[#FF9F2E]/15 to-transparent">
          <span className="text-[10px] uppercase font-mono text-[#A9B9E0] font-bold block mb-1">Weekly Pending Authorization</span>
          <span className="text-2xl font-bold font-mono text-[#FFB259] drop-shadow-[0_0_10px_rgba(255,159,46,0.6)]">{weeklyPending} Cases</span>
        </div>
        <div className="glass-panel glass-card-hover rounded-[18px] p-4 border border-[#12D8C4]/30 bg-gradient-to-br from-[#12D8C4]/15 to-transparent">
          <span className="text-[10px] uppercase font-mono text-[#A9B9E0] font-bold block mb-1">Weekly Actioned & Filed</span>
          <span className="text-2xl font-bold font-mono text-[#12D8C4] drop-shadow-[0_0_10px_rgba(18,216,196,0.6)]">{weeklyActioned} Notices</span>
        </div>
        <div className="glass-panel glass-card-hover rounded-[18px] p-4 border border-[#8E6BFF]/30 bg-gradient-to-br from-[#8E6BFF]/15 to-transparent">
          <span className="text-[10px] uppercase font-mono text-[#A9B9E0] font-bold block mb-1">Weekly Dismissed on Appeal</span>
          <span className="text-2xl font-bold font-mono text-[#CDB9FF] drop-shadow-[0_0_10px_rgba(142,107,255,0.6)]">{weeklyRejected} Cleared</span>
        </div>
      </div>

      {/* Main Review Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left List of Pending Cases */}
        <div className="lg:col-span-5 glass-panel rounded-[20px] p-4 space-y-3 border border-white/15 shadow-[0_16px_40px_rgba(0,0,0,0.35)]">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white font-mono pb-2 border-b border-white/10 flex items-center justify-between">
            <span>Dossiers Awaiting Sign-Off</span>
            <span className="text-[#12D8C4]">{pendingCases.length}</span>
          </h3>

          {pendingCases.length === 0 ? (
            <div className="py-16 text-center text-xs text-[#A9B9E0] font-mono">
              All confirmed dossiers have been actioned. Queue is clear.
            </div>
          ) : (
            pendingCases.map((c) => {
              const isSelected = selectedCase?.id === c.id;

              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedCase(c)}
                  className={`p-3.5 rounded-[16px] border transition-all cursor-pointer select-none space-y-2 ${
                    isSelected
                      ? 'glass-panel border-[#12D8C4] shadow-[0_0_20px_rgba(18,216,196,0.35)] translate-x-1'
                      : 'glass-panel-subtle hover:bg-white/[0.08] border-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="font-bold text-[#12D8C4]">{c.caseRef}</span>
                    <SlaTimer initialMinutes={c.slaDueMinutes} />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-white font-mono">{c.targetHandle}</h4>
                    <p className="text-[11px] text-[#A9B9E0] truncate">{c.targetName}</p>
                  </div>
                  <div className="text-[10px] font-mono text-[#A9B9E0] flex justify-between pt-1 border-t border-white/10">
                    <span>Analyst: {c.assignedAnalyst}</span>
                    <span className="uppercase text-[#12D8C4] font-bold">{c.platform}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Dossier Detail & Action Buttons */}
        <div className="lg:col-span-7 glass-panel rounded-[20px] p-6 space-y-5 border border-white/15 shadow-[0_16px_40px_rgba(0,0,0,0.35)]">
          {selectedCase ? (
            <>
              <div className="flex items-start justify-between pb-3 border-b border-white/10">
                <div>
                  <span className="text-[10px] uppercase font-mono text-[#A9B9E0] font-bold">Selected Docket</span>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2 mt-0.5">
                    <span>{selectedCase.caseRef}</span>
                    <span className="font-mono text-[#12D8C4]">({selectedCase.targetHandle})</span>
                  </h3>
                </div>
                <EvidenceChip hash={selectedCase.evidenceSummary.sha256EvidenceHash} />
              </div>

              {/* Statutory Notice Preview */}
              <div>
                <span className="text-xs font-bold text-white block mb-1.5 font-mono">
                  Draft Notice Transmission Text (Section 79(3)(b))
                </span>
                <div className="p-4 glass-panel-subtle rounded-[14px] border border-white/15 text-xs font-mono text-[#EAF1FF] leading-relaxed space-y-2">
                  <p className="font-bold text-[#12D8C4]">{selectedCase.noticeDraft.addressedTo}</p>
                  <p className="text-[#A9B9E0]">{selectedCase.noticeDraft.section}</p>
                  <p className="border-t border-white/10 pt-2 text-[#EAF1FF]">{selectedCase.noticeDraft.body}</p>
                </div>
              </div>

              {/* Sign-Off Action Controls */}
              <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center gap-3">
                <Button
                  variant="primary"
                  className="flex-1 w-full"
                  onClick={() => handleApproveAndFile(selectedCase.id)}
                  icon={<Send className="w-4 h-4 text-[#032622]" />}
                >
                  Approve and file notice
                </Button>

                <Button
                  variant="secondary"
                  className="flex-1 w-full"
                  onClick={() => handleSendBack(selectedCase.id)}
                  icon={<RotateCcw className="w-4 h-4 text-[#EAF1FF]" />}
                >
                  Send back to analyst
                </Button>
              </div>
            </>
          ) : (
            <div className="py-24 text-center text-xs text-[#A9B9E0] font-mono">
              Select a pending dossier from the left list to review evidence and sign off.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
