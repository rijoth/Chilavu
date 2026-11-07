import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Plus,
  Edit,
  Trash2,
  Calendar,
  User,
  Tag,
  ArrowLeft,
  FileText,
  AlertCircle,
  Archive,
} from 'lucide-react';
import { useExpense } from '@/hooks/useExpenses';
import { expenseService } from '@/features/expenses/expenseService';
import { PageHeader } from '@/components/common/PageHeader';
import { CurrencyDisplay } from '@/components/common/CurrencyDisplay';
import { ExpenseStatusBadge } from '@/components/expenses/ExpenseStatusBadge';
import { ExpenseFormModal } from '@/components/expenses/ExpenseFormModal';
import { PaymentFormModal } from '@/components/payments/PaymentFormModal';
import { PaymentHistoryList } from '@/components/payments/PaymentHistoryList';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { formatDate } from '@/lib/dates';
import { useUIStore } from '@/stores/uiStore';
import type { Payment } from '@/types/payment';

export const ExpenseDetailsPage: React.FC = () => {
  const { eventId, expenseId } = useParams<{ eventId: string; expenseId: string }>();
  const navigate = useNavigate();
  const showToast = useUIStore((s) => s.showToast);

  const { expense, parentEvent, payments, summary, isLoading, notFound } = useExpense(expenseId);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentToEdit, setPaymentToEdit] = useState<Payment | undefined>(undefined);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex-1 p-6 space-y-4">
        <div className="h-10 w-48 bg-surface rounded-xl animate-pulse" />
        <div className="h-40 bg-surface rounded-2xl animate-pulse" />
        <div className="h-48 bg-surface rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (notFound || !expense || !parentEvent || !summary) {
    return (
      <div className="flex-1 p-6 flex flex-col items-center justify-center text-center">
        <h2 className="text-xl font-bold text-text mb-2">Expense Not Found</h2>
        <p className="text-sm text-subtle mb-6">
          This expense does not exist or has been removed.
        </p>
        <button
          type="button"
          onClick={() => navigate(eventId ? `/events/${eventId}` : '/')}
          className="px-5 py-2.5 rounded-xl bg-pine text-white text-sm font-semibold"
        >
          Back to Event
        </button>
      </div>
    );
  }

  const currency = parentEvent.currency;
  const isArchived = Boolean(parentEvent.archivedAt);

  const handleDeleteExpense = async () => {
    try {
      await expenseService.deleteExpense(expense.id);
      showToast('Expense and associated payments deleted', 'info');
      navigate(`/events/${expense.eventId}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to delete expense';
      showToast(msg, 'error');
    }
  };

  const handleEditPayment = (payment: Payment) => {
    setPaymentToEdit(payment);
    setIsPaymentModalOpen(true);
  };

  const handleRecordNewPayment = () => {
    setPaymentToEdit(undefined);
    setIsPaymentModalOpen(true);
  };

  return (
    <div className="flex-1 flex flex-col pb-24">
      {/* Header */}
      <PageHeader
        title={expense.name}
        subtitle={`${parentEvent.name} · ${currency}`}
        hasBack={true}
        backTo={`/events/${parentEvent.id}`}
        rightAction={
          !isArchived ? (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(true)}
                className="p-2 text-subtle hover:text-text hover:bg-surface rounded-xl min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Edit expense"
              >
                <Edit className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => setIsDeleteDialogOpen(true)}
                className="p-2 text-subtle hover:text-love hover:bg-love/15 rounded-xl min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Delete expense"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ) : undefined
        }
      />

      <div className="px-4 sm:px-6 pt-4 space-y-5">
        {/* Archived Banner if parent event is archived */}
        {isArchived && (
          <div className="p-3.5 rounded-2xl bg-surface/80 border border-iris/30 flex items-center gap-2.5 text-xs text-subtle shadow-xs">
            <Archive className="w-4 h-4 text-iris shrink-0" />
            <span>This expense belongs to an archived event and is in read-only mode.</span>
          </div>
        )}
        {/* Metadata & Status Card */}
        <div className="p-4 rounded-2xl bg-surface border border-overlay flex flex-wrap items-center justify-between gap-3 shadow-xs">
          <div className="flex flex-wrap items-center gap-3 text-xs text-subtle">
            {expense.category && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-overlay text-text font-medium capitalize">
                <Tag className="w-3.5 h-3.5 text-muted" />
                {expense.category}
              </span>
            )}
            {expense.vendor && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-overlay text-text font-medium">
                <User className="w-3.5 h-3.5 text-muted" />
                {expense.vendor}
              </span>
            )}
            {expense.dueDate && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-overlay text-text font-medium">
                <Calendar className="w-3.5 h-3.5 text-muted" />
                Due {formatDate(expense.dueDate)}
              </span>
            )}
          </div>

          <div>
            <ExpenseStatusBadge status={summary.status} />
          </div>
        </div>

        {/* Notes if any */}
        {expense.notes && (
          <div className="p-3.5 rounded-xl bg-surface/50 border border-overlay text-xs text-subtle leading-relaxed flex items-start gap-2.5">
            <FileText className="w-4 h-4 text-muted shrink-0 mt-0.5" />
            <span>{expense.notes}</span>
          </div>
        )}

        {/* Financial Breakdown Card */}
        <section className="rounded-2xl bg-surface border border-overlay p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted">
              Expense Financials
            </span>
            <span className="text-xs font-mono font-bold text-subtle">{currency}</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <span className="text-xs text-subtle block mb-1">Expected</span>
              <CurrencyDisplay
                amount={summary.expected}
                currency={currency}
                className="text-base sm:text-xl font-bold block"
              />
            </div>
            <div>
              <span className="text-xs text-subtle block mb-1">Paid</span>
              <CurrencyDisplay
                amount={summary.paid}
                currency={currency}
                highlightStatus="paid"
                className="text-base sm:text-xl font-bold block"
              />
            </div>
            <div className="text-right">
              <span className="text-xs text-subtle block mb-1">
                {summary.overpaid > 0 ? 'Overpaid' : 'Pending'}
              </span>
              <CurrencyDisplay
                amount={summary.overpaid > 0 ? summary.overpaid : summary.pending}
                currency={currency}
                highlightStatus={
                  summary.overpaid > 0 ? 'overpaid' : summary.pending > 0 ? 'pending' : 'neutral'
                }
                className="text-base sm:text-xl font-bold block"
              />
            </div>
          </div>

          {/* Progress bar */}
          <div className="pt-2 border-t border-overlay/60">
            <div className="flex justify-between items-center text-xs text-subtle mb-1.5">
              <span>Payment Progress</span>
              <span className="font-mono font-medium text-text">{summary.progress}%</span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-overlay overflow-hidden">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  summary.progress >= 100
                    ? 'bg-foam'
                    : summary.progress > 0
                    ? 'bg-gold'
                    : 'bg-muted'
                }`}
                style={{ width: `${Math.min(100, Math.max(0, summary.progress))}%` }}
              />
            </div>
          </div>
        </section>

        {/* Payment History Section */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-base font-bold text-text">Payment History</h3>
              <p className="text-xs text-subtle">
                {payments.length} {payments.length === 1 ? 'installment' : 'installments'} logged
              </p>
            </div>
          </div>

          <PaymentHistoryList
            payments={payments}
            currency={currency}
            onEditPayment={handleEditPayment}
            readOnly={isArchived}
          />
        </section>
      </div>

      {/* Floating Action Button (hidden in read-only mode) */}
      {!isArchived && (
        <button
          type="button"
          onClick={handleRecordNewPayment}
          className="fixed bottom-6 right-6 z-30 w-14 h-14 rounded-2xl bg-pine hover:bg-pine/90 text-white shadow-xl flex items-center justify-center transition-transform active:scale-90 hover:scale-105"
          aria-label="Record payment"
        >
          <Plus className="w-7 h-7 stroke-[2.2]" />
        </button>
      )}

      {/* Record or Edit Payment Modal */}
      <PaymentFormModal
        isOpen={isPaymentModalOpen}
        onClose={() => {
          setIsPaymentModalOpen(false);
          setPaymentToEdit(undefined);
        }}
        expenseId={expense.id}
        currency={currency}
        pendingAmount={summary.pending}
        paymentToEdit={paymentToEdit}
      />

      {/* Edit Expense Modal */}
      <ExpenseFormModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        eventId={parentEvent.id}
        currency={currency}
        expenseToEdit={expense}
      />

      {/* Delete Expense Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        title="Delete Expense"
        message={`Are you sure you want to delete "${expense.name}"? This will also remove all ${payments.length} recorded payments for this expense.`}
        confirmLabel="Delete Expense"
        isDestructive={true}
        onConfirm={handleDeleteExpense}
        onCancel={() => setIsDeleteDialogOpen(false)}
      />
    </div>
  );
};
