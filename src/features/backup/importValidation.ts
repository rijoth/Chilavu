import type { BackupFile } from './backupSchema';
import { isValidMinorAmount } from '@/lib/currency';

export interface ValidationSummary {
  isValid: boolean;
  errors: string[];
  parsedFile?: BackupFile;
}

export function validateBackupJson(jsonString: string): ValidationSummary {
  const errors: string[] = [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonString);
  } catch (err) {
    return {
      isValid: false,
      errors: [`Invalid JSON file format: ${err instanceof Error ? err.message : 'Parse error'}`],
    };
  }

  if (!parsed || typeof parsed !== 'object') {
    return { isValid: false, errors: ['Backup file content must be a JSON object'] };
  }

  const file = parsed as Partial<BackupFile>;

  if (file.app !== 'EventLedger') {
    errors.push(`Invalid application identifier "${file.app}". Expected "EventLedger".`);
  }

  if (file.schemaVersion !== 1) {
    errors.push(`Unsupported schema version "${file.schemaVersion}". Only version 1 is supported.`);
  }

  if (!file.data || typeof file.data !== 'object') {
    errors.push('Missing or invalid "data" property in backup file.');
    return { isValid: false, errors };
  }

  const { events, expenses, payments } = file.data;

  if (!Array.isArray(events)) {
    errors.push('The "data.events" property must be an array.');
  }
  if (!Array.isArray(expenses)) {
    errors.push('The "data.expenses" property must be an array.');
  }
  if (!Array.isArray(payments)) {
    errors.push('The "data.payments" property must be an array.');
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  const eventIds = new Set<string>();
  const expenseIds = new Set<string>();
  const paymentIds = new Set<string>();

  // Validate Events
  events.forEach((ev, idx) => {
    if (!ev || typeof ev !== 'object') {
      errors.push(`Event at index ${idx} is not an object.`);
      return;
    }
    if (!ev.id || typeof ev.id !== 'string') {
      errors.push(`Event at index ${idx} is missing a valid "id".`);
    } else if (eventIds.has(ev.id)) {
      errors.push(`Duplicate event ID "${ev.id}" found in backup file.`);
    } else {
      eventIds.add(ev.id);
    }

    if (!ev.name || typeof ev.name !== 'string' || !ev.name.trim()) {
      errors.push(`Event "${ev.id || idx}" is missing a name.`);
    }

    if (!ev.currency || typeof ev.currency !== 'string') {
      errors.push(`Event "${ev.id || idx}" is missing a currency code.`);
    }

    if (ev.budgetAmount !== undefined && ev.budgetAmount !== null && !isValidMinorAmount(ev.budgetAmount)) {
      errors.push(`Event "${ev.name || ev.id}" has invalid budgetAmount: ${ev.budgetAmount}`);
    }

    if (ev.archivedAt !== undefined && ev.archivedAt !== null) {
      if (typeof ev.archivedAt !== 'string' || isNaN(Date.parse(ev.archivedAt))) {
        errors.push(`Event "${ev.name || ev.id}" has invalid archivedAt timestamp: ${ev.archivedAt}`);
      }
    }
  });

  // Validate Expenses
  expenses.forEach((exp, idx) => {
    if (!exp || typeof exp !== 'object') {
      errors.push(`Expense at index ${idx} is not an object.`);
      return;
    }
    if (!exp.id || typeof exp.id !== 'string') {
      errors.push(`Expense at index ${idx} is missing a valid "id".`);
    } else if (expenseIds.has(exp.id)) {
      errors.push(`Duplicate expense ID "${exp.id}" found in backup file.`);
    } else {
      expenseIds.add(exp.id);
    }

    if (!exp.eventId || typeof exp.eventId !== 'string') {
      errors.push(`Expense "${exp.name || exp.id || idx}" is missing a parent "eventId".`);
    } else if (!eventIds.has(exp.eventId)) {
      errors.push(`Expense "${exp.name || exp.id}" references non-existent eventId "${exp.eventId}".`);
    }

    if (!exp.name || typeof exp.name !== 'string' || !exp.name.trim()) {
      errors.push(`Expense at index ${idx} is missing a name.`);
    }

    if (exp.expectedAmount === undefined || !isValidMinorAmount(exp.expectedAmount)) {
      errors.push(`Expense "${exp.name || exp.id}" has invalid expectedAmount: ${exp.expectedAmount}`);
    }
  });

  // Validate Payments
  payments.forEach((pay, idx) => {
    if (!pay || typeof pay !== 'object') {
      errors.push(`Payment at index ${idx} is not an object.`);
      return;
    }
    if (!pay.id || typeof pay.id !== 'string') {
      errors.push(`Payment at index ${idx} is missing a valid "id".`);
    } else if (paymentIds.has(pay.id)) {
      errors.push(`Duplicate payment ID "${pay.id}" found in backup file.`);
    } else {
      paymentIds.add(pay.id);
    }

    if (!pay.expenseId || typeof pay.expenseId !== 'string') {
      errors.push(`Payment "${pay.id || idx}" is missing a parent "expenseId".`);
    } else if (!expenseIds.has(pay.expenseId)) {
      errors.push(`Payment "${pay.id}" references non-existent expenseId "${pay.expenseId}".`);
    }

    if (pay.amount === undefined || !isValidMinorAmount(pay.amount) || pay.amount <= 0) {
      errors.push(`Payment "${pay.id}" has invalid or non-positive amount: ${pay.amount}`);
    }

    if (!pay.paymentDate || typeof pay.paymentDate !== 'string') {
      errors.push(`Payment "${pay.id}" is missing a paymentDate.`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    parsedFile: errors.length === 0 ? (parsed as BackupFile) : undefined,
  };
}
