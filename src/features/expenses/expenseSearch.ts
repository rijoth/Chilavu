import type { Expense } from '@/types/expense';

/**
 * Pure helper function in the domain layer to filter items (e.g. expenses) by search query.
 * Performs case-insensitive matching against item `name` and optional `vendor`.
 * Contains zero external dependencies.
 *
 * @param items List of expense items or any objects with a name and optional vendor
 * @param query Search query string
 * @returns Filtered list of matching items
 */
export function filterBySearch<T extends Pick<Expense, 'name'> & Partial<Pick<Expense, 'vendor'>>>(
  items: T[],
  query: string
): T[];
export function filterBySearch<T>(
  items: T[],
  query: string,
  fieldExtractor: (item: T) => (string | undefined | null)[]
): T[];
export function filterBySearch<T>(
  items: T[],
  query: string,
  fieldExtractor?: (item: T) => (string | undefined | null)[]
): T[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return items;
  }

  return items.filter((item) => {
    if (fieldExtractor) {
      const fields = fieldExtractor(item);
      return fields.some((field) => field && field.toLowerCase().includes(normalizedQuery));
    }

    const candidate = item as unknown as { name?: string; vendor?: string };
    if (candidate.name && candidate.name.toLowerCase().includes(normalizedQuery)) {
      return true;
    }
    if (candidate.vendor && candidate.vendor.toLowerCase().includes(normalizedQuery)) {
      return true;
    }
    return false;
  });
}
