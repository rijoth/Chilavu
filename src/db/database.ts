import Dexie, { type Table } from 'dexie';
import type { Event } from '@/types/event';
import type { Expense } from '@/types/expense';
import type { Payment } from '@/types/payment';

export class EventLedgerDB extends Dexie {
  events!: Table<Event, string>;
  expenses!: Table<Expense, string>;
  payments!: Table<Payment, string>;

  constructor() {
    super('EventLedgerDB');
    this.version(1).stores({
      events: 'id, name, eventDate, createdAt',
      expenses: 'id, eventId, name, category, dueDate',
      payments: 'id, expenseId, paymentDate',
    });
  }
}

export const db = new EventLedgerDB();

/**
 * Attempts to request persistent storage from browser if available.
 */
export async function initStoragePersistence(): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
    try {
      const isPersisted = await navigator.storage.persisted();
      if (!isPersisted) {
        return await navigator.storage.persist();
      }
      return isPersisted;
    } catch {
      return false;
    }
  }
  return false;
}
