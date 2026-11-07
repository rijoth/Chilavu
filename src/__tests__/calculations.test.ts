import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateExpenseSummary,
  calculateEventSummary,
} from '../features/expenses/expenseCalculations.ts';

describe('Expense Financial Calculations', () => {
  it('calculates unpaid expense when no payments exist', () => {
    const summary = calculateExpenseSummary({ expectedAmount: 50000 }, []);
    assert.equal(summary.expected, 50000);
    assert.equal(summary.paid, 0);
    assert.equal(summary.pending, 50000);
    assert.equal(summary.overpaid, 0);
    assert.equal(summary.status, 'unpaid');
    assert.equal(summary.progress, 0);
  });

  it('calculates partial payment status correctly', () => {
    const summary = calculateExpenseSummary(
      { expectedAmount: 100000 },
      [{ amount: 30000 }, { amount: 20000 }]
    );
    assert.equal(summary.expected, 100000);
    assert.equal(summary.paid, 50000);
    assert.equal(summary.pending, 50000);
    assert.equal(summary.overpaid, 0);
    assert.equal(summary.status, 'partial');
    assert.equal(summary.progress, 50);
  });

  it('calculates fully paid status when paid equals expected', () => {
    const summary = calculateExpenseSummary(
      { expectedAmount: 80000 },
      [{ amount: 50000 }, { amount: 30000 }]
    );
    assert.equal(summary.expected, 80000);
    assert.equal(summary.paid, 80000);
    assert.equal(summary.pending, 0);
    assert.equal(summary.overpaid, 0);
    assert.equal(summary.status, 'paid');
    assert.equal(summary.progress, 100);
  });

  it('calculates overpaid status when paid exceeds expected', () => {
    const summary = calculateExpenseSummary(
      { expectedAmount: 50000 },
      [{ amount: 60000 }]
    );
    assert.equal(summary.expected, 50000);
    assert.equal(summary.paid, 60000);
    assert.equal(summary.pending, 0);
    assert.equal(summary.overpaid, 10000);
    assert.equal(summary.status, 'overpaid');
    assert.equal(summary.progress, 100);
  });

  it('handles zero expected amount gracefully', () => {
    const unpaidZero = calculateExpenseSummary({ expectedAmount: 0 }, []);
    assert.equal(unpaidZero.status, 'unpaid');
    assert.equal(unpaidZero.pending, 0);
    assert.equal(unpaidZero.progress, 0);

    const paidZero = calculateExpenseSummary({ expectedAmount: 0 }, [{ amount: 5000 }]);
    assert.equal(paidZero.status, 'overpaid');
    assert.equal(paidZero.overpaid, 5000);
    assert.equal(paidZero.progress, 100);
  });
});

describe('Event Financial Calculations', () => {
  it('calculates empty event with no expenses', () => {
    const summary = calculateEventSummary({ budgetAmount: 200000 }, [], []);
    assert.equal(summary.committed, 0);
    assert.equal(summary.paid, 0);
    assert.equal(summary.pending, 0);
    assert.equal(summary.overpaid, 0);
    assert.equal(summary.budgetRemaining, 200000);
    assert.equal(summary.paymentProgress, 0);
  });

  it('calculates mixed expenses, ensuring pending is sum of expense pendings (not MAX(0, committed - paid))', () => {
    // Expense 1: expected 10,000, paid 15,000 (overpaid by 5,000, pending 0)
    // Expense 2: expected 20,000, paid 0 (pending 20,000)
    // Total committed = 30,000. Total paid = 15,000.
    // If someone did MAX(0, committed - paid) they would get 15,000 pending, which is FALSE!
    // The true pending is 20,000 because Expense 2 is still unpaid.
    const expenses = [
      { id: 'exp-1', expectedAmount: 10000 },
      { id: 'exp-2', expectedAmount: 20000 },
    ];
    const payments = [
      { expenseId: 'exp-1', amount: 15000 },
    ];

    const summary = calculateEventSummary({ budgetAmount: 50000 }, expenses, payments);

    assert.equal(summary.committed, 30000);
    assert.equal(summary.paid, 15000);
    assert.equal(summary.pending, 20000); // Must be 20,000!
    assert.equal(summary.overpaid, 5000); // Must be 5,000!
    assert.equal(summary.budgetRemaining, 20000); // 50,000 - 30,000
    assert.equal(summary.paymentProgress, 50); // 15,000 / 30,000 = 50%
  });

  it('calculates budget remaining and negative budget when exceeded', () => {
    const expenses = [{ id: 'e1', expectedAmount: 60000 }];
    const summary = calculateEventSummary({ budgetAmount: 50000 }, expenses, []);

    assert.equal(summary.budgetRemaining, -10000);
  });

  it('clamps payment progress correctly between 0 and 100', () => {
    const expenses = [{ id: 'e1', expectedAmount: 10000 }];
    const payments = [{ expenseId: 'e1', amount: 25000 }]; // 250% paid

    const summary = calculateEventSummary({}, expenses, payments);
    assert.equal(summary.paymentProgress, 100);
  });
});
