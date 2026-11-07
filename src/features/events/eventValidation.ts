import { isValidMinorAmount } from '@/lib/currency';
import { isValidDateString } from '@/lib/dates';

export interface EventInput {
  name: string;
  description?: string;
  eventDate?: string;
  currency: string;
  budgetAmount?: number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export function validateEventInput(input: Partial<EventInput>): ValidationResult {
  const errors: Record<string, string> = {};

  if (!input.name || !input.name.trim()) {
    errors.name = 'Event name is required';
  } else if (input.name.trim().length > 100) {
    errors.name = 'Event name must be 100 characters or fewer';
  }

  if (!input.currency || !input.currency.trim()) {
    errors.currency = 'Currency is required';
  }

  if (input.budgetAmount !== undefined && input.budgetAmount !== null) {
    if (!isValidMinorAmount(input.budgetAmount)) {
      errors.budgetAmount = 'Budget must be a valid non-negative amount';
    }
  }

  if (input.eventDate && !isValidDateString(input.eventDate)) {
    errors.eventDate = 'Event date must be a valid date';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
