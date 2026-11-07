import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/database';
import { calculateEventSummary } from '@/features/expenses/expenseCalculations';
import type { Event, EventSummary } from '@/types/event';

export interface EventWithSummary extends Event {
  summary: EventSummary;
  expenseCount: number;
}

export function useEvents() {
  const eventsWithSummary = useLiveQuery(async (): Promise<EventWithSummary[]> => {
    const events = await db.events.orderBy('createdAt').reverse().toArray();
    const allExpenses = await db.expenses.toArray();
    const allPayments = await db.payments.toArray();

    return events.map((event) => {
      const eventExpenses = allExpenses.filter((e) => e.eventId === event.id);
      const expenseIds = new Set(eventExpenses.map((e) => e.id));
      const eventPayments = allPayments.filter((p) => expenseIds.has(p.expenseId));

      const summary = calculateEventSummary(event, eventExpenses, eventPayments);

      return {
        ...event,
        summary,
        expenseCount: eventExpenses.length,
      };
    });
  }, []);

  return {
    events: eventsWithSummary ?? [],
    isLoading: eventsWithSummary === undefined,
  };
}

export function useEvent(eventId?: string) {
  const data = useLiveQuery(async () => {
    if (!eventId) return null;
    const event = await db.events.get(eventId);
    if (!event) return null;

    const expenses = await db.expenses.where('eventId').equals(eventId).toArray();
    const expenseIds = new Set(expenses.map((e) => e.id));
    const allPayments = await db.payments.toArray();
    const payments = allPayments.filter((p) => expenseIds.has(p.expenseId));

    const summary = calculateEventSummary(event, expenses, payments);

    return {
      event,
      expenses,
      payments,
      summary,
    };
  }, [eventId]);

  return {
    event: data?.event,
    expenses: data?.expenses ?? [],
    payments: data?.payments ?? [],
    summary: data?.summary,
    isLoading: data === undefined,
    notFound: data === null,
  };
}
