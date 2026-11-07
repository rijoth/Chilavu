import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import type { Payment, PaymentMethod } from '@/types/payment';
import { parseToMinorUnits, minorUnitsToInputValue, COMMON_CURRENCIES, formatCurrency } from '@/lib/currency';
import { getTodayDateString } from '@/lib/dates';
import { paymentService } from '@/features/payments/paymentService';
import { useUIStore } from '@/stores/uiStore';

const PAYMENT_METHODS: { id: PaymentMethod; label: string }[] = [
  { id: 'cash', label: 'Cash' },
  { id: 'upi', label: 'UPI / QR' },
  { id: 'bank_transfer', label: 'Bank Transfer / NEFT / IMPS' },
  { id: 'card', label: 'Credit / Debit Card' },
  { id: 'cheque', label: 'Cheque' },
  { id: 'other', label: 'Other' },
];

interface PaymentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  expenseId: string;
  currency: string;
  pendingAmount: number;
  paymentToEdit?: Payment;
  onSuccess?: (payment: Payment) => void;
}

export const PaymentFormModal: React.FC<PaymentFormModalProps> = ({
  isOpen,
  onClose,
  expenseId,
  currency,
  pendingAmount,
  paymentToEdit,
  onSuccess,
}) => {
  const showToast = useUIStore((s) => s.showToast);

  const [amountInput, setAmountInput] = useState('');
  const [paymentDate, setPaymentDate] = useState(getTodayDateString());
  const [method, setMethod] = useState<PaymentMethod | ''>('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (paymentToEdit) {
        setAmountInput(minorUnitsToInputValue(paymentToEdit.amount, currency));
        setPaymentDate(paymentToEdit.paymentDate);
        setMethod(paymentToEdit.method || '');
        setNotes(paymentToEdit.notes || '');
      } else {
        // Pre-fill amount with outstanding amount if > 0 as convenient default
        setAmountInput(pendingAmount > 0 ? minorUnitsToInputValue(pendingAmount, currency) : '');
        setPaymentDate(getTodayDateString());
        setMethod('upi');
        setNotes('');
      }
      setErrors({});
    }
  }, [isOpen, paymentToEdit, currency, pendingAmount]);

  if (!isOpen) return null;

  const currentEnteredMinor = parseToMinorUnits(amountInput, currency);
  const isOverpaying =
    !paymentToEdit && pendingAmount > 0 && currentEnteredMinor > pendingAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!amountInput.trim()) {
      setErrors({ amount: 'Payment amount is required' });
      return;
    }

    if (currentEnteredMinor <= 0) {
      setErrors({ amount: 'Payment amount must be greater than zero' });
      return;
    }

    if (!paymentDate) {
      setErrors({ paymentDate: 'Payment date is required' });
      return;
    }

    try {
      setIsSubmitting(true);
      if (paymentToEdit) {
        const updated = await paymentService.updatePayment(paymentToEdit.id, {
          amount: currentEnteredMinor,
          paymentDate,
          method: (method as PaymentMethod) || undefined,
          notes: notes.trim() || undefined,
        });
        showToast('Payment updated', 'success');
        onSuccess?.(updated);
      } else {
        const created = await paymentService.recordPayment(expenseId, {
          amount: currentEnteredMinor,
          paymentDate,
          method: (method as PaymentMethod) || undefined,
          notes: notes.trim() || undefined,
        });
        showToast('Payment recorded', 'success');
        onSuccess?.(created);
      }
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to record payment';
      setErrors({ form: msg });
      showToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currencySymbol = COMMON_CURRENCIES.find((c) => c.code === currency)?.symbol || currency;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-t-3xl sm:rounded-2xl bg-surface border border-overlay shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-overlay/60">
          <h2 className="text-lg font-bold text-text">
            {paymentToEdit ? 'Edit Payment' : 'Record Payment'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-subtle hover:text-text rounded-xl hover:bg-overlay min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Outstanding Reminder */}
        {!paymentToEdit && (
          <div className="mt-4 p-3 rounded-xl bg-overlay/50 border border-overlay flex items-center justify-between">
            <span className="text-xs text-subtle">Outstanding on this expense:</span>
            <span className="font-mono text-sm font-bold text-love">
              {formatCurrency(pendingAmount, currency)}
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {errors.form && (
            <div className="p-3 rounded-xl bg-love/15 border border-love/30 text-love text-sm">
              {errors.form}
            </div>
          )}

          {/* Amount */}
          <div>
            <label htmlFor="pay-amount" className="block text-xs font-semibold text-subtle uppercase tracking-wider mb-1.5">
              Payment Amount ({currency}) <span className="text-love">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-3.5 text-subtle font-mono text-sm">
                {currencySymbol}
              </span>
              <input
                id="pay-amount"
                type="text"
                required
                inputMode="decimal"
                placeholder="0.00"
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-overlay/50 border border-overlay text-text font-mono text-base font-semibold placeholder:text-muted focus:outline-none focus:border-pine focus:ring-1 focus:ring-pine transition"
              />
            </div>
            {errors.amount && <p className="mt-1 text-xs text-love">{errors.amount}</p>}

            {/* Explicit Overpayment Notice */}
            {isOverpaying && (
              <div className="mt-2 p-2.5 rounded-xl bg-iris/15 border border-iris/30 text-iris text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>
                  This payment exceeds the pending amount by{' '}
                  <strong className="font-mono">
                    {formatCurrency(currentEnteredMinor - pendingAmount, currency)}
                  </strong>
                  . It will be recorded as an overpayment.
                </span>
              </div>
            )}
          </div>

          {/* Date & Payment Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="pay-date" className="block text-xs font-semibold text-subtle uppercase tracking-wider mb-1.5">
                Payment Date <span className="text-love">*</span>
              </label>
              <input
                id="pay-date"
                type="date"
                required
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-overlay/50 border border-overlay text-text focus:outline-none focus:border-pine focus:ring-1 focus:ring-pine transition text-sm"
              />
              {errors.paymentDate && (
                <p className="mt-1 text-xs text-love">{errors.paymentDate}</p>
              )}
            </div>

            <div>
              <label htmlFor="pay-method" className="block text-xs font-semibold text-subtle uppercase tracking-wider mb-1.5">
                Payment Method
              </label>
              <select
                id="pay-method"
                value={method}
                onChange={(e) => setMethod(e.target.value as PaymentMethod)}
                className="w-full px-4 py-3 rounded-xl bg-overlay/50 border border-overlay text-text focus:outline-none focus:border-pine focus:ring-1 focus:ring-pine transition text-sm"
              >
                <option value="" className="bg-surface text-muted">
                  Select method (Optional)
                </option>
                {PAYMENT_METHODS.map((m) => (
                  <option key={m.id} value={m.id} className="bg-surface text-text">
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="pay-notes" className="block text-xs font-semibold text-subtle uppercase tracking-wider mb-1.5">
              Notes (Optional)
            </label>
            <input
              id="pay-notes"
              type="text"
              placeholder="e.g. Advance via GPay, Ref #12345"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-overlay/50 border border-overlay text-text placeholder:text-muted focus:outline-none focus:border-pine focus:ring-1 focus:ring-pine transition text-sm"
            />
          </div>

          {/* Action buttons */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-overlay/60">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl border border-overlay text-text hover:bg-overlay font-medium text-sm transition min-h-[44px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-pine hover:bg-pine/90 text-white font-semibold text-sm transition shadow-sm min-h-[44px] active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : paymentToEdit ? 'Save Changes' : 'Record Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
