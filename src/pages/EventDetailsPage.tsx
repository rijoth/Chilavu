import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Plus,
  FileDown,
  Edit,
  Trash2,
  Calendar,
  MoreVertical,
  Receipt,
  Wallet,
  AlertCircle,
  SearchX,
  X,
} from 'lucide-react';
import { useEvent } from '@/hooks/useEvents';
import { useExpenses } from '@/hooks/useExpenses';
import { useDebounce } from '@/hooks/useDebounce';
import { filterBySearch } from '@/features/expenses/expenseSearch';
import { eventService } from '@/features/events/eventService';
import { pdfExportService } from '@/features/reports/pdfExportService';
import { PageHeader } from '@/components/common/PageHeader';
import { CurrencyDisplay } from '@/components/common/CurrencyDisplay';
import { ExpenseCard } from '@/components/expenses/ExpenseCard';
import { ExpenseFormModal } from '@/components/expenses/ExpenseFormModal';
import { EventFormModal } from '@/components/events/EventFormModal';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { EmptyState } from '@/components/common/EmptyState';
import { SearchBar } from '@/components/common/SearchBar';
import { formatDate } from '@/lib/dates';
import { useUIStore } from '@/stores/uiStore';

export const EventDetailsPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const showToast = useUIStore((s) => s.showToast);

  const { event, summary, isLoading: isEventLoading, notFound } = useEvent(eventId);
  const { expenses, isLoading: isExpensesLoading } = useExpenses(eventId);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedQuery = useDebounce(searchQuery, 150);

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  // Filter expenses live by name or vendor using domain pure helper
  const filteredExpenses = React.useMemo(
    () => filterBySearch(expenses, debouncedQuery),
    [expenses, debouncedQuery]
  );

  const isLoading = isEventLoading || isExpensesLoading;

  if (isLoading) {
    return (
      <div className="flex-1 p-6 space-y-4">
        <div className="h-10 w-48 bg-surface rounded-xl animate-pulse" />
        <div className="h-40 bg-surface rounded-2xl animate-pulse" />
        <div className="h-11 bg-surface rounded-2xl animate-pulse" />
        <div className="h-64 bg-surface rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (notFound || !event || !summary) {
    return (
      <div className="flex-1 p-6 flex flex-col items-center justify-center text-center">
        <h2 className="text-xl font-bold text-text mb-2">Event Not Found</h2>
        <p className="text-sm text-subtle mb-6">
          The event you are looking for does not exist or has been removed.
        </p>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="px-5 py-2.5 rounded-xl bg-pine text-white text-sm font-semibold"
        >
          Back to Events
        </button>
      </div>
    );
  }

  const handleExportPdf = async () => {
    setIsMenuOpen(false);
    try {
      setIsExportingPdf(true);
      showToast('Generating PDF report...', 'info');
      // Gather all payments for the PDF
      const allPayments = expenses.flatMap((e) => e.payments);
      await pdfExportService.generateEventReport(event, expenses, allPayments);
      showToast('PDF downloaded successfully', 'success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to export PDF';
      showToast(msg, 'error');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleDeleteEvent = async () => {
    try {
      await eventService.deleteEvent(event.id);
      showToast('Event deleted', 'info');
      navigate('/');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to delete event';
      showToast(msg, 'error');
    }
  };

  const hasBudget = event.budgetAmount !== undefined && event.budgetAmount !== null;
  const isOverBudget = hasBudget && summary.budgetRemaining !== undefined && summary.budgetRemaining < 0;

  return (
    <div className="flex-1 flex flex-col pb-24">
      {/* Header */}
      <PageHeader
        title={event.name}
        subtitle={
          event.eventDate
            ? `${formatDate(event.eventDate)} · ${event.currency}`
            : event.currency
        }
        hasBack={true}
        backTo="/"
        rightAction={
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 text-subtle hover:text-text hover:bg-surface rounded-xl min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Event actions"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {isMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsMenuOpen(false)}
                />
                <div className="absolute right-0 top-12 z-50 w-52 rounded-2xl bg-surface border border-overlay shadow-xl p-1.5 animate-in fade-in duration-150">
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      setIsEditModalOpen(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-text hover:bg-overlay rounded-xl transition"
                  >
                    <Edit className="w-4 h-4 text-subtle" />
                    Edit Event Details
                  </button>
                  <button
                    type="button"
                    onClick={handleExportPdf}
                    disabled={isExportingPdf}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-text hover:bg-overlay rounded-xl transition"
                  >
                    <FileDown className="w-4 h-4 text-foam" />
                    {isExportingPdf ? 'Generating PDF...' : 'Export PDF Report'}
                  </button>
                  <div className="my-1 border-t border-overlay" />
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      setIsDeleteDialogOpen(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-love hover:bg-love/15 rounded-xl transition"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Event
                  </button>
                </div>
              </>
            )}
          </div>
        }
      />

      <div className="px-4 sm:px-6 pt-4 space-y-5">
        {/* Description if present */}
        {event.description && (
          <p className="text-xs text-subtle bg-surface/50 border border-overlay p-3 rounded-xl leading-relaxed">
            {event.description}
          </p>
        )}

        {/* Financial Summary Card */}
        <section className="rounded-2xl bg-surface border border-overlay p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted">
              Financial Summary
            </span>
            <span className="text-xs font-mono font-bold text-subtle">
              {event.currency}
            </span>
          </div>

          {/* Primary Row: Committed */}
          <div>
            <span className="text-xs text-subtle block font-medium">Committed Expenses</span>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-text mt-0.5">
              <CurrencyDisplay amount={summary.committed} currency={event.currency} />
            </div>
          </div>

          {/* Secondary Row: Paid & Outstanding */}
          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-overlay/60">
            <div className="p-3 rounded-xl bg-overlay/40 border border-overlay/40">
              <span className="text-xs text-subtle block mb-1">Total Paid</span>
              <CurrencyDisplay
                amount={summary.paid}
                currency={event.currency}
                highlightStatus="paid"
                className="text-base sm:text-lg font-bold block"
              />
            </div>
            <div className="p-3 rounded-xl bg-overlay/40 border border-overlay/40">
              <span className="text-xs text-subtle block mb-1">Total Outstanding</span>
              <CurrencyDisplay
                amount={summary.pending}
                currency={event.currency}
                highlightStatus={summary.pending > 0 ? 'pending' : 'neutral'}
                className="text-base sm:text-lg font-bold block"
              />
            </div>
          </div>

          {/* Budget row if configured */}
          {hasBudget && (
            <div
              className={`p-3.5 rounded-xl border flex items-center justify-between text-xs ${
                isOverBudget
                  ? 'bg-love/10 border-love/30 text-love'
                  : 'bg-overlay/50 border-overlay/80 text-subtle'
              }`}
            >
              <div>
                <span className="block font-semibold">Budget Target</span>
                <CurrencyDisplay
                  amount={event.budgetAmount}
                  currency={event.currency}
                  className="font-bold text-sm text-text"
                />
              </div>

              <div className="text-right">
                <span className="block font-semibold">
                  {isOverBudget ? 'Budget Exceeded By' : 'Budget Remaining'}
                </span>
                <span className="font-mono text-sm font-bold">
                  <CurrencyDisplay
                    amount={Math.abs(summary.budgetRemaining || 0)}
                    currency={event.currency}
                    className={isOverBudget ? 'text-love' : 'text-foam'}
                  />
                </span>
              </div>
            </div>
          )}

          {/* Progress bar */}
          <div className="pt-2">
            <div className="flex justify-between items-center text-xs text-subtle mb-1.5">
              <span>Payment Progress</span>
              <span className="font-mono font-medium text-text">{summary.paymentProgress}%</span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-overlay overflow-hidden">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  summary.paymentProgress >= 100
                    ? 'bg-foam'
                    : summary.paymentProgress > 0
                    ? 'bg-gold'
                    : 'bg-muted'
                }`}
                style={{ width: `${Math.min(100, Math.max(0, summary.paymentProgress))}%` }}
              />
            </div>
          </div>
        </section>

        {/* Expenses List Section */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-base font-bold text-text">Expenses</h3>
              <p className="text-xs text-subtle">
                {debouncedQuery.trim()
                  ? `${filteredExpenses.length} of ${expenses.length} ${expenses.length === 1 ? 'item' : 'items'}`
                  : `${expenses.length} ${expenses.length === 1 ? 'item' : 'items'} tracked`}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsAddExpenseOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-pine hover:bg-pine/90 text-white font-semibold text-xs transition shadow-sm active:scale-95 min-h-[38px]"
            >
              <Plus className="w-4 h-4" />
              Add Expense
            </button>
          </div>

          {/* Search Bar when 3 or more expenses exist */}
          {expenses.length >= 3 && (
            <div className="mb-3">
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                onClear={handleClearSearch}
                placeholder="Search by name or vendor"
                ariaLabel="Search expenses"
              />
            </div>
          )}

          {expenses.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title="No expenses added"
              description="Add vendors, bookings, or costs (like venue, photography, or food) to begin tracking payments."
              actionLabel="Add Expense"
              onAction={() => setIsAddExpenseOpen(true)}
              className="mt-2 py-10"
            />
          ) : filteredExpenses.length === 0 ? (
            <EmptyState
              icon={SearchX}
              title={`No expenses match '${debouncedQuery.trim() || searchQuery.trim()}'`}
              description="Check for typos or try searching with a different name or vendor."
              actionLabel="Clear search"
              actionIcon={X}
              onAction={handleClearSearch}
              className="mt-2 py-10"
            />
          ) : (
            <div className="space-y-3">
              {filteredExpenses.map((expense) => (
                <ExpenseCard
                  key={expense.id}
                  expense={expense}
                  currency={event.currency}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Floating Action Button for adding expense on mobile */}
      <button
        type="button"
        onClick={() => setIsAddExpenseOpen(true)}
        className="fixed bottom-6 right-6 z-30 w-14 h-14 rounded-2xl bg-pine hover:bg-pine/90 text-white shadow-xl flex items-center justify-center transition-transform active:scale-90 hover:scale-105"
        aria-label="Add expense"
      >
        <Plus className="w-7 h-7 stroke-[2.2]" />
      </button>

      {/* Add Expense Modal */}
      <ExpenseFormModal
        isOpen={isAddExpenseOpen}
        onClose={() => setIsAddExpenseOpen(false)}
        eventId={event.id}
        currency={event.currency}
      />

      {/* Edit Event Modal */}
      <EventFormModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        eventToEdit={event}
        hasExpenses={expenses.length > 0}
      />

      {/* Delete Event Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        title="Delete Event"
        message={`Are you sure you want to delete "${event.name}"? This will permanently remove all associated expenses and payment records.`}
        confirmLabel="Delete Event and All Records"
        isDestructive={true}
        onConfirm={handleDeleteEvent}
        onCancel={() => setIsDeleteDialogOpen(false)}
      />
    </div>
  );
};
