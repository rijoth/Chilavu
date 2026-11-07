import { db } from '@/db/database';
import type { Event } from '@/types/event';
import { generateId } from '@/lib/ids';
import { validateEventInput, type EventInput } from './eventValidation';

export const eventService = {
  async getAllEvents(): Promise<Event[]> {
    return await db.events.orderBy('createdAt').reverse().toArray();
  },

  async getEvent(id: string): Promise<Event | undefined> {
    return await db.events.get(id);
  },

  async createEvent(input: EventInput): Promise<Event> {
    const validation = validateEventInput(input);
    if (!validation.isValid) {
      const firstError = Object.values(validation.errors)[0];
      throw new Error(firstError || 'Invalid event input');
    }

    const now = new Date().toISOString();
    const newEvent: Event = {
      id: generateId(),
      name: input.name.trim(),
      description: input.description?.trim() || undefined,
      eventDate: input.eventDate || undefined,
      currency: input.currency.trim().toUpperCase(),
      budgetAmount: input.budgetAmount,
      createdAt: now,
      updatedAt: now,
    };

    await db.events.add(newEvent);
    return newEvent;
  },

  async updateEvent(id: string, updates: Partial<EventInput>): Promise<Event> {
    const existing = await db.events.get(id);
    if (!existing) {
      throw new Error(`Event not found: ${id}`);
    }

    const mergedInput: EventInput = {
      name: updates.name !== undefined ? updates.name : existing.name,
      description: updates.description !== undefined ? updates.description : existing.description,
      eventDate: updates.eventDate !== undefined ? updates.eventDate : existing.eventDate,
      currency: updates.currency !== undefined ? updates.currency : existing.currency,
      budgetAmount: updates.budgetAmount !== undefined ? updates.budgetAmount : existing.budgetAmount,
    };

    const validation = validateEventInput(mergedInput);
    if (!validation.isValid) {
      const firstError = Object.values(validation.errors)[0];
      throw new Error(firstError || 'Invalid event update');
    }

    // Rule: If event already contains expenses, changing its currency is disallowed
    if (updates.currency && updates.currency.toUpperCase() !== existing.currency.toUpperCase()) {
      const expenseCount = await db.expenses.where('eventId').equals(id).count();
      if (expenseCount > 0) {
        throw new Error('Cannot change currency of an event that already has expenses');
      }
    }

    const now = new Date().toISOString();
    const updatedEvent: Event = {
      ...existing,
      name: mergedInput.name.trim(),
      description: mergedInput.description?.trim() || undefined,
      eventDate: mergedInput.eventDate || undefined,
      currency: mergedInput.currency.trim().toUpperCase(),
      budgetAmount: mergedInput.budgetAmount,
      updatedAt: now,
    };

    await db.events.put(updatedEvent);
    return updatedEvent;
  },

  async deleteEvent(id: string): Promise<void> {
    const existing = await db.events.get(id);
    if (!existing) return;

    // Transactional cascading deletion: delete event, expenses, and all related payments
    await db.transaction('rw', [db.events, db.expenses, db.payments], async () => {
      const expenses = await db.expenses.where('eventId').equals(id).toArray();
      const expenseIds = expenses.map(e => e.id);

      if (expenseIds.length > 0) {
        // Delete all payments belonging to these expenses
        for (const expId of expenseIds) {
          await db.payments.where('expenseId').equals(expId).delete();
        }
        // Delete all expenses
        await db.expenses.where('eventId').equals(id).delete();
      }

      // Delete the event
      await db.events.delete(id);
    });
  },

  async archiveEvent(id: string): Promise<Event> {
    const existing = await db.events.get(id);
    if (!existing) {
      throw new Error(`Event not found: ${id}`);
    }

    const now = new Date().toISOString();
    const updated: Event = {
      ...existing,
      archivedAt: now,
      updatedAt: now,
    };

    await db.events.put(updated);
    return updated;
  },

  async unarchiveEvent(id: string): Promise<Event> {
    const existing = await db.events.get(id);
    if (!existing) {
      throw new Error(`Event not found: ${id}`);
    }

    const now = new Date().toISOString();
    const updated: Event = {
      ...existing,
      updatedAt: now,
    };
    delete updated.archivedAt;

    await db.events.put(updated);
    return updated;
  },
};

