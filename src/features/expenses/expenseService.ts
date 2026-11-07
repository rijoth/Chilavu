import { db } from '@/db/database';
import type { Expense } from '@/types/expense';
import { generateId } from '@/lib/ids';
import { validateExpenseInput, type ExpenseInput } from './expenseValidation';

export const expenseService = {
  async getExpensesByEvent(eventId: string): Promise<Expense[]> {
    return await db.expenses.where('eventId').equals(eventId).toArray();
  },

  async getExpense(id: string): Promise<Expense | undefined> {
    return await db.expenses.get(id);
  },

  async createExpense(eventId: string, input: ExpenseInput): Promise<Expense> {
    // Validate parent event exists
    const parentEvent = await db.events.get(eventId);
    if (!parentEvent) {
      throw new Error(`Cannot add expense: Event ${eventId} does not exist`);
    }

    const validation = validateExpenseInput(input);
    if (!validation.isValid) {
      const firstError = Object.values(validation.errors)[0];
      throw new Error(firstError || 'Invalid expense input');
    }

    const now = new Date().toISOString();
    const newExpense: Expense = {
      id: generateId(),
      eventId,
      name: input.name.trim(),
      category: input.category?.trim() || undefined,
      expectedAmount: Math.floor(input.expectedAmount),
      vendor: input.vendor?.trim() || undefined,
      dueDate: input.dueDate || undefined,
      notes: input.notes?.trim() || undefined,
      createdAt: now,
      updatedAt: now,
    };

    await db.expenses.add(newExpense);
    return newExpense;
  },

  async updateExpense(id: string, updates: Partial<ExpenseInput>): Promise<Expense> {
    const existing = await db.expenses.get(id);
    if (!existing) {
      throw new Error(`Expense not found: ${id}`);
    }

    const mergedInput: ExpenseInput = {
      name: updates.name !== undefined ? updates.name : existing.name,
      expectedAmount: updates.expectedAmount !== undefined ? updates.expectedAmount : existing.expectedAmount,
      category: updates.category !== undefined ? updates.category : existing.category,
      vendor: updates.vendor !== undefined ? updates.vendor : existing.vendor,
      dueDate: updates.dueDate !== undefined ? updates.dueDate : existing.dueDate,
      notes: updates.notes !== undefined ? updates.notes : existing.notes,
    };

    const validation = validateExpenseInput(mergedInput);
    if (!validation.isValid) {
      const firstError = Object.values(validation.errors)[0];
      throw new Error(firstError || 'Invalid expense update');
    }

    const now = new Date().toISOString();
    const updatedExpense: Expense = {
      ...existing,
      name: mergedInput.name.trim(),
      expectedAmount: Math.floor(mergedInput.expectedAmount),
      category: mergedInput.category?.trim() || undefined,
      vendor: mergedInput.vendor?.trim() || undefined,
      dueDate: mergedInput.dueDate || undefined,
      notes: mergedInput.notes?.trim() || undefined,
      updatedAt: now,
    };

    await db.expenses.put(updatedExpense);
    return updatedExpense;
  },

  async deleteExpense(id: string): Promise<void> {
    // Transactional cascading deletion: delete expense and all associated payments
    await db.transaction('rw', [db.expenses, db.payments], async () => {
      await db.payments.where('expenseId').equals(id).delete();
      await db.expenses.delete(id);
    });
  },
};
