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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-line gap-3 select-none">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentScreen('cases')}
            icon={<ArrowLeft className="w-4 h-4" />}
          >
            Back to Cases
          </Button>
          <div>
            <h1 className="text-lg font-semibold text-txt flex items-center gap-2">
              <span className="font-mono text-teal">{currentCase.caseRef}</span>
              <span className="text-xs px-2 py-0.5 rounded-chip bg-sunken border border-line uppercase font-mono">
                {currentCase.status.replace('_', ' ')}
              </span>
            </h1>
            <p className="text-2xs text-txt-muted font-mono">
              Target: {currentCase.targetHandle} • Officer: {currentCase.assignedAnalyst}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <SlaTimer initialMinutes={currentCase.slaDueMinutes} />
          <EvidenceChip hash={currentCase.evidenceSummary.sha256EvidenceHash} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Timeline of Events */}
        <div className="bg-raised border border-line rounded-panel p-5 space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-txt font-mono flex items-center gap-1.5 pb-2 border-b border-line">
            <Clock className="w-3.5 h-3.5 text-teal" />
            <span>Forensic Event Timeline</span>
          </h3>

          <div className="relative border-l-2 border-line ml-3 space-y-6 py-2">
            {currentCase.timeline.map((event, idx) => (
              <div key={idx} className="relative pl-5">
                <span className="absolute -left-[9px] top-0.5 w-4 h-4 rounded-full bg-raised border-2 border-teal flex items-center justify-center" />
                <span className="font-mono text-2xs text-txt-muted block">{event.time}</span>
                <h4 className="text-xs font-semibold text-txt">{event.title}</h4>
                <p className="text-[11px] text-txt-muted mt-0.5">{event.detail}</p>
                <span className="text-[10px] font-mono text-teal mt-1 block">Actor: {event.actor}</span>
              </div>
            ))}
          </div>

          {/* Section 65B Electronic Record Certificate */}
          <div className="mt-4 p-3 bg-sunken rounded-input border border-line text-[11px] text-txt-muted">
            <span className="font-semibold text-txt block mb-0.5 font-mono">Section 65B Electronic Record Certificate</span>
            Certified under the Indian Evidence Act (Bharatiya Sakshya Adhiniyam) by {currentCase.assignedAnalyst}. SHA-256 seal verified.
          </div>
        </div>

        {/* Middle Column: Evidence Package & Notice Preview */}
        <div className="bg-raised border border-line rounded-panel p-5 space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-txt font-mono flex items-center gap-1.5 pb-2 border-b border-line">
            <FileText className="w-3.5 h-3.5 text-teal" />
            <span>Evidence Package & Notice Draft</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-sunken rounded-input border border-line space-y-1">
              <span className="text-[10px] font-mono uppercase text-txt-muted block">Identified Violations</span>
              <ul className="list-disc pl-4 space-y-0.5 text-txt">
                {currentCase.evidenceSummary.identifiedViolations.map((v, i) => (
                  <li key={i}>{v}</li>
                ))}
              </ul>
            </div>

            <div className="p-3 bg-sunken rounded-input border border-line space-y-1 font-mono text-2xs">
              <span className="text-[10px] uppercase text-txt-muted block font-sans">Safe Browsing Intelligence</span>
              <span className="text-risk-high font-semibold">{currentCase.evidenceSummary.safeBrowsingStatus}</span>
            </div>

            <div>
              <span className="text-[10px] font-mono uppercase text-txt-muted block mb-1">Notice Preview</span>
              <div className="p-3 bg-sunken rounded-input border border-line text-[11px] font-mono text-txt leading-relaxed space-y-2">
                <p className="font-semibold text-teal">{currentCase.noticeDraft.section}</p>
                <p className="text-txt-muted">{currentCase.noticeDraft.addressedTo}</p>
                <p className="border-t border-line pt-2 text-txt">{currentCase.noticeDraft.body}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Outcome Form & Appeal Path */}
        <div className="bg-raised border border-line rounded-panel p-5 space-y-5">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-txt font-mono pb-2 border-b border-line mb-3">
              Case Outcome & Nodal Action
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-txt mb-1">
                  Update Stage Status
                </label>
                <select
                  value={outcomeStatus}
                  onChange={(e) => setOutcomeStatus(e.target.value)}
                  className="w-full bg-sunken border border-line rounded-input p-2 text-xs text-txt font-mono focus:border-teal focus:outline-none"
                >
                  <option value="drafted">Drafted</option>
                  <option value="with_nodal_cell">With nodal cell</option>
                  <option value="notice_filed">Notice filed (Transmitted to Platform)</option>
                  <option value="actioned">Actioned (Account Removed)</option>
                  <option value="rejected_appealed">Rejected / Appealed</option>
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
          <div className="pt-4 border-t border-line">
            <h4 className="text-xs font-semibold text-txt mb-1">
              Grievance Appeal Path (Rule 3A Compliance)
            </h4>
            <p className="text-[11px] text-txt-muted mb-3">
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
                  className="w-full bg-sunken border border-line rounded-input p-2 text-xs text-txt font-sans focus:border-teal focus:outline-none"
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
