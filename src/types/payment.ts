export type PaymentMethod =
  | 'cash'
  | 'upi'
  | 'bank_transfer'
  | 'card'
  | 'cheque'
  | 'other';

export interface Payment {
  id: string;
  expenseId: string;
  amount: number; // Integer minor units
  paymentDate: string; // YYYY-MM-DD
  method?: PaymentMethod;
  notes?: string;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}
