import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Settings, CalendarHeart, SearchX, X, Archive } from 'lucide-react';
import { useEvents, type EventWithSummary } from '@/hooks/useEvents';
import { useDebounce } from '@/hooks/useDebounce';
import { filterEvents } from '@/features/events/eventSearch';
import { EventCard } from '@/components/events/EventCard';
import { EventFormModal } from '@/components/events/EventFormModal';
import { EmptyState } from '@/components/common/EmptyState';
import { SearchBar } from '@/components/common/SearchBar';
import { CurrencyDisplay } from '@/components/common/CurrencyDisplay';
import { PWAInstallBanner } from '@/components/common/PWAInstallBanner';
import { ChilavuLogo } from '@/components/common/ChilavuLogo';
import { getCurrencyDecimals } from '@/lib/currency';
import { useUIStore } from '@/stores/uiStore';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { events, archivedEvents, isLoading } = useEvents();
  const { showToast, archiveEvent, unarchiveEvent } = useUIStore();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedQuery = useDebounce(searchQuery, 150);

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  const handleArchiveEvent = async (eventToArchive: EventWithSummary) => {
    const canArchive = (eventToArchive.expenseCount ?? 0) > 0 && eventToArchive.summary.pending === 0;
    if (!canArchive) {
      showToast('Settle all payments to archive', 'error');
      return;
    }

    try {
      await archiveEvent(eventToArchive.id);
      showToast(`Archived "${eventToArchive.name}"`, 'info', {
        label: 'Undo',
        onClick: async () => {
          await unarchiveEvent(eventToArchive.id);
          showToast(`Restored "${eventToArchive.name}"`, 'success');
        },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to archive event';
      showToast(msg, 'error');
    }
  };

  // Filter events live by query (event name and event date)
  const filteredEvents = React.useMemo(
    () => filterEvents(events, debouncedQuery),
    [events, debouncedQuery]
  );

  // Group summary by currency (Section 5.1 Rule: never combine different currencies)
  const currencyTotals = React.useMemo(() => {
    const map = new Map<
      string,
      { committed: number; paid: number; pending: number; count: number }
    >();

    for (const ev of events) {
      const current = map.get(ev.currency) || {
        committed: 0,
        paid: 0,
        pending: 0,
        count: 0,
      };
      current.committed += ev.summary.committed;
      current.paid += ev.summary.paid;
      current.pending += ev.summary.pending;
      current.count += 1;
      map.set(ev.currency, current);
    }

    return Array.from(map.entries());
  }, [events]);

  return (
    <div className="flex-1 flex flex-col pb-24">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-base border-b border-overlay/60 px-4 py-4 sm:px-6">
        <div className="flex items-center justify-between">
          <ChilavuLogo size="md" showWordmark subtitle="Local event expense tracker" />

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => navigate('/archive')}
              className="relative p-2.5 rounded-xl text-subtle hover:text-text hover:bg-surface active:scale-95 transition min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label={`Archived events${archivedEvents.length > 0 ? ` (${archivedEvents.length})` : ''}`}
            >
              <Archive className="w-5 h-5" />
              {archivedEvents.length > 0 && (
                <span className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold rounded-full bg-iris text-surface leading-none shadow-xs">
                  {archivedEvents.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => navigate('/settings')}
              className="p-2.5 rounded-xl text-subtle hover:text-text hover:bg-surface active:scale-95 transition min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Page Content */}
      <div className="flex-1 flex flex-col px-4 pt-4 sm:px-6">
        {/* In-App PWA Install Banner */}
        <PWAInstallBanner />

        {/* Currency-grouped overall summary with Pending as primary visual focus */}
        {currencyTotals.length > 0 && (
          <section className="mb-5 space-y-3" aria-label="All events summary">
            {currencyTotals.map(([curr, totals]) => {
              const decimals = getCurrencyDecimals(curr);
              const majorAmount = totals.pending / (10 ** decimals);
              // Shrink a step for long values (e.g. ₹1,25,000 or larger)
              const heroFontSize = majorAmount >= 10000000
                ? 'clamp(1.125rem, 5vw, 1.5rem)'
                : majorAmount >= 100000
                  ? 'clamp(1.25rem, 6.2vw, 1.875rem)'
                  : 'clamp(1.5rem, 8vw, 2.25rem)';

              return (
                <div
                  key={curr}
                  className="@container p-4 sm:p-5 rounded-2xl bg-surface/75 border border-overlay/80 shadow-xs"
                >
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-xs font-medium text-subtle">
                      All events
                    </span>
                    <span className="text-xs text-subtle font-medium">
                      {totals.count} {totals.count === 1 ? 'event' : 'events'}
                    </span>
                  </div>

                  {/* Responsive layout: stacked on narrow screens (<420px), side-by-side on wider screens */}
                  <div className="flex flex-col @min-[420px]:flex-row min-[420px]:flex-row @min-[420px]:items-baseline min-[420px]:items-baseline justify-between gap-3.5 @min-[420px]:gap-4 min-[420px]:gap-4">
                    {/* Row 1 / Left Hero: Pending at full width on narrow screens */}
                    <div className="w-full @min-[420px]:w-auto min-[420px]:w-auto min-w-0">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-subtle block mb-0.5">
                        Pending
                      </span>
                      <CurrencyDisplay
                        amount={totals.pending}
                        currency={curr}
                        highlightStatus={totals.pending > 0 ? 'pending' : 'neutral'}
                        hideDecimalsIfWhole
                        muteDecimals
                        style={{ fontSize: heroFontSize }}
                        className="font-extrabold block whitespace-nowrap tabular-nums leading-tight"
                      />
                    </div>

                    {/* Row 2 / Right Secondary: Paid and Committed together beneath, separated by divider */}
                    <div className="flex items-center gap-3 sm:gap-5 shrink-0 min-w-0 justify-start @min-[420px]:justify-end min-[420px]:justify-end text-left @min-[420px]:text-right min-[420px]:text-right pt-2.5 border-t border-overlay/40 @min-[420px]:pt-0 min-[420px]:pt-0 @min-[420px]:border-t-0 min-[420px]:border-t-0">
                      <div className="min-w-0">
                        <span className="text-[11px] text-subtle block font-medium">Paid</span>
                        <CurrencyDisplay
                          amount={totals.paid}
                          currency={curr}
                          highlightStatus="paid"
                          hideDecimalsIfWhole
                          muteDecimals
                          className="text-sm sm:text-base font-bold block tabular-nums whitespace-nowrap"
                        />
                      </div>
                      <div className="h-6 w-px bg-overlay/80 shrink-0" />
                      <div className="min-w-0">
                        <span className="text-[11px] text-subtle block font-medium">Committed</span>
                        <CurrencyDisplay
                          amount={totals.committed}
                          currency={curr}
                          hideDecimalsIfWhole
                          muteDecimals
                          className="text-sm sm:text-base font-semibold text-text block tabular-nums whitespace-nowrap"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </section>
        )}

        {/* Search Bar: placed between summary card and "Your Events" heading, hidden when fewer than 3 events */}
        {events.length >= 3 && (
          <div className="mb-4">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              onClear={handleClearSearch}
              placeholder="Search events"
              ariaLabel="Search events"
            />
          </div>
        )}

        {/* Main Title */}
        <div className="mb-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-text tracking-tight">Your Events</h2>
            {debouncedQuery.trim() && (
              <span className="text-xs text-subtle font-medium">
                {filteredEvents.length} of {events.length}
              </span>
            )}
          </div>
          <p className="text-xs text-subtle">Organize and monitor expenses per event</p>
        </div>

        {/* Event Cards or Empty State */}
        {isLoading ? (
          <div className="space-y-2.5 sm:space-y-3 pb-24">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 rounded-2xl bg-surface animate-pulse border border-overlay" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <EmptyState
            icon={CalendarHeart}
            title="No events yet"
            description="Create your first event—like a wedding, birthday, trip, or family celebration—to start organizing your budget and payments."
            actionLabel="Create Event"
            onAction={() => setIsCreateOpen(true)}
            className="mt-4 my-auto py-12"
          />
        ) : filteredEvents.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title={`No events match '${debouncedQuery.trim() || searchQuery.trim()}'`}
            description="Check for typos or try searching with a different name or date."
            actionLabel="Clear search"
            actionIcon={X}
            onAction={handleClearSearch}
            className="mt-4 my-auto py-12"
          />
        ) : (
          <div className="space-y-2.5 sm:space-y-3 pb-24">
            {filteredEvents.map((event) => (
              <EventCard key={event.id} event={event} onArchive={handleArchiveEvent} />
            ))}
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <button
        type="button"
        onClick={() => setIsCreateOpen(true)}
        className="fixed bottom-6 right-6 z-30 w-14 h-14 rounded-2xl bg-pine hover:bg-pine/90 text-white shadow-xl flex items-center justify-center transition-transform active:scale-90 hover:scale-105"
        aria-label="Create new event"
      >
        <Plus className="w-7 h-7 stroke-[2.2]" />
      </button>

      {/* Create Event Modal */}
      <EventFormModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={(created) => navigate(`/events/${created.id}`)}
      />
    </div>
  );
};
