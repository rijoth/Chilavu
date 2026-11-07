export type ExpenseCategory =
  | 'venue'
  | 'catering'
  | 'photography'
  | 'decoration'
  | 'transportation'
  | 'accommodation'
  | 'entertainment'
  | 'clothing'
  | 'gifts'
  | 'other';

export interface Expense {
  id: string;
  eventId: string;
  name: string;
  category?: string;
  expectedAmount: number; // Integer minor units
  vendor?: string;
  dueDate?: string; // YYYY-MM-DD
  notes?: string;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

export type PaymentStatus = 'unpaid' | 'partial' | 'paid' | 'overpaid';

export interface ExpenseSummary {
  expected: number;
  paid: number;
  pending: number;
  overpaid: number;
  status: PaymentStatus;
  progress: number; // 0 - 100 percentage
}
