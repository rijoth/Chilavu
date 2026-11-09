import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { formatCurrencyForPdf, fitFontSizeToWidth } from '../features/reports/pdfFormat.ts';
import { COMMON_CURRENCIES, formatCurrency } from '../lib/currency.ts';

describe('PDF currency formatting', () => {
  it('replaces symbols that the built-in PDF fonts cannot encode', () => {
    const formatted = formatCurrency(10_000_000, 'INR');
    const pdf = formatCurrencyForPdf(10_000_000, 'INR');

    assert.match(pdf, /^Rs /);
    assert.match(pdf, /^[\x20-\x7E]+$/); // plain ASCII, so every viewer renders it
    assert.equal(pdf.slice(3), formatted.split('₹').join('').trim());
  });

  it('keeps a negative sign in front of the label', () => {
    const pdf = formatCurrencyForPdf(-10_000_000, 'INR');
    assert.match(pdf, /^-Rs /);
    assert.match(pdf, /^[\x20-\x7E]+$/);
  });

  it('keeps currency symbols that WinAnsi can encode', () => {
    for (const code of ['USD', 'EUR', 'GBP', 'JPY']) {
      assert.equal(formatCurrencyForPdf(12_345, code), formatCurrency(12_345, code));
    }
  });

  it('never emits unsupported currency symbols for any supported currency', () => {
    for (const currency of COMMON_CURRENCIES) {
      const pdf = formatCurrencyForPdf(123_456_789, currency.code);
      assert.doesNotMatch(pdf, /[₹₱฿﷼]/, `${currency.code}: ${pdf}`);
      assert.doesNotMatch(pdf, /[\u0600-\u06ff]/, `${currency.code}: ${pdf}`);
    }
  });

  it('passes missing amounts through unchanged', () => {
    assert.equal(formatCurrencyForPdf(undefined, 'INR'), formatCurrency(undefined, 'INR'));
    assert.equal(formatCurrencyForPdf(null, 'INR'), formatCurrency(null, 'INR'));
  });
});

describe('PDF metric font fitting', () => {
  it('keeps the base size when every value fits', () => {
    assert.equal(fitFontSizeToWidth(12, [60, 80], 97), 12);
  });

  it('shrinks proportionally when a value is too wide', () => {
    assert.equal(fitFontSizeToWidth(12, [100], 97), 11.6);
    assert.equal(fitFontSizeToWidth(12, [12, 107], 97), 10.8);
  });

  it('never goes below the minimum size', () => {
    assert.equal(fitFontSizeToWidth(12, [500], 97, 8), 8);
  });
});
