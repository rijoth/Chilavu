import { db } from '@/db/database';
import type { Payment } from '@/types/payment';
import { generateId } from '@/lib/ids';
import { validatePaymentInput, type PaymentInput } from './paymentValidation';

export const paymentService = {
  async getPaymentsByExpense(expenseId: string): Promise<Payment[]> {
    return await db.payments.where('expenseId').equals(expenseId).reverse().sortBy('paymentDate');
  },

  async getAllPayments(): Promise<Payment[]> {
    return await db.payments.toArray();
  },

  async getPayment(id: string): Promise<Payment | undefined> {
    return await db.payments.get(id);
  },

  async recordPayment(expenseId: string, input: PaymentInput): Promise<Payment> {
    // Validate parent expense exists
    const parentExpense = await db.expenses.get(expenseId);
    if (!parentExpense) {
      throw new Error(`Cannot record payment: Expense ${expenseId} does not exist`);
    }

    const validation = validatePaymentInput(input);
    if (!validation.isValid) {
      const firstError = Object.values(validation.errors)[0];
      throw new Error(firstError || 'Invalid payment input');
    }

    const now = new Date().toISOString();
    const newPayment: Payment = {
      id: generateId(),
      expenseId,
      amount: Math.floor(input.amount),
      paymentDate: input.paymentDate,
      method: input.method || undefined,
      notes: input.notes?.trim() || undefined,
      createdAt: now,
      updatedAt: now,
    };

    await db.payments.add(newPayment);
    return newPayment;
  },

  async updatePayment(id: string, updates: Partial<PaymentInput>): Promise<Payment> {
    const existing = await db.payments.get(id);
    if (!existing) {
      throw new Error(`Payment not found: ${id}`);
    }

    const mergedInput: PaymentInput = {
      amount: updates.amount !== undefined ? updates.amount : existing.amount,
      paymentDate: updates.paymentDate !== undefined ? updates.paymentDate : existing.paymentDate,
      method: updates.method !== undefined ? updates.method : existing.method,
      notes: updates.notes !== undefined ? updates.notes : existing.notes,
    };

    const validation = validatePaymentInput(mergedInput);
    if (!validation.isValid) {
      const firstError = Object.values(validation.errors)[0];
      throw new Error(firstError || 'Invalid payment update');
    }

    const now = new Date().toISOString();
    const updatedPayment: Payment = {
      ...existing,
      amount: Math.floor(mergedInput.amount),
      paymentDate: mergedInput.paymentDate,
      method: mergedInput.method || undefined,
      notes: mergedInput.notes?.trim() || undefined,
      updatedAt: now,
    };

    await db.payments.put(updatedPayment);
    return updatedPayment;
  },

  async deletePayment(id: string): Promise<void> {
    await db.payments.delete(id);
  },
};
