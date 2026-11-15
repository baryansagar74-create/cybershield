import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#081A33]/70 backdrop-blur-[6px] animate-in fade-in duration-160"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="w-full max-w-lg bg-raised border border-line rounded-modal shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-240"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-line">
          <h3 id="modal-title" className="text-base font-semibold text-txt">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="text-txt-muted hover:text-txt rounded-input p-1 focus-visible:outline-none"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto text-sm text-txt flex-1">
          {children}
        </div>

        {footer && (
          <div className="px-5 py-3.5 bg-sunken/40 border-t border-line flex items-center justify-end gap-2.5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
