import { isValidMinorAmount } from '@/lib/currency';
import { isValidDateString } from '@/lib/dates';
import type { PaymentMethod } from '@/types/payment';

export interface PaymentInput {
  amount: number;
  paymentDate: string;
  method?: PaymentMethod;
  notes?: string;
}

export interface PaymentValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export function validatePaymentInput(input: Partial<PaymentInput>): PaymentValidationResult {
  const errors: Record<string, string> = {};

  if (input.amount === undefined || input.amount === null) {
    errors.amount = 'Payment amount is required';
  } else if (!isValidMinorAmount(input.amount) || input.amount <= 0) {
    errors.amount = 'Payment amount must be greater than zero';
  }

  if (!input.paymentDate || !input.paymentDate.trim()) {
    errors.paymentDate = 'Payment date is required';
  } else if (!isValidDateString(input.paymentDate)) {
    errors.paymentDate = 'Payment date must be a valid date';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
