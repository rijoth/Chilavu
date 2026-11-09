import { COMMON_CURRENCIES, formatCurrency } from '@/lib/currency';

/**
 * jsPDF's built-in fonts (Helvetica/Times/Courier) can only encode WinAnsi text.
 * Currency symbols outside that set are written as an unrelated byte (₹ becomes
 * "¹"), and some viewers (e.g. Firefox's pdf.js) then lay out the whole amount
 * with fallback glyph widths, which makes numbers overlap neighbouring columns.
 * Reports therefore use a readable ASCII label for those currencies.
 */
const NOT_PDF_ENCODABLE = /[^\u0020-\u007e\u00a0-\u00ff\u20ac]/;

const PDF_CURRENCY_LABELS: Record<string, string> = {
  INR: 'Rs',
};

export function formatCurrencyForPdf(
  minorUnits: number | undefined | null,
  currencyCode: string = 'INR'
): string {
  if (minorUnits === undefined || minorUnits === null) {
    return formatCurrency(minorUnits, currencyCode);
  }

  const code = currencyCode.toUpperCase();
  const formatted = formatCurrency(minorUnits, currencyCode);
  const symbol = COMMON_CURRENCIES.find((c) => c.code === code)?.symbol;

  if (!symbol || !NOT_PDF_ENCODABLE.test(symbol)) return formatted;

  const label = PDF_CURRENCY_LABELS[code] ?? code;
  const amount = formatted.split(symbol).join('').trim();
  if (!amount) return formatted;

  // Keep the minus sign in front of the label: "-Rs 1,000.00".
  const sign = amount.startsWith('-') ? '-' : '';
  const value = sign ? amount.slice(1).trim() : amount;
  return `${sign}${label} ${value}`;
}

/**
 * Summary amounts sit just under the 9pt labels: bold enough to stand out
 * without overpowering the metric headings.
 */
export const PDF_METRIC_FONT_SIZE = 10;

/**
 * Keeps summary metrics inside their column: returns the largest font size
 * (bounded by `minSize`) at which every value fits within `maxWidth`.
 */
export function fitFontSizeToWidth(
  baseSize: number,
  textWidths: number[],
  maxWidth: number,
  minSize = 8
): number {
  const widest = Math.max(0, ...textWidths);
  if (widest <= maxWidth) return baseSize;
  return Math.max(minSize, Math.floor((baseSize * maxWidth * 10) / widest) / 10);
}
