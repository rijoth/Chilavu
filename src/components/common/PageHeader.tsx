import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  hasBack?: boolean;
  backTo?: string;
  rightAction?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  hasBack = false,
  backTo,
  rightAction,
}) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (backTo) {
      navigate(backTo);
    } else {
      navigate(-1);
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-base border-b border-overlay/60 px-4 py-3 sm:px-6">
      <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {hasBack && (
            <button
              type="button"
              onClick={handleBack}
              className="p-2 -ml-2 rounded-xl text-subtle hover:text-text hover:bg-surface active:scale-95 transition min-h-[44px] min-w-[44px] flex items-center justify-center shrink-0"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-bold text-text truncate tracking-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="text-xs text-subtle truncate mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>

        {rightAction && (
          <div className="flex items-center gap-1 shrink-0">{rightAction}</div>
        )}
      </div>
    </header>
  );
};
