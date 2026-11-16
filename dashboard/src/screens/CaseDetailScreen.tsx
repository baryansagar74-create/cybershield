import React, { useState } from 'react';
import { useApp } from '../lib/state';
import { EvidenceChip } from '../components/EvidenceChip';
import { SlaTimer } from '../components/SlaTimer';
import { Button } from '../components/Button';
import { 
  FileText, 
  Clock, 
  Send, 
  RotateCcw, 
  CheckCircle2, 
  UserCheck, 
  ShieldCheck, 
  ArrowLeft 
} from 'lucide-react';

export const CaseDetailScreen: React.FC = () => {
  const { selectedCaseId, cases, updateCaseStatus, setCurrentScreen } = useApp();

  const currentCase = cases.find((c) => c.id === selectedCaseId) || cases[0];
  const [outcomeStatus, setOutcomeStatus] = useState<string>(currentCase.status);
  const [appealReasonText, setAppealReasonText] = useState<string>('');
  const [showAppealForm, setShowAppealForm] = useState<boolean>(false);

  const handleUpdateOutcome = () => {
    updateCaseStatus(currentCase.id, outcomeStatus as any);
  };

  const handleFileAppeal = (e: React.FormEvent) => {
    e.preventDefault();
    updateCaseStatus(currentCase.id, 'rejected_appealed');
    setShowAppealForm(false);
  };

  return (
    <div className="space-y-6 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-white/10 gap-3">
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setCurrentScreen('cases')}
            icon={<ArrowLeft className="w-4 h-4" />}
          >
            Back to Cases
          </Button>
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="font-mono text-[#12D8C4] drop-shadow-[0_0_10px_rgba(18,216,196,0.6)]">
                {currentCase.caseRef}
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/10 border border-white/20 uppercase font-mono text-[#FF9F2E]">
                {currentCase.status.replace('_', ' ')}
              </span>
            </h1>
            <p className="text-xs text-[#A9B9E0] font-mono mt-0.5">
              Target: <span className="text-white font-bold">{currentCase.targetHandle}</span> • Officer: {currentCase.assignedAnalyst}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <SlaTimer initialMinutes={currentCase.slaDueMinutes} />
          <EvidenceChip hash={currentCase.evidenceSummary.sha256EvidenceHash} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Column: Timeline of Events */}
        <div className="glass-panel rounded-[20px] p-5 space-y-4 border border-white/15 shadow-[0_16px_40px_rgba(0,0,0,0.35)]">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white font-mono flex items-center gap-2 pb-2 border-b border-white/10">
            <Clock className="w-4 h-4 text-[#12D8C4]" />
            <span>Forensic Event Timeline</span>
          </h3>

          <div className="relative border-l-2 border-white/15 ml-3 space-y-6 py-2">
            {currentCase.timeline.map((event, idx) => (
              <div key={idx} className="relative pl-5">
                <span className="absolute -left-[9px] top-0.5 w-4 h-4 rounded-full bg-[#081230] border-2 border-[#12D8C4] shadow-[0_0_8px_#12D8C4]" />
                <span className="font-mono text-[11px] text-[#A9B9E0] block">{event.time}</span>
                <h4 className="text-xs font-bold text-white mt-0.5">{event.title}</h4>
                <p className="text-[11px] text-[#A9B9E0] mt-0.5">{event.detail}</p>
                <span className="text-[10px] font-mono text-[#12D8C4] mt-1 block">Actor: {event.actor}</span>
              </div>
            ))}
          </div>

          {/* Section 65B Electronic Record Certificate */}
          <div className="mt-4 p-3.5 glass-panel-subtle rounded-[14px] border border-white/10 text-xs text-[#A9B9E0]">
            <span className="font-bold text-white block mb-1 font-mono flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#12D8C4]" />
              Section 65B Electronic Record Certificate
            </span>
            Certified under the Indian Evidence Act (Bharatiya Sakshya Adhiniyam) by {currentCase.assignedAnalyst}. SHA-256 cryptographic chain validated.
          </div>
        </div>

        {/* Middle Column: Evidence Package & Notice Preview */}
        <div className="glass-panel rounded-[20px] p-5 space-y-4 border border-white/15 shadow-[0_16px_40px_rgba(0,0,0,0.35)]">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white font-mono flex items-center gap-2 pb-2 border-b border-white/10">
            <FileText className="w-4 h-4 text-[#FF3D8B]" />
            <span>Evidence Package & Notice Draft</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 glass-panel-subtle rounded-[14px] border border-white/10 space-y-1.5">
              <span className="text-[10px] font-mono uppercase text-[#A9B9E0] block font-bold">Identified Violations</span>
              <ul className="list-disc pl-4 space-y-1 text-white">
                {currentCase.evidenceSummary.identifiedViolations.map((v, i) => (
                  <li key={i}>{v}</li>
                ))}
              </ul>
            </div>

            <div className="p-3.5 glass-panel-subtle rounded-[14px] border border-white/10 space-y-1 font-mono text-xs">
              <span className="text-[10px] uppercase text-[#A9B9E0] block font-sans font-bold">Safe Browsing Intelligence</span>
              <span className="text-[#FF5C7C] font-bold drop-shadow-[0_0_8px_rgba(255,92,124,0.6)]">
                {currentCase.evidenceSummary.safeBrowsingStatus}
              </span>
            </div>

            <div>
              <span className="text-[10px] font-mono uppercase text-[#A9B9E0] block mb-1.5 font-bold">Statutory Notice Preview</span>
              <div className="p-3.5 glass-panel-subtle rounded-[14px] border border-white/15 text-[11px] font-mono text-[#EAF1FF] leading-relaxed space-y-2">
                <p className="font-bold text-[#12D8C4]">{currentCase.noticeDraft.section}</p>
                <p className="text-[#A9B9E0]">{currentCase.noticeDraft.addressedTo}</p>
                <p className="border-t border-white/10 pt-2 text-[#EAF1FF]">{currentCase.noticeDraft.body}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Outcome Form & Appeal Path */}
        <div className="glass-panel rounded-[20px] p-5 space-y-5 border border-white/15 shadow-[0_16px_40px_rgba(0,0,0,0.35)]">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white font-mono pb-2 border-b border-white/10 mb-3">
              Case Outcome & Nodal Action
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#A9B9E0] mb-1.5">
                  Update Stage Status
                </label>
                <select
                  value={outcomeStatus}
                  onChange={(e) => setOutcomeStatus(e.target.value)}
                  className="w-full glass-input rounded-[12px] p-2.5 text-xs text-white font-mono focus:border-[#12D8C4] focus:outline-none"
                >
                  <option value="drafted" className="bg-[#081230]">Drafted</option>
                  <option value="with_nodal_cell" className="bg-[#081230]">With nodal cell</option>
                  <option value="notice_filed" className="bg-[#081230]">Notice filed (Transmitted to Platform)</option>
                  <option value="actioned" className="bg-[#081230]">Actioned (Account Removed)</option>
                  <option value="rejected_appealed" className="bg-[#081230]">Rejected / Appealed</option>
                </select>
              </div>

              <Button
                variant="primary"
                size="sm"
                className="w-full"
                onClick={handleUpdateOutcome}
                icon={<CheckCircle2 className="w-3.5 h-3.5" />}
              >
                Apply Case Status
              </Button>
            </div>
          </div>

          {/* Appeal Path for Wrongly Flagged Genuine Users */}
          <div className="pt-4 border-t border-white/10">
            <h4 className="text-xs font-bold text-white mb-1">
              Grievance Appeal Path (Rule 3A Compliance)
            </h4>
            <p className="text-xs text-[#A9B9E0] mb-3">
              If an account owner submits counter-evidence or is verified genuine, initiate judicial appellate dismissal.
            </p>

            {showAppealForm ? (
              <form onSubmit={handleFileAppeal} className="space-y-2">
                <textarea
                  rows={3}
                  required
                  placeholder="State basis of appeal or genuine ownership verification..."
                  value={appealReasonText}
                  onChange={(e) => setAppealReasonText(e.target.value)}
                  className="w-full glass-input rounded-[12px] p-2.5 text-xs text-white font-sans focus:border-[#12D8C4] focus:outline-none"
                />
                <div className="flex gap-2">
                  <Button type="submit" variant="danger" size="sm" className="flex-1">
                    Dismiss Case on Appeal
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAppealForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                className="w-full text-xs"
                onClick={() => setShowAppealForm(true)}
                icon={<RotateCcw className="w-3.5 h-3.5" />}
              >
                File Reversal / Civilian Appeal
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
