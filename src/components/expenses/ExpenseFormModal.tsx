import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { Expense, ExpenseCategory } from '@/types/expense';
import { parseToMinorUnits, minorUnitsToInputValue, COMMON_CURRENCIES } from '@/lib/currency';
import { expenseService } from '@/features/expenses/expenseService';
import { useUIStore } from '@/stores/uiStore';

const CATEGORIES: { id: ExpenseCategory; label: string }[] = [
  { id: 'venue', label: 'Venue' },
  { id: 'catering', label: 'Food & Catering' },
  { id: 'photography', label: 'Photography' },
  { id: 'decoration', label: 'Decoration' },
  { id: 'transportation', label: 'Transportation' },
  { id: 'accommodation', label: 'Accommodation' },
  { id: 'entertainment', label: 'Entertainment' },
  { id: 'clothing', label: 'Clothing & Attire' },
  { id: 'gifts', label: 'Gifts & Favors' },
  { id: 'other', label: 'Other' },
];

interface ExpenseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  currency: string;
  expenseToEdit?: Expense;
  onSuccess?: (expense: Expense) => void;
}

export const ExpenseFormModal: React.FC<ExpenseFormModalProps> = ({
  isOpen,
  onClose,
  eventId,
  currency,
  expenseToEdit,
  onSuccess,
}) => {
  const showToast = useUIStore((s) => s.showToast);

  const [name, setName] = useState('');
  const [expectedAmountInput, setExpectedAmountInput] = useState('');
  const [category, setCategory] = useState<string>('other');
  const [vendor, setVendor] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (expenseToEdit) {
        setName(expenseToEdit.name);
        setExpectedAmountInput(minorUnitsToInputValue(expenseToEdit.expectedAmount, currency));
        setCategory(expenseToEdit.category || 'other');
        setVendor(expenseToEdit.vendor || '');
        setDueDate(expenseToEdit.dueDate || '');
        setNotes(expenseToEdit.notes || '');
      } else {
        setName('');
        setExpectedAmountInput('');
        setCategory('venue');
        setVendor('');
        setDueDate('');
        setNotes('');
      }
      setErrors({});
    }
  }, [isOpen, expenseToEdit, currency]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrors({ name: 'Expense name is required' });
      return;
    }

    if (!expectedAmountInput.trim()) {
      setErrors({ expectedAmount: 'Expected amount is required' });
      return;
    }

    const minorAmount = parseToMinorUnits(expectedAmountInput, currency);

    try {
      setIsSubmitting(true);
      if (expenseToEdit) {
        const updated = await expenseService.updateExpense(expenseToEdit.id, {
          name: trimmedName,
          expectedAmount: minorAmount,
          category,
          vendor: vendor.trim() || undefined,
          dueDate: dueDate || undefined,
          notes: notes.trim() || undefined,
        });
        showToast('Expense updated', 'success');
        onSuccess?.(updated);
      } else {
        const created = await expenseService.createExpense(eventId, {
          name: trimmedName,
          expectedAmount: minorAmount,
          category,
          vendor: vendor.trim() || undefined,
          dueDate: dueDate || undefined,
          notes: notes.trim() || undefined,
        });
        showToast('Expense added', 'success');
        onSuccess?.(created);
      }
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save expense';
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
            {expenseToEdit ? 'Edit Expense' : 'Add Expense'}
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

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {errors.form && (
            <div className="p-3 rounded-xl bg-love/15 border border-love/30 text-love text-sm">
              {errors.form}
            </div>
          )}

          {/* Name */}
          <div>
            <label htmlFor="exp-name" className="block text-xs font-semibold text-subtle uppercase tracking-wider mb-1.5">
              Expense Name <span className="text-love">*</span>
            </label>
            <input
              id="exp-name"
              type="text"
              required
              placeholder="e.g. Catering advance, Main Stage Decor"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-overlay/50 border border-overlay text-text placeholder:text-muted focus:outline-none focus:border-pine focus:ring-1 focus:ring-pine transition text-sm"
            />
            {errors.name && <p className="mt-1 text-xs text-love">{errors.name}</p>}
          </div>

          {/* Expected Amount & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="exp-amount" className="block text-xs font-semibold text-subtle uppercase tracking-wider mb-1.5">
                Expected Amount ({currency}) <span className="text-love">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-3.5 text-subtle font-mono text-sm">
                  {currencySymbol}
                </span>
                <input
                  id="exp-amount"
                  type="text"
                  required
                  inputMode="decimal"
                  placeholder="0.00"
                  value={expectedAmountInput}
                  onChange={(e) => setExpectedAmountInput(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-overlay/50 border border-overlay text-text font-mono placeholder:text-muted focus:outline-none focus:border-pine focus:ring-1 focus:ring-pine transition text-sm"
                />
              </div>
              {errors.expectedAmount && (
                <p className="mt-1 text-xs text-love">{errors.expectedAmount}</p>
              )}
            </div>

            <div>
              <label htmlFor="exp-category" className="block text-xs font-semibold text-subtle uppercase tracking-wider mb-1.5">
                Category
              </label>
              <select
                id="exp-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-overlay/50 border border-overlay text-text focus:outline-none focus:border-pine focus:ring-1 focus:ring-pine transition text-sm"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id} className="bg-surface text-text">
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Vendor & Due Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="exp-vendor" className="block text-xs font-semibold text-subtle uppercase tracking-wider mb-1.5">
                Vendor / Contact (Optional)
              </label>
              <input
                id="exp-vendor"
                type="text"
                placeholder="Vendor name or phone"
                value={vendor}
                onChange={(e) => setVendor(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-overlay/50 border border-overlay text-text placeholder:text-muted focus:outline-none focus:border-pine focus:ring-1 focus:ring-pine transition text-sm"
              />
            </div>

            <div>
              <label htmlFor="exp-due" className="block text-xs font-semibold text-subtle uppercase tracking-wider mb-1.5">
                Due Date (Optional)
              </label>
              <input
                id="exp-due"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-overlay/50 border border-overlay text-text focus:outline-none focus:border-pine focus:ring-1 focus:ring-pine transition text-sm"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="exp-notes" className="block text-xs font-semibold text-subtle uppercase tracking-wider mb-1.5">
              Notes (Optional)
            </label>
            <textarea
              id="exp-notes"
              rows={2}
              placeholder="Terms, quotation reference, or contact info"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-overlay/50 border border-overlay text-text placeholder:text-muted focus:outline-none focus:border-pine focus:ring-1 focus:ring-pine transition text-sm resize-none"
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
              {isSubmitting ? 'Saving...' : expenseToEdit ? 'Save Changes' : 'Add Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
