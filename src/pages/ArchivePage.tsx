import React, { useState } from 'react';
import { Archive, SearchX, X } from 'lucide-react';
import { useEvents } from '@/hooks/useEvents';
import { useDebounce } from '@/hooks/useDebounce';
import { filterEvents } from '@/features/events/eventSearch';
import { EventCard } from '@/components/events/EventCard';
import { EmptyState } from '@/components/common/EmptyState';
import { SearchBar } from '@/components/common/SearchBar';
import { PageHeader } from '@/components/common/PageHeader';

export const ArchivePage: React.FC = () => {
  const { archivedEvents, isLoading } = useEvents();
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedQuery = useDebounce(searchQuery, 150);

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  const filteredEvents = React.useMemo(
    () => filterEvents(archivedEvents, debouncedQuery),
    [archivedEvents, debouncedQuery]
  );

  return (
    <div className="flex-1 flex flex-col pb-24">
      {/* Header with back button */}
      <PageHeader
        title="Archived Events"
        subtitle={
          archivedEvents.length > 0
            ? debouncedQuery.trim()
              ? `${filteredEvents.length} of ${archivedEvents.length} ${archivedEvents.length === 1 ? 'event' : 'events'}`
              : `${archivedEvents.length} ${archivedEvents.length === 1 ? 'event' : 'events'} archived`
            : undefined
        }
        hasBack={true}
        backTo="/"
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col px-4 pt-4 sm:px-6">
        {/* Search Bar when there are 3 or more archived events */}
        {archivedEvents.length >= 3 && (
          <div className="mb-4">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              onClear={handleClearSearch}
              placeholder="Search archive"
              ariaLabel="Search archive"
            />
          </div>
        )}

        {/* Content list or empty states */}
        {isLoading ? (
          <div className="space-y-2.5 sm:space-y-3 pb-24">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-20 rounded-2xl bg-surface animate-pulse border border-overlay"
              />
            ))}
          </div>
        ) : archivedEvents.length === 0 ? (
          <EmptyState
            icon={Archive}
            title="Nothing archived yet"
            description="Fully settled events you archive will appear here in read-only mode for your reference."
            className="mt-4 my-auto py-12"
          />
        ) : filteredEvents.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title={`No archived events match '${debouncedQuery.trim() || searchQuery.trim()}'`}
            description="Check for typos or try searching with a different name or date."
            actionLabel="Clear search"
            actionIcon={X}
            onAction={handleClearSearch}
            className="mt-4 my-auto py-12"
          />
        ) : (
          <div className="space-y-2.5 sm:space-y-3 pb-24">
            {filteredEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
