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
      // Do not trigger if typing in an input
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
    // Compress row out of table (height to 0, 240ms)
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
    <div className="relative border border-line rounded-panel bg-raised overflow-hidden select-none">
      <div className="overflow-x-auto max-h-[580px] overflow-y-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead className="sticky top-0 bg-sunken/90 backdrop-blur z-10 text-2xs uppercase font-mono text-txt-muted border-b border-line">
            <tr>
              <th className="p-3 w-10 text-center">
                <input
                  type="checkbox"
                  aria-label="Select all rows"
                  checked={selectedIds.size > 0 && selectedIds.size === sortedAccounts.length}
                  onChange={toggleSelectAll}
                  className="rounded-input border-line text-teal focus:ring-teal cursor-pointer"
                />
              </th>
              <th className="p-3 font-medium">Target Handle & Name</th>
              <th className="p-3 font-medium">Platform</th>
              <th
                className="p-3 font-medium cursor-pointer hover:text-txt"
                onClick={() => {
                  if (sortField === 'score') setSortAsc(!sortAsc);
                  else { setSortField('score'); setSortAsc(false); }
                }}
              >
                <div className="flex items-center gap-1">
                  <span>Risk Band</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                className="p-3 font-medium cursor-pointer hover:text-txt"
                onClick={() => {
                  if (sortField === 'followers') setSortAsc(!sortAsc);
                  else { setSortField('followers'); setSortAsc(false); }
                }}
              >
                <div className="flex items-center gap-1">
                  <span>Followers</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                className="p-3 font-medium cursor-pointer hover:text-txt"
                onClick={() => {
                  if (sortField === 'slaDueMinutes') setSortAsc(!sortAsc);
                  else { setSortField('slaDueMinutes'); setSortAsc(true); }
                }}
              >
                <div className="flex items-center gap-1">
                  <span>SLA Countdown</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="p-3 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line text-xs font-sans">
            {sortedAccounts.map((account, index) => {
              const isSelected = selectedIds.has(account.id);
              const isFocused = focusedIndex === index;
              const isRemoving = removingIds.has(account.id);

              return (
                <tr
                  key={account.id}
                  onClick={() => handleRowClick(account, index)}
                  className={clsx(
                    "group transition-all cursor-pointer",
                    isSelected ? "bg-teal/10" : isFocused ? "bg-sunken/60" : "hover:bg-sunken/30",
                    isRemoving ? "opacity-0 h-0 overflow-hidden scale-y-0 duration-240" : "h-12 duration-90"
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
                      className="rounded-input border-line text-teal focus:ring-teal cursor-pointer"
                    />
                  </td>
                  <td className="p-3">
                    <div className="flex flex-col">
                      <span className="font-mono font-semibold text-txt group-hover:text-teal transition-colors">
                        @{account.handle}
                      </span>
                      <span className="text-2xs text-txt-muted truncate max-w-[200px]">
                        {account.name}
                      </span>
                    </div>
                  </td>
                  <td className="p-3">
                    <span className="uppercase font-mono text-2xs text-txt-muted px-1.5 py-0.5 rounded-chip bg-sunken border border-line">
                      {account.platform}
                    </span>
                  </td>
                  <td className="p-3">
                    <RiskBadge band={account.band} score={account.score} />
                  </td>
                  <td className="p-3 font-mono tabular-nums text-txt-muted">
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

      {/* Bulk action bar slides up 12px when rows selected */}
      {showBulkBar && selectedIds.size > 0 && (
        <div
          className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-raised border border-teal shadow-2xl rounded-modal px-4 py-2.5 flex items-center gap-4 z-20 animate-in slide-in-from-bottom-3 duration-240"
        >
          <span className="text-xs font-mono font-medium text-txt">
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
