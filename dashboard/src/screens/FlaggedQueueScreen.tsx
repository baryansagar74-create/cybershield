import React, { useState } from 'react';
import { useApp } from '../lib/state';
import { MockAccount, Platform, RiskBand } from '../mock/accounts';
import { DataTable } from '../components/DataTable';
import { RiskBadge } from '../components/RiskBadge';
import { EvidenceChip } from '../components/EvidenceChip';
import { Button } from '../components/Button';
import { X, ExternalLink, ShieldAlert, Filter } from 'lucide-react';

export const FlaggedQueueScreen: React.FC = () => {
  const { accounts, setSelectedAccountId, setCurrentScreen } = useApp();

  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [bandFilter, setBandFilter] = useState<string>('all');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [previewAccount, setPreviewAccount] = useState<MockAccount | null>(null);

  // Filter accounts
  const filteredAccounts = accounts.filter((a) => {
    if (platformFilter !== 'all' && a.platform !== platformFilter) return false;
    if (bandFilter !== 'all' && a.band !== bandFilter) return false;
    if (searchFilter) {
      const q = searchFilter.toLowerCase();
      const matchHandle = a.handle.toLowerCase().includes(q);
      const matchName = a.name.toLowerCase().includes(q);
      const matchBio = a.bio.toLowerCase().includes(q);
      if (!matchHandle && !matchName && !matchBio) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-line gap-3">
        <div>
          <h1 className="text-xl font-semibold text-txt tracking-tight">
            Flagged Queue
          </h1>
          <p className="text-xs text-txt-muted mt-0.5">
            Full triaged repository with multi-platform filters and side drawer inspection
          </p>
        </div>

        {/* Saved Views Pills */}
        <div className="flex items-center gap-1.5 text-xs">
          <button
            onClick={() => { setBandFilter('HIGH'); setPlatformFilter('all'); }}
            className={`px-2.5 py-1 rounded-chip border text-xs font-mono select-none ${
              bandFilter === 'HIGH' ? 'bg-risk-high/15 border-risk-high text-risk-high font-semibold' : 'bg-sunken border-line text-txt-muted hover:text-txt'
            }`}
          >
            High Risk Only
          </button>
          <button
            onClick={() => { setPlatformFilter('instagram'); setBandFilter('all'); }}
            className={`px-2.5 py-1 rounded-chip border text-xs font-mono select-none ${
              platformFilter === 'instagram' ? 'bg-teal/15 border-teal text-teal font-semibold' : 'bg-sunken border-line text-txt-muted hover:text-txt'
            }`}
          >
            Instagram
          </button>
          <button
            onClick={() => { setPlatformFilter('all'); setBandFilter('all'); setSearchFilter(''); }}
            className="px-2.5 py-1 rounded-chip border border-line bg-sunken text-txt-muted hover:text-txt text-xs font-mono select-none"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-raised border border-line rounded-panel p-3">
        <div>
          <label className="block text-[11px] font-medium text-txt-muted mb-1 font-mono uppercase">Platform</label>
          <select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
            className="w-full bg-sunken border border-line rounded-input px-2.5 py-1.5 text-xs text-txt font-mono focus:border-teal focus:outline-none"
          >
            <option value="all">All Platforms (IG, FB, X, TG)</option>
            <option value="instagram">Instagram</option>
            <option value="facebook">Facebook</option>
            <option value="x">X (Twitter)</option>
            <option value="telegram">Telegram</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-medium text-txt-muted mb-1 font-mono uppercase">Risk Band</label>
          <select
            value={bandFilter}
            onChange={(e) => setBandFilter(e.target.value)}
            className="w-full bg-sunken border border-line rounded-input px-2.5 py-1.5 text-xs text-txt font-mono focus:border-teal focus:outline-none"
          >
            <option value="all">All Risk Bands</option>
            <option value="HIGH">HIGH (≥ 0.80)</option>
            <option value="MEDIUM">MEDIUM (0.50 - 0.79)</option>
            <option value="LOW">LOW (&lt; 0.50)</option>
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="block text-[11px] font-medium text-txt-muted mb-1 font-mono uppercase">Keyword Search</label>
          <input
            type="text"
            placeholder="Filter by handle, Devanagari text, or keywords..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full bg-sunken border border-line rounded-input px-3 py-1.5 text-xs text-txt font-sans focus:border-teal focus:outline-none"
          />
        </div>
      </div>

      {/* Data Table */}
      <div className="relative">
        <DataTable
          accounts={filteredAccounts}
          onSelectAccount={(acc) => setPreviewAccount(acc)}
        />
      </div>

      {/* Side Drawer Preview on Row Focus */}
      {previewAccount && (
        <div
          className="fixed inset-y-0 right-0 w-full sm:w-96 bg-raised border-l border-line shadow-2xl p-6 z-40 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-240"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-line">
              <span className="text-2xs font-mono uppercase text-txt-muted">Profile Inspection Drawer</span>
              <button
                onClick={() => setPreviewAccount(null)}
                className="p-1 rounded-input text-txt-muted hover:text-txt focus-visible:outline-none"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <RiskBadge band={previewAccount.band} score={previewAccount.score} />
                <span className="uppercase font-mono text-2xs text-teal font-medium">
                  {previewAccount.platform}
                </span>
              </div>
              <h3 className="font-semibold text-base text-txt leading-tight">
                {previewAccount.name}
              </h3>
              <p className="font-mono text-xs text-txt-muted">@{previewAccount.handle}</p>
            </div>

            <div className="p-3 bg-sunken rounded-input border border-line text-xs font-sans text-txt leading-relaxed">
              {previewAccount.bio}
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-2 bg-sunken rounded border border-line">
                <span className="text-[10px] text-txt-muted block uppercase">Followers</span>
                <span className="font-semibold text-txt">{previewAccount.followers.toLocaleString()}</span>
              </div>
              <div className="p-2 bg-sunken rounded border border-line">
                <span className="text-[10px] text-txt-muted block uppercase">Age</span>
                <span className="font-semibold text-txt">{previewAccount.accountAgeDays} days</span>
              </div>
            </div>

            <div>
              <span className="text-[10px] font-mono uppercase text-txt-muted block mb-1">Evidence Hash</span>
              <EvidenceChip hash={previewAccount.evidenceHash} />
            </div>
          </div>

          <div className="pt-4 border-t border-line space-y-2">
            <Button
              variant="primary"
              className="w-full"
              onClick={() => {
                setSelectedAccountId(previewAccount.id);
                setCurrentScreen('assessment');
              }}
            >
              Open Full Forensic Dossier
            </Button>
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => setPreviewAccount(null)}
            >
              Close Drawer
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
