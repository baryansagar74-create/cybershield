import React, { useState } from 'react';
import { useApp } from '../lib/state';
import { MockAccount, Platform, RiskBand } from '../mock/accounts';
import { DataTable } from '../components/DataTable';
import { RiskBadge } from '../components/RiskBadge';
import { EvidenceChip } from '../components/EvidenceChip';
import { Button } from '../components/Button';
import { X, ExternalLink, ShieldAlert, Filter, Sparkles } from 'lucide-react';

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
    <div className="space-y-6 select-none">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-white/10 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight font-sans">
              Flagged Target Queue
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FF9F2E]/20 border border-[#FF9F2E]/40 text-[#FFB259] font-mono">
              TRIAGE ACTIVE
            </span>
          </div>
          <p className="text-xs text-[#A9B9E0] mt-0.5 font-mono">
            Full triaged repository with multi-platform filters and side drawer inspection
          </p>
        </div>

        {/* Saved Views Pills */}
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => { setBandFilter('HIGH'); setPlatformFilter('all'); }}
            className={`px-3 py-1.5 rounded-full border text-xs font-mono transition-all cursor-pointer ${
              bandFilter === 'HIGH' 
                ? 'bg-[#FF3D8B]/25 border-[#FF3D8B] text-[#FF5C7C] font-bold shadow-[0_0_12px_rgba(255,61,139,0.5)]' 
                : 'bg-white/10 border-white/20 text-[#A9B9E0] hover:text-white'
            }`}
          >
            High Risk Only
          </button>
          <button
            onClick={() => { setPlatformFilter('instagram'); setBandFilter('all'); }}
            className={`px-3 py-1.5 rounded-full border text-xs font-mono transition-all cursor-pointer ${
              platformFilter === 'instagram' 
                ? 'bg-[#12D8C4]/25 border-[#12D8C4] text-[#12D8C4] font-bold shadow-[0_0_12px_rgba(18,216,196,0.5)]' 
                : 'bg-white/10 border-white/20 text-[#A9B9E0] hover:text-white'
            }`}
          >
            Instagram
          </button>
          <button
            onClick={() => { setPlatformFilter('all'); setBandFilter('all'); setSearchFilter(''); }}
            className="px-3 py-1.5 rounded-full border border-white/20 bg-white/10 text-[#A9B9E0] hover:text-white text-xs font-mono transition-all cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 glass-panel rounded-[20px] p-4 border border-white/15">
        <div>
          <label className="block text-[11px] font-bold text-white mb-1.5 font-mono uppercase">Platform</label>
          <select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
            className="w-full glass-input rounded-[12px] px-3 py-2 text-xs text-white font-mono focus:border-[#12D8C4] focus:outline-none"
          >
            <option value="all" className="bg-[#081230]">All Platforms (IG, FB, X, TG)</option>
            <option value="instagram" className="bg-[#081230]">Instagram</option>
            <option value="facebook" className="bg-[#081230]">Facebook</option>
            <option value="x" className="bg-[#081230]">X (Twitter)</option>
            <option value="telegram" className="bg-[#081230]">Telegram</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-white mb-1.5 font-mono uppercase">Risk Band</label>
          <select
            value={bandFilter}
            onChange={(e) => setBandFilter(e.target.value)}
            className="w-full glass-input rounded-[12px] px-3 py-2 text-xs text-white font-mono focus:border-[#12D8C4] focus:outline-none"
          >
            <option value="all" className="bg-[#081230]">All Risk Bands</option>
            <option value="HIGH" className="bg-[#081230]">HIGH (≥ 0.80)</option>
            <option value="MEDIUM" className="bg-[#081230]">MEDIUM (0.50 - 0.79)</option>
            <option value="LOW" className="bg-[#081230]">LOW (&lt; 0.50)</option>
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="block text-[11px] font-bold text-white mb-1.5 font-mono uppercase">Keyword Search</label>
          <input
            type="text"
            placeholder="Filter by handle, Devanagari text, or threat keywords..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full glass-input rounded-[12px] px-3.5 py-2 text-xs text-white font-sans focus:border-[#12D8C4] focus:outline-none placeholder:text-[#A9B9E0]/50"
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
          className="fixed inset-y-0 right-0 w-full sm:w-96 glass-panel border-l border-white/20 shadow-[0_0_80px_rgba(0,0,0,0.8)] p-6 z-40 flex flex-col justify-between overflow-y-auto backdrop-blur-2xl animate-in slide-in-from-right duration-240"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <span className="text-[11px] font-mono uppercase text-[#12D8C4] font-bold">Profile Inspection Drawer</span>
              <button
                onClick={() => setPreviewAccount(null)}
                className="p-1 rounded-[8px] text-[#A9B9E0] hover:text-white hover:bg-white/10 focus-visible:outline-none cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <RiskBadge band={previewAccount.band} score={previewAccount.score} />
                <span className="uppercase font-mono text-[10px] text-[#12D8C4] font-bold px-2 py-0.5 rounded-full bg-white/10 border border-white/20">
                  {previewAccount.platform}
                </span>
              </div>
              <h3 className="font-bold text-lg text-white leading-tight font-sans">
                {previewAccount.name}
              </h3>
              <p className="font-mono text-xs text-[#A9B9E0] mt-0.5">@{previewAccount.handle}</p>
            </div>

            <div className="p-3.5 glass-panel-subtle rounded-[14px] border border-white/10 text-xs font-sans text-white leading-relaxed">
              {previewAccount.bio}
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-2.5 glass-panel-subtle rounded-[12px] border border-white/10">
                <span className="text-[10px] text-[#A9B9E0] block uppercase font-bold">Followers</span>
                <span className="font-bold text-white text-sm">{previewAccount.followers.toLocaleString()}</span>
              </div>
              <div className="p-2.5 glass-panel-subtle rounded-[12px] border border-white/10">
                <span className="text-[10px] text-[#A9B9E0] block uppercase font-bold">Account Age</span>
                <span className="font-bold text-white text-sm">{previewAccount.accountAgeDays} days</span>
              </div>
            </div>

            <div>
              <span className="text-[10px] font-mono uppercase text-[#A9B9E0] block mb-1 font-bold">Evidence Hash</span>
              <EvidenceChip hash={previewAccount.evidenceHash} />
            </div>
          </div>

          <div className="pt-4 border-t border-white/10 space-y-2.5">
            <Button
              variant="primary"
              className="w-full h-10"
              onClick={() => {
                setSelectedAccountId(previewAccount.id);
                setCurrentScreen('assessment');
              }}
            >
              Open Full Forensic Dossier
            </Button>
            <Button
              variant="secondary"
              className="w-full h-10"
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
