import { isValidMinorAmount } from '@/lib/currency';
import { isValidDateString } from '@/lib/dates';

export interface ExpenseInput {
  name: string;
  expectedAmount: number;
  category?: string;
  vendor?: string;
  dueDate?: string;
  notes?: string;
}

export interface ExpenseValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export function validateExpenseInput(input: Partial<ExpenseInput>): ExpenseValidationResult {
  const errors: Record<string, string> = {};

  if (!input.name || !input.name.trim()) {
    errors.name = 'Expense name is required';
  } else if (input.name.trim().length > 100) {
    errors.name = 'Expense name must be 100 characters or fewer';
  }

  if (input.expectedAmount === undefined || input.expectedAmount === null) {
    errors.expectedAmount = 'Expected amount is required';
  } else if (!isValidMinorAmount(input.expectedAmount)) {
    errors.expectedAmount = 'Expected amount must be a valid non-negative number';
  }

  if (input.dueDate && !isValidDateString(input.dueDate)) {
    errors.dueDate = 'Due date must be a valid date';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
