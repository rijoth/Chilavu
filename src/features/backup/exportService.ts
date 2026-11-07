import { db } from '@/db/database';
import type { BackupFile } from './backupSchema';
import { getTodayDateString } from '@/lib/dates';

export const exportService = {
  async generateBackup(): Promise<BackupFile> {
    const events = await db.events.toArray();
    const expenses = await db.expenses.toArray();
    const payments = await db.payments.toArray();

    return {
      app: 'EventLedger',
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      data: {
        events,
        expenses,
        payments,
      },
    };
  },

  downloadBackup(backup: BackupFile): void {
    const jsonString = JSON.stringify(backup, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `eventledger-backup-${getTodayDateString()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },
};
