import React, { useState } from 'react';
import { useApp } from '../lib/state';
import { translations } from '../lib/translations';
import { RiskDial } from '../components/RiskDial';
import { RiskBadge } from '../components/RiskBadge';
import { EvidenceChip } from '../components/EvidenceChip';
import { SlaTimer } from '../components/SlaTimer';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { 
  ShieldCheck, 
  AlertTriangle, 
  HelpCircle, 
  ExternalLink, 
  Globe, 
  Image as ImageIcon,
  CheckCircle2,
  FileText
} from 'lucide-react';
import { clsx } from 'clsx';

export const AssessmentScreen: React.FC = () => {
  const { 
    language, 
    selectedAccountId, 
    accounts, 
    confirmAsFake, 
    markAsGenuine, 
    setCurrentScreen 
  } = useApp();
  
  const t = translations[language];

  // Get selected account or fallback to first
  const account = accounts.find((a) => a.id === selectedAccountId) || accounts[0];

  const [confirmModalOpen, setConfirmModalOpen] = useState<boolean>(false);
  const [confirmReason, setConfirmReason] = useState<string>("Active impersonation of uniformed personnel and fraudulent recruitment solicitation.");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [confirmedStamp, setConfirmedStamp] = useState<boolean>(account.status === 'confirmed_fake');

  const handleConfirmAction = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setConfirmModalOpen(false);
      setConfirmedStamp(true);
      confirmAsFake(account.id, confirmReason);
    }, 450);
  };

  const handleMarkGenuineAction = () => {
    markAsGenuine(account.id);
  };

  // Avatar Initials
  const initials = account.name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  return (
    <div className="space-y-6">
      {/* Header bar with Back + Evidence Hash */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-line gap-3 select-none">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentScreen('dashboard')}
          >
            ← Back
          </Button>
          <div>
            <h1 className="text-lg font-semibold text-txt flex items-center gap-2">
              <span>{t.assessment.title}</span>
              <RiskBadge band={account.band} score={account.score} />
            </h1>
            <p className="text-2xs text-txt-muted font-mono">
              Target ID: {account.id} • Evaluated under ITBP Heuristic & ML Standard
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <SlaTimer initialMinutes={account.slaDueMinutes} />
          <EvidenceChip hash={account.evidenceHash} label="Evidentiary Seal" />
        </div>
      </div>

      {/* Main Responsive Grid:
          1440+: 3 Columns (Left: Profile, Center: Dial, Right: Explanations)
          1024: 2 Columns
          390: Single Column with Dial first */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6">
        
        {/* CENTER COLUMN (On Mobile rendered first): Risk Dial Card */}
        <div className="order-1 lg:order-2 lg:col-span-4 bg-raised border border-line rounded-modal p-6 flex flex-col items-center justify-between shadow-sm">
          <div className="w-full text-center pb-2 border-b border-line mb-2">
            <span className="text-2xs font-mono uppercase tracking-wider text-txt-muted">
              Classification Dial
            </span>
          </div>

          <RiskDial score={account.score} band={account.band} />

          <div className="w-full pt-4 border-t border-line text-center text-xs space-y-1">
            <div className="flex justify-between text-2xs text-txt-muted font-mono">
              <span>LOW: 0.00 - 0.49</span>
              <span>MED: 0.50 - 0.79</span>
              <span>HIGH: ≥ 0.80</span>
            </div>
            <p className="text-[11px] text-txt-muted pt-1">
              Calibrated on 10,594 real labelled accounts (InstaFake arXiv / IEEE benchmark).
            </p>
          </div>
        </div>

        {/* LEFT COLUMN: Profile As Captured */}
        <div className="order-2 lg:order-1 lg:col-span-4 bg-raised border border-line rounded-panel p-5 space-y-4">
          <div className="flex items-start justify-between pb-3 border-b border-line">
            <div className="flex items-center gap-3">
              {/* Avatar Initial Placeholder - No Real Photos */}
              <div className="w-12 h-12 rounded-full bg-sunken border border-line flex items-center justify-center font-mono font-bold text-base text-teal select-none">
                {initials}
              </div>
              <div>
                <h3 className="font-semibold text-sm text-txt leading-tight">{account.name}</h3>
                <p className="font-mono text-xs text-txt-muted">@{account.handle}</p>
                <span className="uppercase text-[10px] font-mono text-teal font-medium mt-0.5 inline-block">
                  {account.platform}
                </span>
              </div>
            </div>
          </div>

          {/* Numerical Signals */}
          <div className="grid grid-cols-3 gap-2 text-center py-2 bg-sunken/40 rounded-panel border border-line">
            <div>
              <span className="text-[10px] uppercase font-mono text-txt-muted block">Followers</span>
              <span className="font-mono font-semibold text-xs text-txt">{account.followers.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono text-txt-muted block">Following</span>
              <span className="font-mono font-semibold text-xs text-txt">{account.following.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono text-txt-muted block">Posts</span>
              <span className="font-mono font-semibold text-xs text-txt">{account.posts}</span>
            </div>
          </div>

          {/* Account Age & Digit Density */}
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-line/60">
              <span className="text-txt-muted">Account Age:</span>
              <span className="font-mono text-txt font-medium">{account.accountAgeDays} days active</span>
            </div>
            <div className="flex justify-between py-1 border-b border-line/60">
              <span className="text-txt-muted">Digit Density in Handle:</span>
              <span className="font-mono text-txt font-medium">{account.usernameDigitRatio.toFixed(2)}</span>
            </div>
          </div>

          {/* Bio Text (Devanagari / English) */}
          <div className="pt-1">
            <span className="text-[10px] font-mono uppercase text-txt-muted block mb-1">
              Captured Profile Bio
            </span>
            <div className="p-3 rounded-input bg-sunken/70 border border-line text-xs font-sans text-txt leading-relaxed">
              {account.bio}
            </div>
          </div>

          {/* External Link */}
          {account.link && (
            <div className="pt-1">
              <span className="text-[10px] font-mono uppercase text-txt-muted block mb-1">
                Embedded External Redirection URL
              </span>
              <div className="flex items-center gap-2 p-2 rounded-input bg-sunken border border-line text-xs font-mono text-risk-high truncate">
                <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{account.link}</span>
              </div>
            </div>
          )}

          {/* Screenshot Placeholder with Cryptographic Hash */}
          <div className="pt-2">
            <span className="text-[10px] font-mono uppercase text-txt-muted block mb-1">
              Evidentiary DOM Screenshot Capture
            </span>
            <div className="h-24 rounded-panel bg-sunken border border-dashed border-line flex flex-col items-center justify-center text-txt-muted text-center p-2">
              <ImageIcon className="w-5 h-5 opacity-60 mb-1" />
              <span className="text-[11px] font-mono font-medium">screenshot_{account.handle}.png</span>
              <span className="text-[9px] font-mono opacity-70 truncate max-w-[240px]">
                SHA-256: {account.evidenceHash}
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: "Why this score" (SHAP horizontal bar list + URL Reputation + Image Match) */}
        <div className="order-3 lg:col-span-4 bg-raised border border-line rounded-panel p-5 space-y-5">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-txt font-mono mb-1">
              {t.assessment.whyThisScore}
            </h3>
            <p className="text-[11px] text-txt-muted">
              SHAP-style local feature attribution. Green pulls toward genuine, Red pushes toward fake.
            </p>
          </div>

          {/* SHAP-style Horizontal Bar List */}
          <div className="space-y-3">
            {account.contributingFeatures.map((feat, i) => {
              const isPositiveFake = feat.weight > 0;
              const barWidth = Math.min(100, Math.abs(feat.weight) * 200);

              return (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-txt">{feat.name}</span>
                    <span className="font-mono text-txt-muted">{feat.value}</span>
                  </div>
                  
                  {/* Diverging Bar */}
                  <div className="h-2 w-full bg-sunken rounded-full overflow-hidden flex items-center">
                    <div
                      className={clsx(
                        "h-full rounded-full transition-all duration-300",
                        isPositiveFake ? "bg-risk-high" : "bg-risk-low"
                      )}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                  
                  <p className="text-[11px] text-txt-muted leading-tight">
                    {feat.explanation}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Link Reputation Result */}
          <div className="pt-2 border-t border-line">
            <span className="text-[10px] font-mono uppercase text-txt-muted block mb-1">
              Google Safe Browsing & Link Reputation
            </span>
            <div className="p-3 rounded-input bg-sunken/60 border border-line flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-teal" />
                <span>
                  {account.urlReputation.safe
                    ? "Clean / No threat matches"
                    : `Threats: ${account.urlReputation.threats.join(', ')}`}
                </span>
              </div>
              <span className={clsx("font-mono text-2xs font-semibold", account.urlReputation.safe ? "text-teal" : "text-risk-high")}>
                {account.urlReputation.safe ? "SAFE" : "MALICIOUS"}
              </span>
            </div>
          </div>

          {/* Perceptual Image Match Result */}
          <div className="pt-2 border-t border-line">
            <span className="text-[10px] font-mono uppercase text-txt-muted block mb-1">
              Perceptual Hash Emblem Match (pHash DCT)
            </span>
            <div className="p-3 rounded-input bg-sunken/60 border border-line flex items-center justify-between text-xs">
              <div>
                <span className="font-medium block text-txt">
                  {account.imageMatch.matchedInsignia}
                </span>
                <span className="text-[10px] font-mono text-txt-muted">
                  Hamming Distance: {account.imageMatch.distance} (Threshold ≤ 10)
                </span>
              </div>
              <span className={clsx("font-mono text-2xs font-semibold", account.imageMatch.isTheft ? "text-risk-high" : "text-teal")}>
                {account.imageMatch.isTheft ? "THEFT MATCH" : "DISTINCT"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM DECISION BAR:
          Pinned to bottom on phone, sticky/fixed container */}
      <div className="sticky bottom-8 bg-raised border border-line rounded-modal p-4 shadow-xl z-20 flex flex-col sm:flex-row items-center justify-between gap-3">
        {confirmedStamp ? (
          <div className="w-full flex items-center justify-between bg-risk-high/15 border border-risk-high/40 rounded-panel px-4 py-2 text-risk-high font-mono text-xs font-semibold">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              CONFIRMED AS FAKE • Case docket forwarded to Nodal Cell queue
            </span>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setCurrentScreen('cases')}
            >
              View in Cases
            </Button>
          </div>
        ) : (
          <>
            <div className="text-xs text-txt-muted">
              <span className="font-semibold text-txt">Analyst Discretion:</span> Select forensic outcome to seal evidence.
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Button
                variant="danger"
                size="md"
                onClick={() => setConfirmModalOpen(true)}
                icon={<AlertTriangle className="w-4 h-4" />}
                className="flex-1 sm:flex-initial"
              >
                {t.assessment.confirmFake}
              </Button>

              <Button
                variant="primary"
                size="md"
                onClick={handleMarkGenuineAction}
                icon={<ShieldCheck className="w-4 h-4" />}
                className="flex-1 sm:flex-initial"
              >
                {t.assessment.markGenuine}
              </Button>

              <Button
                variant="secondary"
                size="md"
                onClick={() => {
                  setCurrentScreen('dashboard');
                }}
                icon={<HelpCircle className="w-4 h-4" />}
                className="hidden md:inline-flex"
              >
                {t.assessment.needEvidence}
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Confirm As Fake Modal (Requires Reason & Shows Draft Notice) */}
      <Modal
        isOpen={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        title="Confirm Account as Fake & Draft Notice"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setConfirmModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              isLoading={isSubmitting}
              onClick={handleConfirmAction}
            >
              Confirm & Forward to Nodal Cell
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="p-3 rounded-input bg-risk-high/10 border border-risk-high/30 text-xs text-risk-high">
            <span className="font-semibold">Notice:</span> Confirming will seal the SHA-256 evidence package and generate a formal Section 79(3)(b) IT Act takedown docket.
          </div>

          <div>
            <label className="block text-xs font-medium text-txt mb-1">
              Statutory Justification Reason (Required)
            </label>
            <textarea
              rows={3}
              required
              value={confirmReason}
              onChange={(e) => setConfirmReason(e.target.value)}
              className="w-full bg-sunken border border-line rounded-input p-2.5 text-xs text-txt font-sans focus:border-teal focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-txt mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-teal" />
              <span>Draft Notice Preview (Section 79(3)(b) & Rule 3(1)(d))</span>
            </label>
            <div className="p-3 rounded-input bg-sunken font-mono text-[11px] text-txt-muted border border-line leading-relaxed max-h-40 overflow-y-auto">
              <p className="font-semibold text-txt">TO: Resident Grievance Officer, {account.platform.toUpperCase()} Legal Operations</p>
              <p className="mt-1">RE: Formal Notice under Section 79(3)(b) of the Information Technology Act, 2000</p>
              <p className="mt-2 text-txt">TARGET: @{account.handle} (SHA-256 Digest: {account.evidenceHash})</p>
              <p className="mt-1">REASON: {confirmReason}</p>
              <p className="mt-2">You are hereby called upon to remove / disable access to the aforementioned account within the statutory deadline of 36 hours pursuant to IT (Intermediary Guidelines) Rules 2026.</p>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};
