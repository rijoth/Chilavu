import React from 'react';
import { LucideIcon, Plus } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionIcon?: LucideIcon;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionIcon,
  onAction,
  className = '',
}) => {
  const ActionIcon = actionIcon || Plus;
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center rounded-2xl bg-surface/50 border border-overlay/60 ${className}`}>
      <div className="w-16 h-16 rounded-2xl bg-overlay flex items-center justify-center text-pine mb-4 shadow-sm">
        <Icon className="w-8 h-8 stroke-[1.75]" />
      </div>
      <h3 className="text-lg font-semibold text-text mb-1">{title}</h3>
      <p className="text-sm text-subtle max-w-xs mb-6 leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-pine hover:bg-pine/90 text-white font-medium text-sm shadow-sm transition active:scale-95 min-h-[44px]"
        >
          <ActionIcon className="w-4 h-4" />
          {actionLabel}
        </button>
      )}
    </div>
  );
};
