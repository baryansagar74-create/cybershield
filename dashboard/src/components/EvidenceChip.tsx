import React, { useState } from 'react';
import { clsx } from 'clsx';
import { Copy, Check } from 'lucide-react';

interface EvidenceChipProps {
  hash: string;
  label?: string;
  className?: string;
}

export const EvidenceChip: React.FC<EvidenceChipProps> = ({
  hash,
  label = "SHA-256",
  className,
}) => {
  const [copied, setCopied] = useState(false);

  const displayHash = hash.length > 14 ? `${hash.substring(0, 6)}…${hash.substring(hash.length - 6)}` : hash;

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <button
      onClick={handleCopy}
      type="button"
      className={clsx(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-chip text-2xs font-mono bg-sunken hover:bg-raised text-evidence border border-line transition-colors select-none group cursor-pointer focus-visible:outline-none",
        copied && "border-teal text-teal",
        className
      )}
      title={`Click to copy full hash: ${hash}`}
      aria-label={`Copy evidence hash ${hash}`}
    >
      <span className="text-[10px] uppercase font-sans tracking-wider opacity-70">{label}:</span>
      <span className="font-medium text-txt">{copied ? "Copied" : displayHash}</span>
      {copied ? (
        <Check className="w-3 h-3 text-teal animate-in zoom-in-75 duration-150" />
      ) : (
        <Copy className="w-3 h-3 opacity-50 group-hover:opacity-100 transition-opacity" />
      )}
    </button>
  );
};
