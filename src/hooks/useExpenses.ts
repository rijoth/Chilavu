import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/database';
import { calculateExpenseSummary } from '@/features/expenses/expenseCalculations';
import type { Expense, ExpenseSummary } from '@/types/expense';
import type { Payment } from '@/types/payment';

export interface ExpenseWithSummary extends Expense {
  summary: ExpenseSummary;
  payments: Payment[];
}

export function useExpenses(eventId?: string) {
  const expensesWithSummary = useLiveQuery(async (): Promise<ExpenseWithSummary[]> => {
    if (!eventId) return [];
    const expenses = await db.expenses.where('eventId').equals(eventId).toArray();
    const allPayments = await db.payments.toArray();

    return expenses.map((expense) => {
      const payments = allPayments.filter((p) => p.expenseId === expense.id);
      const summary = calculateExpenseSummary(expense, payments);

      return {
        ...expense,
        summary,
        payments,
      };
    });
  }, [eventId]);

  return {
    expenses: expensesWithSummary ?? [],
    isLoading: expensesWithSummary === undefined,
  };
}

export function useExpense(expenseId?: string) {
  const data = useLiveQuery(async () => {
    if (!expenseId) return null;
    const expense = await db.expenses.get(expenseId);
    if (!expense) return null;

    const parentEvent = await db.events.get(expense.eventId);
    const payments = await db.payments.where('expenseId').equals(expenseId).reverse().sortBy('paymentDate');
    const summary = calculateExpenseSummary(expense, payments);

    return {
      expense,
      parentEvent,
      payments,
      summary,
    };
  }, [expenseId]);

  return {
    expense: data?.expense,
    parentEvent: data?.parentEvent,
    payments: data?.payments ?? [],
    summary: data?.summary,
    isLoading: data === undefined,
    notFound: data === null,
  };
}
