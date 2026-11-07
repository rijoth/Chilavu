import type { Event } from '@/types/event';
import { formatLocalDate, formatDate } from '@/lib/dates';

/**
 * Checks whether an event matches a search query against its name and event date.
 * Case-insensitive matching against:
 * 1. event.name
 * 2. event.eventDate (raw ISO date YYYY-MM-DD)
 * 3. Localized formatted date (e.g. "20 Nov 2026")
 * 4. Month names and full date representations (e.g. "November", "November 20 2026")
 */
export function matchesEventSearch(
  event: Pick<Event, 'name' | 'eventDate'>,
  query: string
): boolean {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return true;
  }

  // 1. Match event name
  if (event.name.toLowerCase().includes(normalizedQuery)) {
    return true;
  }

  // 2. Match event date if present
  if (event.eventDate) {
    const rawDate = event.eventDate.toLowerCase();
    if (rawDate.includes(normalizedQuery)) {
      return true;
    }

    const localFormatted = formatLocalDate(event.eventDate).toLowerCase();
    if (localFormatted.includes(normalizedQuery)) {
      return true;
    }

    try {
      const monthOnly = formatDate(event.eventDate, 'MMMM').toLowerCase();
      if (monthOnly.includes(normalizedQuery)) {
        return true;
      }

      const fullDate1 = formatDate(event.eventDate, 'MMMM d yyyy').toLowerCase();
      if (fullDate1.includes(normalizedQuery)) {
        return true;
      }

      const fullDate2 = formatDate(event.eventDate, 'd MMMM yyyy').toLowerCase();
      if (fullDate2.includes(normalizedQuery)) {
        return true;
      }
    } catch {
      // Ignore parse/format errors on non-standard date strings
    }
  }

  return false;
}

/**
 * Filters a list of events by a search query string.
 */
export function filterEvents<T extends Pick<Event, 'name' | 'eventDate'>>(
  events: T[],
  query: string
): T[] {
  const normalizedQuery = query.trim();
  if (!normalizedQuery) {
    return events;
  }
  return events.filter((ev) => matchesEventSearch(ev, normalizedQuery));
}
