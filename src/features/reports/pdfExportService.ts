import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Event } from '@/types/event';
import type { Expense } from '@/types/expense';
import type { Payment } from '@/types/payment';
import { calculateExpenseSummary, calculateEventSummary } from '@/features/expenses/expenseCalculations';
import { formatCurrencyForPdf, fitFontSizeToWidth, PDF_METRIC_FONT_SIZE } from '@/features/reports/pdfFormat';
import { formatDate, getTodayDateString } from '@/lib/dates';

/** The bundled app icon, served from `public/` and precached by the PWA. */
const APP_ICON_PATH = `${import.meta.env?.BASE_URL ?? '/'}pwa-192x192.png`;

async function loadAppIconDataUrl(): Promise<string | null> {
  try {
    const response = await fetch(APP_ICON_PATH);
    if (!response.ok) return null;
    const bytes = new Uint8Array(await response.arrayBuffer());
    let binary = '';
    for (const byte of bytes) binary += String.fromCharCode(byte);
    return `data:image/png;base64,${btoa(binary)}`;
  } catch {
    // A missing icon must never block the report.
    return null;
  }
}

export const pdfExportService = {
  async generateEventReport(
    event: Event,
    expenses: Expense[],
    payments: Payment[]
  ): Promise<void> {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: 'a4',
    });

    const currency = event.currency;
    const summary = calculateEventSummary(event, expenses, payments);

    // Group payments by expense
    const paymentsByExpense = new Map<string, Payment[]>();
    for (const p of payments) {
      const list = paymentsByExpense.get(p.expenseId) || [];
      list.push(p);
      paymentsByExpense.set(p.expenseId, list);
    }

    // Color definitions (Rosé Pine inspired)
    const primaryColor: [number, number, number] = [49, 116, 143]; // #31748f (Pine)
    const darkTextColor: [number, number, number] = [25, 23, 36]; // #191724 (Base/Text)
    const mutedColor: [number, number, number] = [110, 106, 134]; // #6e6a86 (Muted)
    const lightBgColor: [number, number, number] = [250, 244, 237]; // #faf4ed (Dawn surface)
    const accentColor: [number, number, number] = [246, 193, 119]; // #f6c177 (Gold)

    let cursorY = 40;

    // 1. Header Banner
    doc.setFillColor(lightBgColor[0], lightBgColor[1], lightBgColor[2]);
    doc.roundedRect(40, cursorY, 515, 60, 6, 6, 'F');

    const appIcon = await loadAppIconDataUrl();
    const iconSize = 30;
    const iconRadius = 6;
    let titleX = 55;
    if (appIcon) {
      const iconX = 55;
      const iconY = cursorY + 15;
      // Clip the square icon to the app's rounded-corner mark.
      doc.saveGraphicsState();
      doc.roundedRect(iconX, iconY, iconSize, iconSize, iconRadius, iconRadius, null);
      doc.clip();
      doc.discardPath();
      doc.addImage(appIcon, 'PNG', iconX, iconY, iconSize, iconSize);
      doc.restoreGraphicsState();
      titleX = iconX + iconSize + 12;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('Chilavu', titleX, cursorY + 36);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
    const generatedOn = `Generated on ${formatDate(new Date().toISOString(), 'dd MMM yyyy, HH:mm')}`;
    doc.text(generatedOn, 540, cursorY + 36, { align: 'right' });

    cursorY += 80;

    // 2. Event Title & Metadata
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
    doc.text(event.name, 40, cursorY);
    cursorY += 18;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);

    const dateStr = event.eventDate ? `Date: ${formatDate(event.eventDate)}` : 'Date: Not specified';
    const currencyStr = `Currency: ${event.currency}`;
    doc.text(`${dateStr}  |  ${currencyStr}`, 40, cursorY);

    if (event.description) {
      cursorY += 14;
      doc.text(event.description, 40, cursorY);
    }

    cursorY += 24;

    // 3. Financial Summary Box
    doc.setDrawColor(220, 215, 210);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(40, cursorY, 515, 76, 6, 6, 'FD');

    const summaryPadding = 15;
    const summaryColumns = event.budgetAmount !== undefined ? 5 : 4;
    const colWidth = (515 - summaryPadding * 2) / summaryColumns;
    const metricGap = 6;

    type Metric = { label: string; value: string; color?: [number, number, number] };
    const metrics: Metric[] = [];

    if (event.budgetAmount !== undefined) {
      metrics.push({ label: 'Budget Target', value: formatCurrencyForPdf(event.budgetAmount, currency) });
    }
    metrics.push({ label: 'Committed', value: formatCurrencyForPdf(summary.committed, currency) });
    metrics.push({ label: 'Total Paid', value: formatCurrencyForPdf(summary.paid, currency), color: [49, 116, 143] });
    metrics.push({ label: 'Outstanding', value: formatCurrencyForPdf(summary.pending, currency), color: [235, 111, 146] });
    if (summary.budgetRemaining !== undefined) {
      const budgetRemainingColor: [number, number, number] =
        summary.budgetRemaining < 0 ? [235, 111, 146] : [49, 116, 143];
      metrics.push({
        label: 'Budget Left',
        value: formatCurrencyForPdf(summary.budgetRemaining, currency),
        color: budgetRemainingColor,
      });
    } else {
      metrics.push({ label: 'Progress', value: `${summary.paymentProgress}%`, color: accentColor });
    }

    // Shrink all values together so even large amounts stay inside their column.
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(PDF_METRIC_FONT_SIZE);
    const valueFontSize = fitFontSizeToWidth(
      PDF_METRIC_FONT_SIZE,
      metrics.map((metric) => doc.getTextWidth(metric.value)),
      colWidth - metricGap
    );

    let boxX = 40 + summaryPadding;
    for (const metric of metrics) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
      doc.text(metric.label, boxX, cursorY + 26);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(valueFontSize);
      const color = metric.color ?? darkTextColor;
      doc.setTextColor(color[0], color[1], color[2]);
      doc.text(metric.value, boxX, cursorY + 48);

      boxX += colWidth;
    }

    cursorY += 95;

    // 4. Expense Breakdown Table
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
    doc.text('Expense Breakdown', 40, cursorY);
    cursorY += 10;

    const expenseTableRows = expenses.map(exp => {
      const expPayments = paymentsByExpense.get(exp.id) || [];
      const expSummary = calculateExpenseSummary(exp, expPayments);

      return [
        exp.name + (exp.category ? ` (${exp.category})` : ''),
        formatCurrencyForPdf(expSummary.expected, currency),
        formatCurrencyForPdf(expSummary.paid, currency),
        formatCurrencyForPdf(expSummary.pending, currency),
        expSummary.status.toUpperCase(),
      ];
    });

    autoTable(doc, {
      startY: cursorY,
      margin: { left: 40, right: 40 },
      head: [['Expense', 'Expected', 'Paid', 'Pending', 'Status']],
      body: expenseTableRows.length > 0 ? expenseTableRows : [['No expenses recorded', '-', '-', '-', '-']],
      headStyles: {
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontSize: 10,
        fontStyle: 'bold',
      },
      styles: {
        fontSize: 9,
        cellPadding: 6,
        textColor: darkTextColor,
      },
      alternateRowStyles: {
        fillColor: [248, 246, 243],
      },
      columnStyles: {
        0: { cellWidth: 175 },
        1: { halign: 'right' },
        2: { halign: 'right' },
        3: { halign: 'right' },
        4: { halign: 'center', fontStyle: 'bold' },
      },
    });

    // 5. Payment Details Section
    let currentY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 30;

    if (currentY > 700) {
      doc.addPage();
      currentY = 40;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
    doc.text('Payment History by Expense', 40, currentY);
    currentY += 12;

    for (const exp of expenses) {
      const expPayments = paymentsByExpense.get(exp.id) || [];
      if (expPayments.length === 0) continue;

      if (currentY > 720) {
        doc.addPage();
        currentY = 40;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text(`Expense: ${exp.name}`, 40, currentY);
      currentY += 6;

      const paymentRows = expPayments.map(p => [
        formatDate(p.paymentDate),
        p.notes || '—',
        p.method ? p.method.replace('_', ' ').toUpperCase() : '—',
        formatCurrencyForPdf(p.amount, currency),
      ]);

      autoTable(doc, {
        startY: currentY,
        margin: { left: 40, right: 40 },
        head: [['Date', 'Notes', 'Method', 'Amount']],
        body: paymentRows,
        headStyles: {
          fillColor: [110, 106, 134],
          textColor: [255, 255, 255],
          fontSize: 8,
          fontStyle: 'bold',
        },
        styles: {
          fontSize: 8,
          cellPadding: 4,
          textColor: darkTextColor,
        },
        alternateRowStyles: {
          fillColor: [250, 248, 245],
        },
        columnStyles: {
          0: { cellWidth: 80 },
          1: { cellWidth: 220 },
          2: { cellWidth: 90 },
          3: { halign: 'right', fontStyle: 'bold' },
        },
      });

      currentY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 18;
    }

    // Add page numbers
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
      doc.text(
        `Chilavu · Page ${i} of ${totalPages}`,
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 20,
        { align: 'center' }
      );
    }

    // Generate safe filename: chilavu-{name}-{date}.pdf
    const safeName = event.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'event';
    const filename = `chilavu-${safeName}-${getTodayDateString()}.pdf`;

    doc.save(filename);
  },
};
