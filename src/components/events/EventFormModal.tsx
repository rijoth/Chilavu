import React, { useState, useEffect } from 'react';
import { X, Calendar, Lock } from 'lucide-react';
import type { Event } from '@/types/event';
import { COMMON_CURRENCIES, parseToMinorUnits, minorUnitsToInputValue } from '@/lib/currency';
import { useSettingsStore } from '@/stores/settingsStore';
import { eventService } from '@/features/events/eventService';
import { useUIStore } from '@/stores/uiStore';

interface EventFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventToEdit?: Event;
  hasExpenses?: boolean;
  onSuccess?: (event: Event) => void;
}

export const EventFormModal: React.FC<EventFormModalProps> = ({
  isOpen,
  onClose,
  eventToEdit,
  hasExpenses = false,
  onSuccess,
}) => {
  const defaultCurrency = useSettingsStore((s) => s.defaultCurrency);
  const showToast = useUIStore((s) => s.showToast);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [currency, setCurrency] = useState(defaultCurrency);
  const [budgetInput, setBudgetInput] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (eventToEdit) {
        setName(eventToEdit.name);
        setDescription(eventToEdit.description || '');
        setEventDate(eventToEdit.eventDate || '');
        setCurrency(eventToEdit.currency);
        setBudgetInput(minorUnitsToInputValue(eventToEdit.budgetAmount, eventToEdit.currency));
      } else {
        setName('');
        setDescription('');
        setEventDate('');
        setCurrency(defaultCurrency);
        setBudgetInput('');
      }
      setErrors({});
    }
  }, [isOpen, eventToEdit, defaultCurrency]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrors({ name: 'Event name is required' });
      return;
    }

    let parsedBudget: number | undefined = undefined;
    if (budgetInput.trim()) {
      parsedBudget = parseToMinorUnits(budgetInput, currency);
    }

    try {
      setIsSubmitting(true);
      if (eventToEdit) {
        const updated = await eventService.updateEvent(eventToEdit.id, {
          name: trimmedName,
          description: description.trim() || undefined,
          eventDate: eventDate || undefined,
          currency,
          budgetAmount: parsedBudget,
        });
        showToast('Event updated successfully', 'success');
        onSuccess?.(updated);
      } else {
        const created = await eventService.createEvent({
          name: trimmedName,
          description: description.trim() || undefined,
          eventDate: eventDate || undefined,
          currency,
          budgetAmount: parsedBudget,
        });
        showToast('Event created successfully', 'success');
        onSuccess?.(created);
      }
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save event';
      setErrors({ form: msg });
      showToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isCurrencyLocked = Boolean(eventToEdit && hasExpenses);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-t-3xl sm:rounded-2xl bg-surface border border-overlay shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-overlay/60">
          <h2 className="text-lg font-bold text-text">
            {eventToEdit ? 'Edit Event' : 'Create New Event'}
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

          {/* Event Name */}
          <div>
            <label htmlFor="event-name" className="block text-xs font-semibold text-subtle uppercase tracking-wider mb-1.5">
              Event Name <span className="text-love">*</span>
            </label>
            <input
              id="event-name"
              type="text"
              required
              placeholder="e.g. Wedding, Birthday Bash, Reunion"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-overlay/50 border border-overlay text-text placeholder:text-muted focus:outline-none focus:border-pine focus:ring-1 focus:ring-pine transition text-sm"
            />
            {errors.name && <p className="mt-1 text-xs text-love">{errors.name}</p>}
          </div>

          {/* Event Date & Currency */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="event-date" className="block text-xs font-semibold text-subtle uppercase tracking-wider mb-1.5">
                Event Date (Optional)
              </label>
              <div className="relative">
                <input
                  id="event-date"
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-overlay/50 border border-overlay text-text focus:outline-none focus:border-pine focus:ring-1 focus:ring-pine transition text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="event-currency" className="block text-xs font-semibold text-subtle uppercase tracking-wider mb-1.5">
                Currency <span className="text-love">*</span>
              </label>
              <div className="relative">
                <select
                  id="event-currency"
                  disabled={isCurrencyLocked}
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl bg-overlay/50 border border-overlay text-text focus:outline-none focus:border-pine focus:ring-1 focus:ring-pine transition text-sm ${
                    isCurrencyLocked ? 'opacity-60 cursor-not-allowed' : ''
                  }`}
                >
                  {COMMON_CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code} className="bg-surface text-text">
                      {c.code} - {c.name} ({c.symbol})
                    </option>
                  ))}
                </select>
                {isCurrencyLocked && (
                  <span className="absolute right-3 top-3.5 text-muted pointer-events-none">
                    <Lock className="w-4 h-4" />
                  </span>
                )}
              </div>
              {isCurrencyLocked && (
                <p className="mt-1 text-xs text-muted">
                  Currency is locked because expenses have already been added.
                </p>
              )}
            </div>
          </div>

          {/* Budget Target */}
          <div>
            <label htmlFor="event-budget" className="block text-xs font-semibold text-subtle uppercase tracking-wider mb-1.5">
              Budget Target (Optional)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-3.5 text-subtle font-mono text-sm">
                {COMMON_CURRENCIES.find((c) => c.code === currency)?.symbol || currency}
              </span>
              <input
                id="event-budget"
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                value={budgetInput}
                onChange={(e) => setBudgetInput(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-overlay/50 border border-overlay text-text font-mono placeholder:text-muted focus:outline-none focus:border-pine focus:ring-1 focus:ring-pine transition text-sm"
              />
            </div>
            <p className="mt-1 text-xs text-subtle">
              Used to track your budget ceiling and remaining balance.
            </p>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="event-desc" className="block text-xs font-semibold text-subtle uppercase tracking-wider mb-1.5">
              Description (Optional)
            </label>
            <textarea
              id="event-desc"
              rows={2}
              placeholder="Notes, venue location, or planning remarks"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-overlay/50 border border-overlay text-text placeholder:text-muted focus:outline-none focus:border-pine focus:ring-1 focus:ring-pine transition text-sm resize-none"
            />
          </div>

          {/* Buttons */}
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
              {isSubmitting ? 'Saving...' : eventToEdit ? 'Save Changes' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
