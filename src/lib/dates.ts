import { format, parseISO, isValid } from 'date-fns';

export function formatDate(dateString?: string, formatStr: string = 'dd MMM yyyy'): string {
  if (!dateString) return '';
  try {
    const parsed = parseISO(dateString);
    if (!isValid(parsed)) return dateString;
    return format(parsed, formatStr);
  } catch {
    return dateString;
  }
}

export function formatLocalDate(dateString?: string, locale?: string): string {
  if (!dateString) return '';
  try {
    let date: Date;
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      const [year, month, day] = dateString.split('-').map(Number);
      date = new Date(year, month - 1, day);
    } else {
      date = new Date(dateString);
    }
    if (isNaN(date.getTime())) return dateString;
    return new Intl.DateTimeFormat(locale || undefined, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date);
  } catch {
    return dateString;
  }
}

export function formatDateTime(dateString?: string): string {
  if (!dateString) return '';
  return formatDate(dateString, 'dd MMM yyyy, HH:mm');
}

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isValidDateString(val?: string): boolean {
  if (!val) return false;
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(val)) return false;
  const parsed = parseISO(val);
  return isValid(parsed);
}
