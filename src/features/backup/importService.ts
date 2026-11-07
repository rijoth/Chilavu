import { db } from '@/db/database';
import type { BackupFile, ImportAnalysis, ImportConflict } from './backupSchema';
import type { Event } from '@/types/event';
import type { Expense } from '@/types/expense';
import type { Payment } from '@/types/payment';

export const importService = {
  async analyzeBackup(file: BackupFile): Promise<ImportAnalysis> {
    const existingEvents = await db.events.toArray();
    const existingExpenses = await db.expenses.toArray();
    const existingPayments = await db.payments.toArray();

    const existingEventsMap = new Map<string, Event>(existingEvents.map(e => [e.id, e]));
    const existingExpensesMap = new Map<string, Expense>(existingExpenses.map(e => [e.id, e]));
    const existingPaymentsMap = new Map<string, Payment>(existingPayments.map(p => [p.id, p]));

    const conflicts: ImportConflict[] = [];
    let newEvents = 0;
    let newExpenses = 0;
    let newPayments = 0;
    let identicalRecords = 0;

    // Check events
    for (const incoming of file.data.events) {
      const existing = existingEventsMap.get(incoming.id);
      if (!existing) {
        newEvents++;
      } else {
        if (JSON.stringify(incoming) === JSON.stringify(existing)) {
          identicalRecords++;
        } else {
          conflicts.push({
            type: 'event',
            id: incoming.id,
            existingNameOrLabel: `Existing: ${existing.name} (${existing.currency})`,
            incomingNameOrLabel: `Incoming: ${incoming.name} (${incoming.currency})`,
          });
        }
      }
    }

    // Check expenses
    for (const incoming of file.data.expenses) {
      const existing = existingExpensesMap.get(incoming.id);
      if (!existing) {
        newExpenses++;
      } else {
        if (JSON.stringify(incoming) === JSON.stringify(existing)) {
          identicalRecords++;
        } else {
          conflicts.push({
            type: 'expense',
            id: incoming.id,
            existingNameOrLabel: `Existing: ${existing.name} (${existing.expectedAmount})`,
            incomingNameOrLabel: `Incoming: ${incoming.name} (${incoming.expectedAmount})`,
          });
        }
      }
    }

    // Check payments
    for (const incoming of file.data.payments) {
      const existing = existingPaymentsMap.get(incoming.id);
      if (!existing) {
        newPayments++;
      } else {
        if (JSON.stringify(incoming) === JSON.stringify(existing)) {
          identicalRecords++;
        } else {
          conflicts.push({
            type: 'payment',
            id: incoming.id,
            existingNameOrLabel: `Existing: ${existing.amount} on ${existing.paymentDate}`,
            incomingNameOrLabel: `Incoming: ${incoming.amount} on ${incoming.paymentDate}`,
          });
        }
      }
    }

    return {
      isValid: true,
      errors: [],
      totalEvents: file.data.events.length,
      totalExpenses: file.data.expenses.length,
      totalPayments: file.data.payments.length,
      newEvents,
      newExpenses,
      newPayments,
      identicalRecords,
      conflicts,
    };
  },

  /**
   * Replace: Drops all existing tables and re-populates with backup data inside a single transaction.
   */
  async executeReplaceImport(file: BackupFile): Promise<void> {
    await db.transaction('rw', [db.events, db.expenses, db.payments], async () => {
      await db.events.clear();
      await db.expenses.clear();
      await db.payments.clear();

      if (file.data.events.length > 0) {
        await db.events.bulkAdd(file.data.events);
      }
      if (file.data.expenses.length > 0) {
        await db.expenses.bulkAdd(file.data.expenses);
      }
      if (file.data.payments.length > 0) {
        await db.payments.bulkAdd(file.data.payments);
      }
    });
  },

  /**
   * Merge: Adds records that do not exist. For conflicting records, resolves according to conflictResolution ('overwrite' | 'skip').
   */
  async executeMergeImport(
    file: BackupFile,
    conflictResolution: 'overwrite' | 'skip' = 'skip'
  ): Promise<{ addedCount: number; updatedCount: number; skippedCount: number }> {
    let addedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    await db.transaction('rw', [db.events, db.expenses, db.payments], async () => {
      // 1. Events
      for (const ev of file.data.events) {
        const existing = await db.events.get(ev.id);
        if (!existing) {
          await db.events.add(ev);
          addedCount++;
        } else if (JSON.stringify(existing) === JSON.stringify(ev)) {
          skippedCount++;
        } else {
          if (conflictResolution === 'overwrite') {
            await db.events.put(ev);
            updatedCount++;
          } else {
            skippedCount++;
          }
        }
      }

      // 2. Expenses
      for (const exp of file.data.expenses) {
        const existing = await db.expenses.get(exp.id);
        if (!existing) {
          await db.expenses.add(exp);
          addedCount++;
        } else if (JSON.stringify(existing) === JSON.stringify(exp)) {
          skippedCount++;
        } else {
          if (conflictResolution === 'overwrite') {
            await db.expenses.put(exp);
            updatedCount++;
          } else {
            skippedCount++;
          }
        }
      }

      // 3. Payments
      for (const pay of file.data.payments) {
        const existing = await db.payments.get(pay.id);
        if (!existing) {
          await db.payments.add(pay);
          addedCount++;
        } else if (JSON.stringify(existing) === JSON.stringify(pay)) {
          skippedCount++;
        } else {
          if (conflictResolution === 'overwrite') {
            await db.payments.put(pay);
            updatedCount++;
          } else {
            skippedCount++;
          }
        }
      }
    });

    return { addedCount, updatedCount, skippedCount };
  },
};
