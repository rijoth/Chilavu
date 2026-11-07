import type { Event } from '@/types/event';
import type { Expense } from '@/types/expense';
import type { Payment } from '@/types/payment';

export interface BackupData {
  events: Event[];
  expenses: Expense[];
  payments: Payment[];
}

export interface BackupFile {
  app: 'EventLedger';
  schemaVersion: 1;
  exportedAt: string;
  data: BackupData;
}

export interface ImportConflict {
  type: 'event' | 'expense' | 'payment';
  id: string;
  existingNameOrLabel: string;
  incomingNameOrLabel: string;
}

export interface ImportAnalysis {
  isValid: boolean;
  errors: string[];
  totalEvents: number;
  totalExpenses: number;
  totalPayments: number;
  newEvents: number;
  newExpenses: number;
  newPayments: number;
  identicalRecords: number;
  conflicts: ImportConflict[];
}
