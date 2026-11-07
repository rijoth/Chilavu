export interface CurrencyOption {
  code: string;
  name: string;
  symbol: string;
  decimals: number;
}

export const COMMON_CURRENCIES: CurrencyOption[] = [
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', decimals: 2 },
  { code: 'USD', name: 'US Dollar', symbol: '$', decimals: 2 },
  { code: 'EUR', name: 'Euro', symbol: '€', decimals: 2 },
  { code: 'GBP', name: 'British Pound', symbol: '£', decimals: 2 },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', decimals: 2 },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', decimals: 2 },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', decimals: 2 },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', decimals: 2 },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', decimals: 0 },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', decimals: 2 },
  { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM', decimals: 2 },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$', decimals: 2 },
  { code: 'PHP', name: 'Philippine Peso', symbol: '₱', decimals: 2 },
  { code: 'THB', name: 'Thai Baht', symbol: '฿', decimals: 2 },
  { code: 'KWD', name: 'Kuwaiti Dinar', symbol: 'KD', decimals: 3 },
  { code: 'BHD', name: 'Bahraini Dinar', symbol: 'BD', decimals: 3 },
  { code: 'OMR', name: 'Omani Rial', symbol: 'OMR', decimals: 3 },
  { code: 'SAR', name: 'Saudi Riyal', symbol: '﷼', decimals: 2 },
  { code: 'QAR', name: 'Qatari Riyal', symbol: 'QR', decimals: 2 },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R', decimals: 2 },
];

const ZERO_DECIMAL_CURRENCIES = new Set([
  'BIF', 'CLP', 'DJF', 'GNF', 'JPY', 'KMF', 'KRW', 'MGA', 'PYG', 'RWF', 'UGX', 'VND', 'VUV', 'XAF', 'XOF', 'XPF'
]);

const THREE_DECIMAL_CURRENCIES = new Set([
  'BHD', 'IQD', 'JOD', 'KWD', 'LYD', 'OMR', 'TND'
]);

export function getCurrencyDecimals(currencyCode: string): number {
  const code = (currencyCode || '').toUpperCase().trim();
  if (ZERO_DECIMAL_CURRENCIES.has(code)) return 0;
  if (THREE_DECIMAL_CURRENCIES.has(code)) return 3;
  return 2;
}

export interface CurrencyParts {
  main: string;
  decimal: string;
  suffix: string;
  isWhole: boolean;
  formatted: string;
}

export function formatCurrencyParts(
  minorUnits: number | undefined | null,
  currencyCode: string = 'INR',
  options?: { hideDecimalsIfWhole?: boolean }
): CurrencyParts {
  if (minorUnits === undefined || minorUnits === null || Number.isNaN(minorUnits)) {
    return { main: '—', decimal: '', suffix: '', isWhole: true, formatted: '—' };
  }

  const decimals = getCurrencyDecimals(currencyCode);
  const factor = 10 ** decimals;
  const majorUnits = minorUnits / factor;
  const isWhole = decimals === 0 || minorUnits % factor === 0;
  const minDigits = options?.hideDecimalsIfWhole && isWhole ? 0 : decimals;

  try {
    const formatter = new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: minDigits,
      maximumFractionDigits: decimals,
    });
    const parts = formatter.formatToParts(majorUnits);
    let main = '';
    let decimal = '';
    let suffix = '';
    let seenFraction = false;

    for (const part of parts) {
      if (part.type === 'decimal' || part.type === 'fraction') {
        decimal += part.value;
        if (part.type === 'fraction') seenFraction = true;
      } else if (seenFraction) {
        suffix += part.value;
      } else {
        main += part.value;
      }
    }

    const formatted = `${main}${decimal}${suffix}`;
    return { main, decimal, suffix, isWhole, formatted };
  } catch {
    // Fallback if currency code is invalid or unsupported by Intl
    const symbol = COMMON_CURRENCIES.find(c => c.code === currencyCode)?.symbol || currencyCode;
    if (options?.hideDecimalsIfWhole && isWhole) {
      const formatted = `${symbol} ${majorUnits.toLocaleString()}`;
      return { main: formatted, decimal: '', suffix: '', isWhole: true, formatted };
    }
    const fixed = majorUnits.toFixed(decimals);
    const [whole, frac] = fixed.split('.');
    const main = `${symbol} ${parseInt(whole, 10).toLocaleString()}`;
    const decimal = frac ? `.${frac}` : '';
    return { main, decimal, suffix: '', isWhole, formatted: `${main}${decimal}` };
  }
}

export function formatCurrency(
  minorUnits: number | undefined | null,
  currencyCode: string = 'INR',
  options?: { hideDecimalsIfWhole?: boolean }
): string {
  return formatCurrencyParts(minorUnits, currencyCode, options).formatted;
}

/**
 * Converts a user-input decimal string or number (e.g. "100.50" or 100.50) into integer minor units (10050).
 * Prevents floating-point precision errors using integer string parsing.
 */
export function parseToMinorUnits(value: string | number, currencyCode: string = 'INR'): number {
  if (typeof value === 'number') {
    if (!Number.isFinite(value) || value < 0) return 0;
    value = value.toString();
  }

  const trimmed = value.trim();
  if (!trimmed) return 0;

  const decimals = getCurrencyDecimals(currencyCode);

  // Clean string: remove currency symbols, commas, spaces
  const cleaned = trimmed.replace(/[^0-9.]/g, '');
  if (!cleaned) return 0;

  const parts = cleaned.split('.');
  const wholePart = parts[0] || '0';
  let fractionPart = parts[1] || '';

  if (decimals === 0) {
    return parseInt(wholePart, 10) || 0;
  }

  // Pad or truncate fraction to exact decimals
  fractionPart = fractionPart.padEnd(decimals, '0').slice(0, decimals);
  const fullIntegerStr = `${wholePart}${fractionPart}`;

  const result = parseInt(fullIntegerStr, 10);
  return Number.isSafeInteger(result) && result >= 0 ? result : 0;
}

/**
 * Formats minor units to an editable string for inputs (e.g. 10050 -> "100.50" or "100" if 0 decimals)
 */
export function minorUnitsToInputValue(minorUnits: number | undefined | null, currencyCode: string = 'INR'): string {
  if (minorUnits === undefined || minorUnits === null) return '';
  const decimals = getCurrencyDecimals(currencyCode);
  if (decimals === 0) {
    return minorUnits.toString();
  }
  const factor = 10 ** decimals;
  return (minorUnits / factor).toFixed(decimals);
}

/**
 * Validates that an amount is a non-negative safe integer
 */
export function isValidMinorAmount(amount: unknown): boolean {
  return typeof amount === 'number' && Number.isSafeInteger(amount) && amount >= 0;
}
