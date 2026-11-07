import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Settings, CalendarHeart } from 'lucide-react';
import { useEvents } from '@/hooks/useEvents';
import { EventCard } from '@/components/events/EventCard';
import { EventFormModal } from '@/components/events/EventFormModal';
import { EmptyState } from '@/components/common/EmptyState';
import { CurrencyDisplay } from '@/components/common/CurrencyDisplay';
import { PWAInstallBanner } from '@/components/common/PWAInstallBanner';
import { ChilavuLogo } from '@/components/common/ChilavuLogo';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { events, isLoading } = useEvents();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

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

          <button
            type="button"
            onClick={() => navigate('/settings')}
            className="p-2.5 rounded-xl text-subtle hover:text-text hover:bg-surface active:scale-95 transition min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Page Content */}
      <div className="flex-1 flex flex-col px-4 pt-4 sm:px-6">
        {/* In-App PWA Install Banner */}
        <PWAInstallBanner />

        {/* Currency-grouped overall summary with Pending as primary visual focus */}
        {currencyTotals.length > 0 && (
          <section className="mb-5 space-y-3" aria-label="Overall Summary">
            {currencyTotals.map(([curr, totals]) => (
              <div
                key={curr}
                className="p-4 sm:p-5 rounded-2xl bg-surface/75 border border-overlay/80 shadow-xs"
              >
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted">
                    Overall Summary ({curr})
                  </span>
                  <span className="text-xs text-subtle font-medium">
                    {totals.count} {totals.count === 1 ? 'event' : 'events'}
                  </span>
                </div>

                <div className="flex items-baseline justify-between gap-4">
                  {/* Hero visual focus: Pending */}
                  <div className="min-w-0">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-subtle block mb-0.5">
                      Pending
                    </span>
                    <CurrencyDisplay
                      amount={totals.pending}
                      currency={curr}
                      highlightStatus={totals.pending > 0 ? 'pending' : 'neutral'}
                      className="text-2xl sm:text-3xl font-extrabold block truncate leading-none"
                    />
                  </div>

                  {/* Secondary metrics: Paid and Committed */}
                  <div className="flex items-center gap-3 sm:gap-5 shrink-0 text-right">
                    <div>
                      <span className="text-[11px] text-subtle block font-medium">Paid</span>
                      <CurrencyDisplay
                        amount={totals.paid}
                        currency={curr}
                        highlightStatus="paid"
                        className="text-sm sm:text-base font-bold block"
                      />
                    </div>
                    <div className="h-6 w-px bg-overlay/80" />
                    <div>
                      <span className="text-[11px] text-subtle block font-medium">Committed</span>
                      <CurrencyDisplay
                        amount={totals.committed}
                        currency={curr}
                        className="text-sm sm:text-base font-semibold text-text block"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </section>
        )}

        {/* Main Title */}
        <div className="mb-3">
          <h2 className="text-xl font-bold text-text tracking-tight">Your Events</h2>
          <p className="text-xs text-subtle">Organize and monitor expenses per event</p>
        </div>

        {/* Event Cards or Empty State */}
        {isLoading ? (
          <div className="space-y-2.5 sm:space-y-3">
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
        ) : (
          <div className="space-y-2.5 sm:space-y-3">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
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
