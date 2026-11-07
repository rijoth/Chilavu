import type { Event } from '@/types/event';
import { formatLocalDate, formatDate } from '@/lib/dates';

/**
 * Checks if a normalized query matches against various representations of a date string.
 * Supports:
 * - Raw ISO date string
 * - Localized formatted date (e.g. "20 Nov 2026")
 * - Default format (e.g. "20 Nov 2026")
 * - Full month name (e.g. "November")
 * - Short month name (e.g. "Nov")
 * - Full date variations (e.g. "November 20 2026", "20 November 2026")
 */
function matchesDateQuery(dateStr: string, normalizedQuery: string): boolean {
  if (!dateStr) return false;

  // 1. Raw date representation
  if (dateStr.toLowerCase().includes(normalizedQuery)) {
    return true;
  }

  // 2. Localized formatted date
  const localFormatted = formatLocalDate(dateStr).toLowerCase();
  if (localFormatted.includes(normalizedQuery)) {
    return true;
  }

  try {
    const d1 = formatDate(dateStr, 'd MMM yyyy').toLowerCase();
    if (d1.includes(normalizedQuery)) {
      return true;
    }

    const d2 = formatDate(dateStr, 'dd MMM yyyy').toLowerCase();
    if (d2.includes(normalizedQuery)) {
      return true;
    }

    const d3 = formatDate(dateStr, 'MMM d yyyy').toLowerCase();
    if (d3.includes(normalizedQuery)) {
      return true;
    }

    const monthOnly = formatDate(dateStr, 'MMMM').toLowerCase();
    if (monthOnly.includes(normalizedQuery)) {
      return true;
    }

    const monthShort = formatDate(dateStr, 'MMM').toLowerCase();
    if (monthShort.includes(normalizedQuery)) {
      return true;
    }

    const fullDate1 = formatDate(dateStr, 'MMMM d yyyy').toLowerCase();
    if (fullDate1.includes(normalizedQuery)) {
      return true;
    }

    const fullDate2 = formatDate(dateStr, 'd MMMM yyyy').toLowerCase();
    if (fullDate2.includes(normalizedQuery)) {
      return true;
    }
  } catch {
    // Ignore parse/format errors on non-standard date strings
  }

  return false;
}

/**
 * Checks whether an event matches a search query against its name, event date, and archived date.
 * Case-insensitive matching against:
 * 1. event.name
 * 2. event.eventDate (raw ISO date YYYY-MM-DD, localized date, month name, etc.)
 * 3. event.archivedAt (raw ISO date, localized date, month name, "archived <date>")
 */
export function matchesEventSearch(
  event: Pick<Event, 'name'> & Partial<Pick<Event, 'eventDate' | 'archivedAt'>>,
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
  if (event.eventDate && matchesDateQuery(event.eventDate, normalizedQuery)) {
    return true;
  }

  // 3. Match archived date if present
  if (event.archivedAt) {
    if (matchesDateQuery(event.archivedAt, normalizedQuery)) {
      return true;
    }

    // Support searches like "archived Nov", "archived 2026", "archived 7 Nov"
    const queryWithoutArchived = normalizedQuery.replace(/^archived\s+/, '').trim();
    if (queryWithoutArchived && matchesDateQuery(event.archivedAt, queryWithoutArchived)) {
      return true;
    }

    const archivedLabel = `archived ${formatLocalDate(event.archivedAt)}`.toLowerCase();
    if (archivedLabel.includes(normalizedQuery)) {
      return true;
    }
  }

  return false;
}

/**
 * Filters a list of events by a search query string.
 */
export function filterEvents<
  T extends Pick<Event, 'name'> & Partial<Pick<Event, 'eventDate' | 'archivedAt'>>
>(events: T[], query: string): T[] {
  const normalizedQuery = query.trim();
  if (!normalizedQuery) {
    return events;
  }
  return events.filter((ev) => matchesEventSearch(ev, normalizedQuery));
}

/**
 * Alias for filterEvents to allow interchangeable generic usage as filterBySearch.
 */
export { filterEvents as filterBySearch };

