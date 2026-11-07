import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, CheckCircle2, Clock, Wallet, Calendar, Archive } from 'lucide-react';
import type { EventWithSummary } from '@/hooks/useEvents';
import { formatLocalDate } from '@/lib/dates';
import { CurrencyDisplay } from '@/components/common/CurrencyDisplay';

interface EventCardProps {
  event: EventWithSummary;
  onArchive?: (event: EventWithSummary) => void;
}

export const EventCard: React.FC<EventCardProps> = ({ event, onArchive }) => {
  const navigate = useNavigate();
  const { summary } = event;

  const [swipeOffset, setSwipeOffset] = useState(0);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const isSwipingRef = useRef(false);

  const isArchived = Boolean(event.archivedAt);
  const canArchive = (event.expenseCount ?? 0) > 0 && summary.pending === 0;

  const isSettled = summary.pending === 0 && summary.committed > 0 && summary.overpaid === 0;
  const isOverpaid = summary.overpaid > 0;

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!onArchive || isArchived) return;
    touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    isSwipingRef.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartRef.current || !onArchive || isArchived) return;
    const diffX = e.touches[0].clientX - touchStartRef.current.x;
    const diffY = e.touches[0].clientY - touchStartRef.current.y;

    if (!isSwipingRef.current) {
      if (Math.abs(diffX) > 10 && Math.abs(diffX) > Math.abs(diffY)) {
        isSwipingRef.current = true;
      } else if (Math.abs(diffY) > 10) {
        touchStartRef.current = null;
        return;
      }
    }

    if (isSwipingRef.current) {
      if (diffX < 0) {
        setSwipeOffset(Math.max(-80, diffX));
      } else {
        setSwipeOffset(Math.min(0, -80 + diffX));
      }
    }
  };

  const handleTouchEnd = () => {
    if (!onArchive || isArchived) return;
    if (swipeOffset < -38) {
      setSwipeOffset(-76);
    } else {
      setSwipeOffset(0);
    }
    touchStartRef.current = null;
    isSwipingRef.current = false;
  };

  const handleClick = () => {
    if (swipeOffset !== 0) {
      setSwipeOffset(0);
      return;
    }
    navigate(`/events/${event.id}`);
  };

  return (
    <div className="relative overflow-hidden rounded-2xl">
      {/* Swipe action reveal background on dashboard */}
      {onArchive && !isArchived && (
        <div className="absolute inset-y-0 right-0 w-24 flex items-center justify-end pr-2 bg-overlay/30 rounded-2xl">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setSwipeOffset(0);
              onArchive(event);
            }}
            className={`h-[calc(100%-12px)] w-16 rounded-xl flex flex-col items-center justify-center gap-1 text-[11px] font-bold shadow-xs transition active:scale-95 ${
              canArchive
                ? 'bg-iris/20 text-iris hover:bg-iris/30 border border-iris/40'
                : 'bg-surface text-muted border border-overlay cursor-not-allowed'
            }`}
            title={canArchive ? 'Archive event' : 'Settle all payments to archive'}
            aria-label="Archive event"
          >
            <Archive className="w-4 h-4" />
            <span>Archive</span>
          </button>
        </div>
      )}

      {/* Main card body */}
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
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ transform: `translateX(${swipeOffset}px)` }}
        className={`group relative rounded-2xl bg-surface border border-overlay hover:border-subtle/50 p-3.5 sm:p-4 shadow-xs transition-all duration-200 hover:shadow-md cursor-pointer active:scale-[0.99] text-left select-none focus:outline-none focus:ring-2 focus:ring-pine/50 ${
          isArchived ? 'opacity-80 hover:opacity-100 bg-surface/80' : ''
        }`}
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

        {/* Muted line for archived date if archived */}
        {isArchived && (
          <div className="flex items-center gap-1.5 mt-2.5 pt-2 border-t border-overlay/40 text-[11px] text-muted">
            <Archive className="w-3.5 h-3.5 text-muted/70 shrink-0" />
            <span>Archived {formatLocalDate(event.archivedAt)}</span>
          </div>
        )}
      </div>
    </div>
  );
};
