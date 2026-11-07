import React, { useState, useRef } from 'react';
import {
  Sun,
  Moon,
  Laptop,
  Download,
  Upload,
  ShieldCheck,
  Info,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
} from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { useSettingsStore } from '@/stores/settingsStore';
import { COMMON_CURRENCIES } from '@/lib/currency';
import { exportService } from '@/features/backup/exportService';
import { importService } from '@/features/backup/importService';
import { validateBackupJson } from '@/features/backup/importValidation';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { useUIStore } from '@/stores/uiStore';
import { ChilavuLogo } from '@/components/common/ChilavuLogo';
import type { ThemeMode } from '@/types/settings';
import type { BackupFile, ImportAnalysis } from '@/features/backup/backupSchema';

export const SettingsPage: React.FC = () => {
  const { theme, defaultCurrency, setTheme, setDefaultCurrency } = useSettingsStore();
  const showToast = useUIStore((s) => s.showToast);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isExporting, setIsExporting] = useState(false);
  const [importCandidate, setImportCandidate] = useState<BackupFile | null>(null);
  const [importAnalysis, setImportAnalysis] = useState<ImportAnalysis | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isReplaceConfirmOpen, setIsReplaceConfirmOpen] = useState(false);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const backup = await exportService.generateBackup();
      exportService.downloadBackup(backup);
      showToast('Backup file downloaded successfully', 'success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to export backup';
      showToast(msg, 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsAnalyzing(true);
      setValidationErrors([]);
      setImportCandidate(null);
      setImportAnalysis(null);

      const text = await file.text();
      const validation = validateBackupJson(text);

      if (!validation.isValid || !validation.parsedFile) {
        setValidationErrors(validation.errors);
        showToast('Invalid backup file. Review errors below.', 'error');
        return;
      }

      const analysis = await importService.analyzeBackup(validation.parsedFile);
      setImportCandidate(validation.parsedFile);
      setImportAnalysis(analysis);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error reading backup file';
      setValidationErrors([msg]);
      showToast(msg, 'error');
    } finally {
      setIsAnalyzing(false);
      // Reset input value so same file can be re-selected if needed
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleExecuteReplace = async () => {
    if (!importCandidate) return;
    try {
      setIsImporting(true);
      await importService.executeReplaceImport(importCandidate);
      showToast('Data restored successfully! All existing records replaced.', 'success');
      setImportCandidate(null);
      setImportAnalysis(null);
      setIsReplaceConfirmOpen(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to replace data';
      showToast(msg, 'error');
    } finally {
      setIsImporting(false);
    }
  };

  const handleExecuteMerge = async (conflictResolution: 'overwrite' | 'skip') => {
    if (!importCandidate) return;
    try {
      setIsImporting(true);
      const result = await importService.executeMergeImport(importCandidate, conflictResolution);
      showToast(
        `Merge complete: ${result.addedCount} added, ${result.updatedCount} updated, ${result.skippedCount} skipped.`,
        'success'
      );
      setImportCandidate(null);
      setImportAnalysis(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to merge data';
      showToast(msg, 'error');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col pb-20">
      <PageHeader title="Settings" subtitle="Preferences & Local Storage" hasBack={true} backTo="/" />

      <div className="px-4 sm:px-6 pt-5 space-y-6">
        {/* Section: Appearance */}
        <section className="rounded-2xl bg-surface border border-overlay p-5 shadow-xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted mb-4">
            Appearance
          </h3>

          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'system', label: 'System', icon: Laptop },
              { id: 'light', label: 'Light', icon: Sun },
              { id: 'dark', label: 'Dark', icon: Moon },
            ].map((opt) => {
              const Icon = opt.icon;
              const isSelected = theme === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setTheme(opt.id as ThemeMode)}
                  className={`flex flex-col items-center justify-center gap-2 p-3.5 rounded-xl border transition min-h-[56px] text-xs font-semibold ${
                    isSelected
                      ? 'bg-pine/15 border-pine text-pine shadow-xs'
                      : 'bg-overlay/40 border-overlay text-subtle hover:text-text hover:bg-overlay'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Section: Preferences */}
        <section className="rounded-2xl bg-surface border border-overlay p-5 shadow-xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted mb-4">
            Preferences
          </h3>

          <div>
            <label
              htmlFor="default-currency"
              className="block text-xs font-semibold text-subtle uppercase tracking-wider mb-2"
            >
              Default Currency for New Events
            </label>
            <select
              id="default-currency"
              value={defaultCurrency}
              onChange={(e) => setDefaultCurrency(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-overlay/50 border border-overlay text-text focus:outline-none focus:border-pine focus:ring-1 focus:ring-pine transition text-sm font-medium"
            >
              {COMMON_CURRENCIES.map((c) => (
                <option key={c.code} value={c.code} className="bg-surface text-text">
                  {c.code} - {c.name} ({c.symbol})
                </option>
              ))}
            </select>
            <p className="mt-2 text-xs text-subtle">
              New events will default to this currency. Individual events can each use their own currency.
            </p>
          </div>
        </section>

        {/* Section: Data Management (Export & Import) */}
        <section className="rounded-2xl bg-surface border border-overlay p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted">
              Data Management & Backup
            </h3>
            <span className="text-xs text-subtle">Local-first JSON</span>
          </div>

          <p className="text-xs text-subtle leading-relaxed">
            All your records are stored privately in your browser's IndexedDB. Export a backup anytime to save your records or transfer to another device.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {/* Export Button */}
            <button
              type="button"
              onClick={handleExport}
              disabled={isExporting}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-pine hover:bg-pine/90 text-white font-semibold text-xs transition shadow-sm active:scale-95 min-h-[44px] disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {isExporting ? 'Exporting...' : 'Export Application Backup'}
            </button>

            {/* Import Button */}
            <label className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-overlay hover:bg-overlay/80 text-text font-semibold text-xs border border-subtle/30 transition shadow-sm cursor-pointer active:scale-95 min-h-[44px]">
              <Upload className="w-4 h-4 text-foam" />
              <span>Import & Restore Backup</span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>

          {/* Validation Errors banner if any */}
          {validationErrors.length > 0 && (
            <div className="p-4 rounded-xl bg-love/15 border border-love/30 text-love text-xs space-y-1.5">
              <div className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                Invalid Backup File
              </div>
              <ul className="list-disc list-inside space-y-1">
                {validationErrors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Import Analysis Summary */}
          {importAnalysis && importCandidate && (
            <div className="mt-4 p-4 rounded-xl bg-overlay/50 border border-pine/40 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-pine flex items-center gap-1.5">
                  <FileCheck className="w-4 h-4" />
                  Backup Validation Summary
                </span>
                <span className="text-xs text-subtle font-mono">
                  Schema v{importCandidate.schemaVersion}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 rounded-lg bg-surface border border-overlay">
                  <span className="text-subtle block">Events</span>
                  <span className="font-bold font-mono text-text text-sm">
                    {importAnalysis.totalEvents}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-surface border border-overlay">
                  <span className="text-subtle block">Expenses</span>
                  <span className="font-bold font-mono text-text text-sm">
                    {importAnalysis.totalExpenses}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-surface border border-overlay">
                  <span className="text-subtle block">Payments</span>
                  <span className="font-bold font-mono text-text text-sm">
                    {importAnalysis.totalPayments}
                  </span>
                </div>
              </div>

              <div className="text-xs text-subtle space-y-1 bg-surface/60 p-2.5 rounded-lg border border-overlay">
                <div>• New records to insert: {importAnalysis.newEvents + importAnalysis.newExpenses + importAnalysis.newPayments}</div>
                <div>• Identical records already in DB: {importAnalysis.identicalRecords}</div>
                {importAnalysis.conflicts.length > 0 && (
                  <div className="text-gold font-semibold">
                    • Potential conflicts found: {importAnalysis.conflicts.length}
                  </div>
                )}
              </div>

              {/* Conflict details if any */}
              {importAnalysis.conflicts.length > 0 && (
                <div className="p-2.5 rounded-lg bg-gold/10 border border-gold/30 text-[11px] text-text space-y-1 max-h-32 overflow-y-auto">
                  <div className="font-bold text-gold">Conflicts with existing IDs:</div>
                  {importAnalysis.conflicts.map((c, i) => (
                    <div key={i} className="text-subtle">
                      [{c.type.toUpperCase()}] {c.existingNameOrLabel} vs {c.incomingNameOrLabel}
                    </div>
                  ))}
                </div>
              )}

              {/* Strategy Choice */}
              <div className="pt-2 flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  disabled={isImporting}
                  onClick={() => setIsReplaceConfirmOpen(true)}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-love hover:bg-love/90 text-white font-semibold text-xs transition active:scale-95 disabled:opacity-50"
                >
                  Replace All Data
                </button>
                <button
                  type="button"
                  disabled={isImporting}
                  onClick={() => handleExecuteMerge('skip')}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-pine hover:bg-pine/90 text-white font-semibold text-xs transition active:scale-95 disabled:opacity-50"
                >
                  Merge (Keep Existing)
                </button>
                {importAnalysis.conflicts.length > 0 && (
                  <button
                    type="button"
                    disabled={isImporting}
                    onClick={() => handleExecuteMerge('overwrite')}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-gold hover:bg-gold/90 text-surface font-semibold text-xs transition active:scale-95 disabled:opacity-50"
                  >
                    Merge (Overwrite)
                  </button>
                )}
              </div>
            </div>
          )}
        </section>

        {/* Section: About & Privacy */}
        <section className="rounded-2xl bg-surface border border-overlay p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <ChilavuLogo size="md" />
            <div>
              <h3 className="text-base font-bold text-text">Chilavu</h3>
              <p className="text-xs text-subtle">Local-first event expense tracker</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-text font-bold text-sm pt-1">
            <ShieldCheck className="w-5 h-5 text-foam" />
            <span>Privacy & Local Storage</span>
          </div>

          <p className="text-xs text-subtle leading-relaxed">
            Chilavu runs entirely inside your browser. No user accounts, cookies, telemetry, or remote servers exist. All your events, expenses, and payments remain stored privately on your device.
          </p>

          <div className="p-3.5 rounded-xl bg-overlay/40 border border-overlay text-xs text-subtle space-y-2">
            <div className="flex justify-between items-center">
              <span>Application</span>
              <span className="font-semibold text-text">Chilavu</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Logo Mark</span>
              <span className="font-bold text-white px-2 py-0.5 rounded-md bg-pine text-xs font-['Manjari']">ചി</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Storage Architecture</span>
              <span className="text-text font-medium">Local-first IndexedDB</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Version</span>
              <span className="font-mono text-text">1.0.0</span>
            </div>
          </div>
        </section>
      </div>

      {/* Confirm Dialog for Replace Import */}
      <ConfirmDialog
        isOpen={isReplaceConfirmOpen}
        title="Replace All Application Data?"
        message="This action will permanently delete all your existing events, expenses, and payments in this browser, and replace them with the data from the imported backup file. This cannot be undone."
        confirmLabel={isImporting ? 'Restoring...' : 'Replace All Existing Data'}
        isDestructive={true}
        onConfirm={handleExecuteReplace}
        onCancel={() => setIsReplaceConfirmOpen(false)}
      />
    </div>
  );
};
