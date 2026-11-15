import React, { useState } from 'react';
import { useApp } from '../lib/state';
import { CaseStatus, TakedownCase } from '../mock/cases';
import { SlaTimer } from '../components/SlaTimer';
import { Button } from '../components/Button';
import { LayoutGrid, List, ArrowRight, ShieldCheck, Clock } from 'lucide-react';
import { clsx } from 'clsx';

export const CasesScreen: React.FC = () => {
  const { cases, setSelectedCaseId, setCurrentScreen } = useApp();
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');

  const columns: { id: CaseStatus; label: string; count: number }[] = [
    { id: 'drafted', label: "Drafted", count: cases.filter((c) => c.status === 'drafted').length },
    { id: 'with_nodal_cell', label: "With nodal cell", count: cases.filter((c) => c.status === 'with_nodal_cell').length },
    { id: 'notice_filed', label: "Notice filed", count: cases.filter((c) => c.status === 'notice_filed').length },
    { id: 'actioned', label: "Actioned", count: cases.filter((c) => c.status === 'actioned').length },
    { id: 'rejected_appealed', label: "Rejected / appealed", count: cases.filter((c) => c.status === 'rejected_appealed').length },
  ];

  const handleOpenCase = (c: TakedownCase) => {
    setSelectedCaseId(c.id);
    setCurrentScreen('case_detail');
  };

  return (
    <div className="space-y-6">
      {/* Title + Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-line gap-3 select-none">
        <div>
          <h1 className="text-xl font-semibold text-txt tracking-tight">
            Statutory Cases & Docket Tracker
          </h1>
          <p className="text-xs text-txt-muted mt-0.5">
            Section 79(3)(b) Sahyog takedown lifecycle with live IT Rules 2026 statutory countdowns
          </p>
        </div>

        <div className="flex items-center gap-1 bg-sunken border border-line rounded-input p-0.5">
          <button
            onClick={() => setViewMode('kanban')}
            className={clsx(
              "px-2.5 py-1 rounded text-xs font-mono flex items-center gap-1.5 transition-colors",
              viewMode === 'kanban' ? "bg-raised text-txt font-semibold shadow-sm" : "text-txt-muted hover:text-txt"
            )}
            title="Kanban columns"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Kanban</span>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={clsx(
              "px-2.5 py-1 rounded text-xs font-mono flex items-center gap-1.5 transition-colors",
              viewMode === 'list' ? "bg-raised text-txt font-semibold shadow-sm" : "text-txt-muted hover:text-txt"
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
                className="bg-raised border border-line rounded-panel flex flex-col max-h-[720px] overflow-hidden"
              >
                {/* Column Header */}
                <div className="p-3 border-b border-line bg-sunken/40 flex items-center justify-between select-none">
                  <span className="text-xs font-semibold text-txt capitalize">
                    {col.label}
                  </span>
                  <span className="font-mono text-2xs px-1.5 py-0.2 rounded-chip bg-sunken text-txt-muted border border-line font-medium">
                    {col.count}
                  </span>
                </div>

                {/* Cards Container */}
                <div className="p-2 space-y-2.5 overflow-y-auto flex-1">
                  {colCases.length === 0 ? (
                    <div className="py-8 text-center text-2xs text-txt-muted font-mono">
                      No cases in this stage
                    </div>
                  ) : (
                    colCases.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => handleOpenCase(c)}
                        className="p-3 rounded-input bg-sunken border border-line hover:border-teal transition-all cursor-pointer group shadow-sm flex flex-col justify-between space-y-2"
                      >
                        <div>
                          <div className="flex items-center justify-between text-2xs font-mono text-txt-muted mb-1">
                            <span className="font-semibold text-teal">{c.caseRef}</span>
                            <span className="uppercase text-[9px] px-1 bg-raised border border-line rounded">
                              {c.platform}
                            </span>
                          </div>
                          <h4 className="font-semibold text-xs text-txt group-hover:text-teal transition-colors">
                            {c.targetHandle}
                          </h4>
                          <p className="text-[11px] text-txt-muted truncate mt-0.5">
                            {c.targetName}
                          </p>
                        </div>

                        {/* Statutory Basis & SLA Timer */}
                        <div className="pt-2 border-t border-line/60 flex items-center justify-between">
                          <span className="text-[10px] text-txt-muted font-mono truncate max-w-[120px]">
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
        <div className="bg-raised border border-line rounded-panel overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-sunken text-2xs uppercase font-mono text-txt-muted border-b border-line">
              <tr>
                <th className="p-3">Case Reference</th>
                <th className="p-3">Target Handle</th>
                <th className="p-3">Platform</th>
                <th className="p-3">Workflow Status</th>
                <th className="p-3">Statutory SLA</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {cases.map((c) => (
                <tr key={c.id} className="hover:bg-sunken/40 transition-colors cursor-pointer" onClick={() => handleOpenCase(c)}>
                  <td className="p-3 font-mono font-semibold text-teal">{c.caseRef}</td>
                  <td className="p-3 font-mono font-medium text-txt">{c.targetHandle}</td>
                  <td className="p-3 uppercase font-mono text-txt-muted">{c.platform}</td>
                  <td className="p-3 capitalize font-sans">{c.status.replace('_', ' ')}</td>
                  <td className="p-3"><SlaTimer initialMinutes={c.slaDueMinutes} /></td>
                  <td className="p-3 text-right">
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
