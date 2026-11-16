import React, { useState } from 'react';
import { useApp } from '../lib/state';
import { CaseStatus, TakedownCase } from '../mock/cases';
import { SlaTimer } from '../components/SlaTimer';
import { Button } from '../components/Button';
import { LayoutGrid, List, ArrowRight, ShieldCheck, Clock, FolderGit2 } from 'lucide-react';
import { clsx } from 'clsx';

export const CasesScreen: React.FC = () => {
  const { cases, setSelectedCaseId, setCurrentScreen } = useApp();
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');

  const columns: { id: CaseStatus; label: string; count: number; dotColor: string }[] = [
    { id: 'drafted', label: "Drafted", count: cases.filter((c) => c.status === 'drafted').length, dotColor: "#12D8C4" },
    { id: 'with_nodal_cell', label: "With nodal cell", count: cases.filter((c) => c.status === 'with_nodal_cell').length, dotColor: "#FF9F2E" },
    { id: 'notice_filed', label: "Notice filed", count: cases.filter((c) => c.status === 'notice_filed').length, dotColor: "#FF3D8B" },
    { id: 'actioned', label: "Actioned", count: cases.filter((c) => c.status === 'actioned').length, dotColor: "#3DDC97" },
    { id: 'rejected_appealed', label: "Rejected / appealed", count: cases.filter((c) => c.status === 'rejected_appealed').length, dotColor: "#8E6BFF" },
  ];

  const handleOpenCase = (c: TakedownCase) => {
    setSelectedCaseId(c.id);
    setCurrentScreen('case_detail');
  };

  return (
    <div className="space-y-6 select-none">
      {/* Title + Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-white/10 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight font-sans">
              Statutory Cases & Docket Tracker
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FF3D8B]/20 border border-[#FF3D8B]/40 text-[#FF5C7C] font-mono">
              SECTION 79(3)(b)
            </span>
          </div>
          <p className="text-xs text-[#A9B9E0] mt-0.5 font-mono">
            Sahyog takedown lifecycle with live IT Rules 2026 statutory countdowns
          </p>
        </div>

        <div className="flex items-center gap-1 glass-panel rounded-[14px] p-1 border border-white/15">
          <button
            onClick={() => setViewMode('kanban')}
            className={clsx(
              "px-3 py-1.5 rounded-[10px] text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer",
              viewMode === 'kanban' 
                ? "bg-gradient-to-r from-[#12D8C4] to-[#0FA79B] text-[#032622] shadow-[0_4px_16px_rgba(18,216,196,0.45)]" 
                : "text-[#A9B9E0] hover:text-white"
            )}
            title="Kanban columns"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Kanban</span>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={clsx(
              "px-3 py-1.5 rounded-[10px] text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer",
              viewMode === 'list' 
                ? "bg-gradient-to-r from-[#12D8C4] to-[#0FA79B] text-[#032622] shadow-[0_4px_16px_rgba(18,216,196,0.45)]" 
                : "text-[#A9B9E0] hover:text-white"
            )}
            title="List view"
          >
            <List className="w-3.5 h-3.5" />
            <span>List</span>
          </button>
        </div>
      </div>

      {viewMode === 'kanban' ? (
        /* Kanban Columns View */
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 overflow-x-auto pb-4">
          {columns.map((col) => {
            const colCases = cases.filter((c) => c.status === col.id);

            return (
              <div
                key={col.id}
                className="glass-panel rounded-[20px] flex flex-col max-h-[720px] overflow-hidden border border-white/15 shadow-[0_16px_40px_rgba(0,0,0,0.35)]"
              >
                {/* Column Header */}
                <div className="p-3.5 border-b border-white/10 bg-white/[0.04] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span 
                      className="w-2.5 h-2.5 rounded-full" 
                      style={{ backgroundColor: col.dotColor, boxShadow: `0 0 10px ${col.dotColor}` }} 
                    />
                    <span className="text-xs font-bold text-white capitalize font-sans">
                      {col.label}
                    </span>
                  </div>
                  <span className="font-mono text-[11px] px-2 py-0.5 rounded-full bg-white/10 text-white font-bold border border-white/20">
                    {col.count}
                  </span>
                </div>

                {/* Cards Container */}
                <div className="p-3 space-y-3 overflow-y-auto flex-1">
                  {colCases.length === 0 ? (
                    <div className="py-12 text-center text-xs text-[#A9B9E0] font-mono">
                      No cases in this stage
                    </div>
                  ) : (
                    colCases.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => handleOpenCase(c)}
                        className="glass-panel-subtle glass-card-hover p-3.5 rounded-[16px] border border-white/15 cursor-pointer group shadow-lg flex flex-col justify-between space-y-2.5"
                      >
                        <div>
                          <div className="flex items-center justify-between text-[11px] font-mono text-[#A9B9E0] mb-1.5">
                            <span className="font-bold text-[#12D8C4] group-hover:drop-shadow-[0_0_8px_rgba(18,216,196,0.6)]">
                              {c.caseRef}
                            </span>
                            <span className="uppercase text-[9px] px-2 py-0.5 bg-white/10 border border-white/20 rounded-full font-mono text-white">
                              {c.platform}
                            </span>
                          </div>
                          <h4 className="font-bold text-sm text-white group-hover:text-[#12D8C4] transition-colors font-mono">
                            {c.targetHandle}
                          </h4>
                          <p className="text-xs text-[#A9B9E0] truncate mt-0.5">
                            {c.targetName}
                          </p>
                        </div>

                        {/* Statutory Basis & SLA Timer */}
                        <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                          <span className="text-[10px] text-[#A9B9E0] font-mono truncate max-w-[110px]">
                            {c.statutoryBasis.split(' ')[0]} {c.statutoryBasis.split(' ')[1]}
                          </span>
                          <SlaTimer initialMinutes={c.slaDueMinutes} />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="glass-panel rounded-[20px] overflow-hidden border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-[#081230]/90 text-[11px] uppercase font-mono text-[#A9B9E0] border-b border-white/15">
              <tr>
                <th className="p-3.5 font-bold text-white">Case Reference</th>
                <th className="p-3.5 font-bold text-white">Target Handle</th>
                <th className="p-3.5 font-bold text-white">Platform</th>
                <th className="p-3.5 font-bold text-white">Workflow Status</th>
                <th className="p-3.5 font-bold text-white">Statutory SLA</th>
                <th className="p-3.5 font-bold text-white text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {cases.map((c) => (
                <tr 
                  key={c.id} 
                  className="hover:bg-white/[0.07] transition-all cursor-pointer" 
                  onClick={() => handleOpenCase(c)}
                >
                  <td className="p-3.5 font-mono font-bold text-[#12D8C4]">{c.caseRef}</td>
                  <td className="p-3.5 font-mono font-bold text-white">{c.targetHandle}</td>
                  <td className="p-3.5 uppercase font-mono text-[#A9B9E0]">{c.platform}</td>
                  <td className="p-3.5 capitalize font-sans text-white">{c.status.replace('_', ' ')}</td>
                  <td className="p-3.5"><SlaTimer initialMinutes={c.slaDueMinutes} /></td>
                  <td className="p-3.5 text-right">
                    <Button size="sm" variant="secondary" onClick={() => handleOpenCase(c)}>
                      View Docket
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
