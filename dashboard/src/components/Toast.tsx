import React from 'react';
import { useApp } from '../lib/state';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useApp();

  return (
    <div
      className="fixed bottom-12 right-6 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none select-none"
      aria-live="polite"
      aria-atomic="true"
    >
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isDanger = toast.type === 'danger';

        return (
          <div
            key={toast.id}
            className="pointer-events-auto flex items-center justify-between gap-3 p-3 bg-raised border border-line rounded-panel shadow-xl text-xs text-txt animate-in slide-in-from-right-4 duration-160"
            role="status"
          >
            <div className="flex items-center gap-2">
              {isSuccess ? (
                <CheckCircle2 className="w-4 h-4 text-teal flex-shrink-0" />
              ) : isDanger ? (
                <AlertCircle className="w-4 h-4 text-risk-high flex-shrink-0" />
              ) : (
                <Info className="w-4 h-4 text-brand-teal flex-shrink-0" />
              )}
              <span className="font-medium">{toast.message}</span>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-txt-muted hover:text-txt p-0.5 rounded-input focus-visible:outline-none"
              aria-label="Dismiss alert"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
