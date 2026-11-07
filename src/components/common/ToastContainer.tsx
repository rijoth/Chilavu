import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useUIStore();

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 w-full max-w-[min(92vw,480px)] px-4 pointer-events-none"
      style={{ maxWidth: 'min(92vw, 480px)' }}
    >
      {toasts.map((toast) => {
        let icon = <Info className="w-4 h-4 text-iris shrink-0" />;
        let borderClass = 'border-iris/30';

        if (toast.type === 'success') {
          icon = <CheckCircle2 className="w-4 h-4 text-pine shrink-0" />;
          borderClass = 'border-pine/30';
        } else if (toast.type === 'error') {
          icon = <AlertCircle className="w-4 h-4 text-love shrink-0" />;
          borderClass = 'border-love/30';
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between gap-3 p-3.5 rounded-xl bg-surface/95 backdrop-blur-md border ${borderClass} shadow-xl text-sm text-text animate-in fade-in slide-in-from-bottom-2 duration-200`}
            role="alert"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {icon}
              <span className="truncate font-medium">{toast.message}</span>
            </div>
            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              className="p-1 text-muted hover:text-text rounded-md shrink-0 transition-colors"
              aria-label="Dismiss toast"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

