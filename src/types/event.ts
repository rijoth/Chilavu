export interface Event {
  id: string;
  name: string;
  description?: string;
  eventDate?: string; // YYYY-MM-DD
  currency: string; // ISO 4217, e.g. 'INR', 'USD', 'EUR', 'GBP'
  budgetAmount?: number; // Integer minor units (e.g. 50000000 for ₹5,00,000.00)
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  archivedAt?: string; // ISO 8601, missing/undefined means not archived
}

export interface EventSummary {
  committed: number; // Sum of expenses' expectedAmount
  paid: number; // Sum of all associated payments' amount
  pending: number; // Sum of expense pending amounts
  overpaid: number; // Sum of expense overpaid amounts
  budgetRemaining?: number; // budgetAmount - committed
  paymentProgress: number; // clamped 0 - 100 percentage
}
