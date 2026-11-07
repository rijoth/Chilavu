import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, ChevronRight, User, Tag } from 'lucide-react';
import type { ExpenseWithSummary } from '@/hooks/useExpenses';
import { CurrencyDisplay } from '@/components/common/CurrencyDisplay';
import { ExpenseStatusBadge } from './ExpenseStatusBadge';
import { formatDate } from '@/lib/dates';

interface ExpenseCardProps {
  expense: ExpenseWithSummary;
  currency: string;
}

export const ExpenseCard: React.FC<ExpenseCardProps> = ({ expense, currency }) => {
  const navigate = useNavigate();
  const { summary } = expense;

  const handleClick = () => {
    navigate(`/events/${expense.eventId}/expenses/${expense.id}`);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      className="group rounded-2xl bg-surface border border-overlay hover:border-subtle/50 p-4 shadow-xs transition-all duration-150 hover:shadow-md cursor-pointer active:scale-[0.99] text-left select-none focus:outline-none focus:ring-2 focus:ring-pine/50"
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-base font-bold text-text truncate group-hover:text-pine transition-colors">
              {expense.name}
            </h4>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-subtle mt-0.5">
            {expense.category && (
              <span className="inline-flex items-center gap-1 text-muted">
                <Tag className="w-3 h-3" />
                <span className="capitalize">{expense.category}</span>
              </span>
            )}
            {expense.vendor && (
              <span className="inline-flex items-center gap-1 text-muted">
                <User className="w-3 h-3" />
                <span>{expense.vendor}</span>
              </span>
            )}
            {expense.dueDate && (
              <span className="inline-flex items-center gap-1 text-muted">
                <Calendar className="w-3 h-3" />
                <span>Due {formatDate(expense.dueDate)}</span>
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <ExpenseStatusBadge status={summary.status} size="sm" />
          <ChevronRight className="w-4 h-4 text-muted group-hover:text-text group-hover:translate-x-0.5 transition" />
        </div>
      </div>

      {/* Financial grid */}
      <div className="mt-3 grid grid-cols-3 gap-2 py-2 px-3 rounded-xl bg-overlay/30 border border-overlay/40 text-xs">
        <div>
          <span className="text-subtle block font-medium">Expected</span>
          <CurrencyDisplay
            amount={summary.expected}
            currency={currency}
            className="text-xs sm:text-sm font-bold"
          />
        </div>
        <div>
          <span className="text-subtle block font-medium">Paid</span>
          <CurrencyDisplay
            amount={summary.paid}
            currency={currency}
            highlightStatus="paid"
            className="text-xs sm:text-sm font-bold"
          />
        </div>
        <div className="text-right">
          <span className="text-subtle block font-medium">
            {summary.overpaid > 0 ? 'Overpaid' : 'Pending'}
          </span>
          <CurrencyDisplay
            amount={summary.overpaid > 0 ? summary.overpaid : summary.pending}
            currency={currency}
            highlightStatus={summary.overpaid > 0 ? 'overpaid' : summary.pending > 0 ? 'pending' : 'neutral'}
            className="text-xs sm:text-sm font-bold"
          />
        </div>
      </div>
    </div>
  );
};
