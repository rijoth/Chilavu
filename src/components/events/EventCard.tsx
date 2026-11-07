import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, CheckCircle2, Clock, Wallet, Calendar } from 'lucide-react';
import type { EventWithSummary } from '@/hooks/useEvents';
import { formatLocalDate } from '@/lib/dates';
import { CurrencyDisplay } from '@/components/common/CurrencyDisplay';

interface EventCardProps {
  event: EventWithSummary;
}

export const EventCard: React.FC<EventCardProps> = ({ event }) => {
  const navigate = useNavigate();
  const { summary } = event;

  const isSettled = summary.pending === 0 && summary.committed > 0 && summary.overpaid === 0;
  const isOverpaid = summary.overpaid > 0;

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
      className="group relative rounded-2xl bg-surface border border-overlay hover:border-subtle/50 p-3.5 sm:p-4 shadow-xs transition-all duration-200 hover:shadow-md cursor-pointer active:scale-[0.99] text-left select-none focus:outline-none focus:ring-2 focus:ring-pine/50"
    >
      {/* Line 1: Name and status on the left, total on the right */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0 flex-wrap sm:flex-nowrap">
          <h3 className="text-sm sm:text-base font-bold text-text truncate group-hover:text-pine transition-colors">
            {event.name}
          </h3>
          {event.eventDate && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted bg-overlay/60 px-2 py-0.5 rounded-md shrink-0">
              <Calendar className="w-3 h-3 text-muted/80" />
              <span>{formatLocalDate(event.eventDate)}</span>
            </span>
          )}
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 ${
              isSettled
                ? 'bg-foam/15 text-foam border border-foam/25'
                : isOverpaid
                ? 'bg-iris/15 text-iris border border-iris/25'
                : 'bg-overlay text-subtle border border-overlay/60'
            }`}
          >
            {isSettled ? (
              <>
                <CheckCircle2 className="w-3 h-3" />
                Settled
              </>
            ) : isOverpaid ? (
              <>
                <Wallet className="w-3 h-3" />
                Overpaid
              </>
            ) : (
              <>
                <Clock className="w-3 h-3" />
                Active
              </>
            )}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <CurrencyDisplay
            amount={summary.committed}
            currency={event.currency}
            className="text-sm sm:text-base font-bold text-text"
          />
          <ChevronRight className="w-4 h-4 text-muted group-hover:text-text group-hover:translate-x-0.5 transition" />
        </div>
      </div>

      {/* Line 2: Hero Progress Bar - placed higher and slightly thicker */}
      <div className="mt-2.5">
        <div className="h-2.5 w-full rounded-full bg-overlay/80 overflow-hidden">
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

      {/* Line 3: "₹3,000 paid · ₹10,222 left" in one line */}
      <div className="flex items-center justify-between gap-2 mt-2 text-xs">
        <div className="flex items-center gap-1.5 text-subtle font-medium truncate">
          <CurrencyDisplay
            amount={summary.paid}
            currency={event.currency}
            highlightStatus="paid"
            className="text-xs font-semibold"
          />
          <span>paid</span>
          <span className="text-muted">·</span>
          <CurrencyDisplay
            amount={summary.pending}
            currency={event.currency}
            highlightStatus={summary.pending > 0 ? 'pending' : 'neutral'}
            className="text-xs font-semibold"
          />
          <span>left</span>
        </div>

        <div className="flex items-center gap-2 shrink-0 font-mono text-xs text-subtle">
          <span className="font-semibold text-text">{summary.paymentProgress}%</span>
        </div>
      </div>
    </div>
  );
};
