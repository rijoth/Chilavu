import React, { useState } from 'react';
import { Calendar, CreditCard, Edit2, Trash2, Tag } from 'lucide-react';
import type { Payment } from '@/types/payment';
import { formatDate } from '@/lib/dates';
import { CurrencyDisplay } from '@/components/common/CurrencyDisplay';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { paymentService } from '@/features/payments/paymentService';
import { useUIStore } from '@/stores/uiStore';

interface PaymentHistoryListProps {
  payments: Payment[];
  currency: string;
  onEditPayment: (payment: Payment) => void;
  readOnly?: boolean;
}

export const PaymentHistoryList: React.FC<PaymentHistoryListProps> = ({
  payments,
  currency,
  onEditPayment,
  readOnly = false,
}) => {
  const showToast = useUIStore((s) => s.showToast);
  const [paymentToDelete, setPaymentToDelete] = useState<Payment | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteConfirm = async () => {
    if (!paymentToDelete) return;
    try {
      setIsDeleting(true);
      await paymentService.deletePayment(paymentToDelete.id);
      showToast('Payment deleted', 'info');
      setPaymentToDelete(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to delete payment';
      showToast(msg, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  if (payments.length === 0) {
    return (
      <div className="p-6 text-center rounded-2xl bg-surface border border-overlay text-subtle text-sm">
        No payments recorded yet. Tap "Record Payment" to log an installment or advance.
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {payments.map((p) => (
          <div
            key={p.id}
            className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-surface border border-overlay shadow-xs hover:border-subtle/40 transition"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <CurrencyDisplay
                  amount={p.amount}
                  currency={currency}
                  highlightStatus="paid"
                  className="text-base sm:text-lg font-bold"
                />
                {p.method && (
                  <span className="px-2 py-0.5 rounded-md bg-overlay text-subtle text-[11px] uppercase font-semibold tracking-wider">
                    {p.method.replace('_', ' ')}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs text-subtle mt-1">
                <span className="flex items-center gap-1 text-muted">
                  <Calendar className="w-3 h-3" />
                  {formatDate(p.paymentDate)}
                </span>
                {p.notes && (
                  <>
                    <span>·</span>
                    <span className="text-text truncate max-w-xs">{p.notes}</span>
                  </>
                )}
              </div>
            </div>

            {!readOnly && (
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => onEditPayment(p)}
                  className="p-2 text-subtle hover:text-text hover:bg-overlay rounded-xl transition min-h-[44px] min-w-[44px] flex items-center justify-center"
                  aria-label="Edit payment"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentToDelete(p)}
                  className="p-2 text-subtle hover:text-love hover:bg-love/10 rounded-xl transition min-h-[44px] min-w-[44px] flex items-center justify-center"
                  aria-label="Delete payment"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <ConfirmDialog
        isOpen={Boolean(paymentToDelete)}
        title="Delete Payment Record"
        message="Are you sure you want to delete this payment record? This will update all expense and event totals."
        confirmLabel={isDeleting ? 'Deleting...' : 'Delete Payment'}
        isDestructive={true}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setPaymentToDelete(null)}
      />
    </>
  );
};
