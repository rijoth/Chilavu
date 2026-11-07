import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, ChevronRight } from 'lucide-react';
import type { EventWithSummary } from '@/hooks/useEvents';
import { formatDate } from '@/lib/dates';
import { CurrencyDisplay } from '@/components/common/CurrencyDisplay';

interface EventCardProps {
  event: EventWithSummary;
}

export const EventCard: React.FC<EventCardProps> = ({ event }) => {
  const navigate = useNavigate();
  const { summary } = event;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => navigate(`/events/${event.id}`)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          navigate(`/events/${event.id}`);
        }
      }}
      className="group relative rounded-2xl bg-surface border border-overlay hover:border-subtle/50 p-5 shadow-xs transition-all duration-200 hover:shadow-md cursor-pointer active:scale-[0.99] text-left select-none focus:outline-none focus:ring-2 focus:ring-pine/50"
    >
      {/* Top Header */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0">
          <h3 className="text-base sm:text-lg font-bold text-text truncate group-hover:text-pine transition-colors">
            {event.name}
          </h3>
          <div className="flex items-center gap-2 text-xs text-subtle mt-0.5">
            {event.eventDate && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {formatDate(event.eventDate)}
              </span>
            )}
            {event.eventDate && <span>·</span>}
            <span className="font-semibold text-muted tracking-wider">{event.currency}</span>
            {event.budgetAmount !== undefined && (
              <>
                <span>·</span>
                <span className="truncate">
                  Budget: <CurrencyDisplay amount={event.budgetAmount} currency={event.currency} />
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
              summary.pending === 0 && summary.committed > 0
                ? 'bg-foam/15 text-foam'
                : 'bg-overlay text-subtle'
            }`}
          >
            {summary.pending === 0 && summary.committed > 0 ? 'Settled' : 'Active'}
          </span>
          <ChevronRight className="w-4 h-4 text-muted group-hover:text-text group-hover:translate-x-0.5 transition" />
        </div>
      </div>

      {/* Main Metric: Committed Expenses */}
      <div className="mt-4 pt-3 border-t border-overlay/60">
        <div className="text-xs text-subtle uppercase tracking-wider mb-1 font-medium">
          Committed Expenses
        </div>
        <div className="text-xl sm:text-2xl font-bold font-mono text-text">
          <CurrencyDisplay amount={summary.committed} currency={event.currency} />
        </div>
      </div>

      {/* Sub Metrics: Paid vs Outstanding */}
      <div className="mt-3 grid grid-cols-2 gap-2 text-sm bg-overlay/40 rounded-xl p-3 border border-overlay/40">
        <div>
          <span className="text-xs text-subtle block mb-0.5">Paid</span>
          <CurrencyDisplay
            amount={summary.paid}
            currency={event.currency}
            highlightStatus="paid"
            className="text-sm font-bold"
          />
        </div>
        <div className="text-right">
          <span className="text-xs text-subtle block mb-0.5">Outstanding</span>
          <CurrencyDisplay
            amount={summary.pending}
            currency={event.currency}
            highlightStatus={summary.pending > 0 ? 'pending' : 'neutral'}
            className="text-sm font-bold"
          />
        </div>
      </div>

      {/* Payment Progress Bar */}
      <div className="mt-4">
        <div className="flex justify-between items-center text-xs text-subtle mb-1.5">
          <span>Payment Progress</span>
          <span className="font-mono font-medium text-text">{summary.paymentProgress}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-overlay overflow-hidden">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              summary.paymentProgress >= 100
                ? 'bg-foam'
                : summary.paymentProgress > 0
                ? 'bg-gold'
                : 'bg-muted'
            }`}
            style={{ width: `${Math.min(100, Math.max(0, summary.paymentProgress))}%` }}
          />
        </div>
      </div>
    </div>
  );
};
