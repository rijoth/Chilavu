import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/database';
import type { Payment } from '@/types/payment';

export function usePayments(expenseId?: string) {
  const payments = useLiveQuery(async (): Promise<Payment[]> => {
    if (!expenseId) return [];
    return await db.payments.where('expenseId').equals(expenseId).reverse().sortBy('paymentDate');
  }, [expenseId]);

  return {
    payments: payments ?? [],
    isLoading: payments === undefined,
  };
}
