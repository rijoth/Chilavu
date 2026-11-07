import type { Expense, ExpenseSummary, PaymentStatus } from '@/types/expense';
import type { Payment } from '@/types/payment';
import type { Event, EventSummary } from '@/types/event';

/**
 * Calculates financial summary for a single expense based on its expected amount
 * and its associated payments.
 * Pure function: Deterministic, no side effects, safe integer math.
 */
export function calculateExpenseSummary(
  expense: Pick<Expense, 'expectedAmount'>,
  payments: Pick<Payment, 'amount'>[] = []
): ExpenseSummary {
  const expected = Math.max(0, Math.floor(expense.expectedAmount || 0));
  
  const paid = payments.reduce((sum, p) => sum + Math.max(0, Math.floor(p.amount || 0)), 0);

  const pending = Math.max(0, expected - paid);
  const overpaid = Math.max(0, paid - expected);

  let status: PaymentStatus;
  if (paid === 0) {
    status = 'unpaid';
  } else if (paid < expected) {
    status = 'partial';
  } else if (paid === expected) {
    status = 'paid';
  } else {
    status = 'overpaid';
  }

  // Visual progress clamped 0 - 100%
  const progress = expected > 0 ? Math.min(100, Math.max(0, Math.round((paid / expected) * 100))) : (paid > 0 ? 100 : 0);

  return {
    expected,
    paid,
    pending,
    overpaid,
    status,
    progress,
  };
}

/**
 * Calculates aggregate financial summary for an event across all its expenses and payments.
 * Note: Event pending is SUM(expense.pending) and overpaid is SUM(expense.overpaid).
 * Pure function.
 */
export function calculateEventSummary(
  event: Pick<Event, 'budgetAmount'>,
  expenses: Pick<Expense, 'id' | 'expectedAmount'>[],
  payments: Pick<Payment, 'expenseId' | 'amount'>[]
): EventSummary {
  // Group payments by expenseId
  const paymentsByExpense = new Map<string, Pick<Payment, 'amount'>[]>();
  let allPaymentsTotal = 0;

  for (const p of payments) {
    const amt = Math.max(0, Math.floor(p.amount || 0));
    allPaymentsTotal += amt;
    const list = paymentsByExpense.get(p.expenseId) || [];
    list.push(p);
    paymentsByExpense.set(p.expenseId, list);
  }

  let committed = 0;
  let totalPending = 0;
  let totalOverpaid = 0;

  for (const exp of expenses) {
    const expPayments = paymentsByExpense.get(exp.id) || [];
    const expSummary = calculateExpenseSummary(exp, expPayments);
    committed += expSummary.expected;
    totalPending += expSummary.pending;
    totalOverpaid += expSummary.overpaid;
  }

  // Budget remaining: budgetTarget - committed
  let budgetRemaining: number | undefined = undefined;
  if (event.budgetAmount !== undefined && event.budgetAmount !== null) {
    const budget = Math.max(0, Math.floor(event.budgetAmount));
    budgetRemaining = budget - committed;
  }

  // Progress: committed > 0 ? (paid / committed) * 100 : 0
  const paymentProgress =
    committed > 0
      ? Math.min(100, Math.max(0, Math.round((allPaymentsTotal / committed) * 100)))
      : (allPaymentsTotal > 0 ? 100 : 0);

  return {
    committed,
    paid: allPaymentsTotal,
    pending: totalPending,
    overpaid: totalOverpaid,
    budgetRemaining,
    paymentProgress,
  };
}
