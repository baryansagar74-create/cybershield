import React, { useState, useEffect } from 'react';
import { MockAccount } from '../mock/accounts';
import { RiskBadge } from './RiskBadge';
import { SlaTimer } from './SlaTimer';
import { Button } from './Button';
import { useApp } from '../lib/state';
import { clsx } from 'clsx';
import { ArrowUpDown, Send, Eye } from 'lucide-react';

interface DataTableProps {
  accounts: MockAccount[];
  onSelectAccount?: (account: MockAccount) => void;
  showBulkBar?: boolean;
}

export const DataTable: React.FC<DataTableProps> = ({
  accounts,
  onSelectAccount,
  showBulkBar = true,
}) => {
  const { sendAccountToCell, setSelectedAccountId, setCurrentScreen } = useApp();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [focusedIndex, setFocusedIndex] = useState<number>(0);
  const [sortField, setSortField] = useState<'score' | 'followers' | 'slaDueMinutes'>('score');
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());

  // Sort accounts
  const sortedAccounts = [...accounts].sort((a, b) => {
    let diff = 0;
    if (sortField === 'score') diff = a.score - b.score;
    if (sortField === 'followers') diff = a.followers - b.followers;
    if (sortField === 'slaDueMinutes') diff = a.slaDueMinutes - b.slaDueMinutes;
    return sortAsc ? diff : -diff;
  });

  // J/K keyboard navigation & Enter to open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      if (e.key === 'j' || e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedIndex((prev) => Math.min(sortedAccounts.length - 1, prev + 1));
      } else if (e.key === 'k' || e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedIndex((prev) => Math.max(0, prev - 1));
      } else if (e.key === 'Enter') {
        const target = sortedAccounts[focusedIndex];
        if (target) {
          setSelectedAccountId(target.id);
          if (onSelectAccount) onSelectAccount(target);
          else setCurrentScreen('assessment');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sortedAccounts, focusedIndex, setSelectedAccountId, setCurrentScreen, onSelectAccount]);

  const toggleSelectAll = () => {
    if (selectedIds.size === sortedAccounts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sortedAccounts.map((a) => a.id)));
    }
  };

  const toggleSelectOne = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleSendToCellWithAnimation = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRemovingIds((prev) => new Set(prev).add(id));
    setTimeout(() => {
      sendAccountToCell(id);
    }, 240);
  };

  const handleRowClick = (account: MockAccount, index: number) => {
    setFocusedIndex(index);
    setSelectedAccountId(account.id);
    if (onSelectAccount) onSelectAccount(account);
    else setCurrentScreen('assessment');
  };

  return (
    <div className="relative glass-panel rounded-[20px] overflow-hidden select-none border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
      <div className="overflow-x-auto max-h-[580px] overflow-y-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead className="sticky top-0 bg-[#081230]/90 backdrop-blur-md z-10 text-[11px] uppercase font-mono text-[#A9B9E0] border-b border-white/15">
            <tr>
              <th className="p-3 w-10 text-center">
                <input
                  type="checkbox"
                  aria-label="Select all rows"
                  checked={selectedIds.size > 0 && selectedIds.size === sortedAccounts.length}
                  onChange={toggleSelectAll}
                  className="rounded border-white/30 text-[#12D8C4] focus:ring-[#12D8C4] cursor-pointer bg-white/10"
                />
              </th>
              <th className="p-3 font-semibold text-white">Target Handle & Name</th>
              <th className="p-3 font-semibold text-white">Platform</th>
              <th
                className="p-3 font-semibold text-white cursor-pointer hover:text-[#12D8C4] transition-colors"
                onClick={() => {
                  if (sortField === 'score') setSortAsc(!sortAsc);
                  else { setSortField('score'); setSortAsc(false); }
                }}
              >
                <div className="flex items-center gap-1.5">
                  <span>Risk Band</span>
                  <ArrowUpDown className="w-3.5 h-3.5 text-[#12D8C4]" />
                </div>
              </th>
              <th
                className="p-3 font-semibold text-white cursor-pointer hover:text-[#12D8C4] transition-colors"
                onClick={() => {
                  if (sortField === 'followers') setSortAsc(!sortAsc);
                  else { setSortField('followers'); setSortAsc(false); }
                }}
              >
                <div className="flex items-center gap-1.5">
                  <span>Followers</span>
                  <ArrowUpDown className="w-3.5 h-3.5 text-[#12D8C4]" />
                </div>
              </th>
              <th
                className="p-3 font-semibold text-white cursor-pointer hover:text-[#12D8C4] transition-colors"
                onClick={() => {
                  if (sortField === 'slaDueMinutes') setSortAsc(!sortAsc);
                  else { setSortField('slaDueMinutes'); setSortAsc(true); }
                }}
              >
                <div className="flex items-center gap-1.5">
                  <span>SLA Countdown</span>
                  <ArrowUpDown className="w-3.5 h-3.5 text-[#12D8C4]" />
                </div>
              </th>
              <th className="p-3 font-semibold text-white text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10 text-xs font-sans">
            {sortedAccounts.map((account, index) => {
              const isSelected = selectedIds.has(account.id);
              const isFocused = focusedIndex === index;
              const isRemoving = removingIds.has(account.id);

              return (
                <tr
                  key={account.id}
                  onClick={() => handleRowClick(account, index)}
                  className={clsx(
                    "group transition-all duration-200 cursor-pointer",
                    isSelected 
                      ? "bg-[#12D8C4]/15 border-l-4 border-l-[#12D8C4]" 
                      : isFocused 
                        ? "bg-white/[0.09] border-l-4 border-l-[#FF3D8B]" 
                        : "hover:bg-white/[0.06] hover:translate-x-0.5",
                    isRemoving ? "opacity-0 h-0 overflow-hidden scale-y-0 duration-240" : "h-14 duration-120"
                  )}
                  style={{
                    transformOrigin: 'top',
                    transitionProperty: 'height, opacity, transform, background-color',
                  }}
                  tabIndex={0}
                  aria-selected={isSelected}
                >
                  <td className="p-3 text-center" onClick={(e) => toggleSelectOne(account.id, e)}>
                    <input
                      type="checkbox"
                      aria-label={`Select ${account.handle}`}
                      checked={isSelected}
                      onChange={() => {}}
                      className="rounded border-white/30 text-[#12D8C4] focus:ring-[#12D8C4] cursor-pointer bg-white/10"
                    />
                  </td>
                  <td className="p-3">
                    <div className="flex flex-col">
                      <span className="font-mono font-bold text-white group-hover:text-[#12D8C4] transition-colors text-sm">
                        @{account.handle}
                      </span>
                      <span className="text-[11px] text-[#A9B9E0] truncate max-w-[220px]">
                        {account.name}
                      </span>
                    </div>
                  </td>
                  <td className="p-3">
                    <span className="uppercase font-mono text-[10px] text-white px-2 py-0.5 rounded-full bg-white/10 border border-white/20">
                      {account.platform}
                    </span>
                  </td>
                  <td className="p-3">
                    <RiskBadge band={account.band} score={account.score} />
                  </td>
                  <td className="p-3 font-mono tabular-nums text-[#EAF1FF]">
                    {account.followers.toLocaleString()}
                  </td>
                  <td className="p-3">
                    <SlaTimer initialMinutes={account.slaDueMinutes} />
                  </td>
                  <td className="p-3 text-right space-x-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedAccountId(account.id);
                        if (onSelectAccount) onSelectAccount(account);
                        else setCurrentScreen('assessment');
                      }}
                      icon={<Eye className="w-3.5 h-3.5" />}
                    >
                      Dossier
                    </Button>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={(e) => handleSendToCellWithAnimation(account.id, e)}
                      icon={<Send className="w-3.5 h-3.5" />}
                    >
                      Send to cell
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Bulk action bar */}
      {showBulkBar && selectedIds.size > 0 && (
        <div
          className="absolute bottom-4 left-1/2 -translate-x-1/2 glass-panel border border-[#12D8C4] shadow-[0_12px_40px_rgba(18,216,196,0.45)] rounded-[16px] px-5 py-3 flex items-center gap-4 z-20 backdrop-blur-xl animate-in slide-in-from-bottom-3 duration-200"
        >
          <span className="text-xs font-mono font-bold text-white">
            {selectedIds.size} target{selectedIds.size > 1 ? 's' : ''} selected
          </span>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="primary"
              onClick={() => {
                selectedIds.forEach((id) => sendAccountToCell(id));
                setSelectedIds(new Set());
              }}
            >
              Send selected to nodal cell
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setSelectedIds(new Set())}
            >
              Clear
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
