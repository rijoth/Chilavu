import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  getCurrencyDecimals,
  parseToMinorUnits,
  minorUnitsToInputValue,
  isValidMinorAmount,
  formatCurrency,
  formatCurrencyParts,
} from '../lib/currency.ts';

describe('Currency and Minor Unit Arithmetic', () => {
  it('identifies correct decimal precision per ISO currency', () => {
    assert.equal(getCurrencyDecimals('INR'), 2);
    assert.equal(getCurrencyDecimals('USD'), 2);
    assert.equal(getCurrencyDecimals('EUR'), 2);
    assert.equal(getCurrencyDecimals('JPY'), 0);
    assert.equal(getCurrencyDecimals('KRW'), 0);
    assert.equal(getCurrencyDecimals('KWD'), 3);
    assert.equal(getCurrencyDecimals('BHD'), 3);
  });

  it('parses input strings to integer minor units without float rounding errors', () => {
    assert.equal(parseToMinorUnits('100.50', 'INR'), 10050);
    assert.equal(parseToMinorUnits('100.5', 'INR'), 10050);
    assert.equal(parseToMinorUnits('100', 'INR'), 10000);
    assert.equal(parseToMinorUnits('0.75', 'USD'), 75);
    assert.equal(parseToMinorUnits('1000', 'JPY'), 1000);
    assert.equal(parseToMinorUnits('1000.50', 'JPY'), 1000); // 0 decimals
    assert.equal(parseToMinorUnits('1.250', 'KWD'), 1250); // 3 decimals
    assert.equal(parseToMinorUnits('₹ 4,50,000.00', 'INR'), 45000000);
  });

  it('converts minor units back to input format for user editing', () => {
    assert.equal(minorUnitsToInputValue(10050, 'INR'), '100.50');
    assert.equal(minorUnitsToInputValue(5000, 'USD'), '50.00');
    assert.equal(minorUnitsToInputValue(1500, 'JPY'), '1500');
  });

  it('validates non-negative safe integers', () => {
    assert.equal(isValidMinorAmount(10000), true);
    assert.equal(isValidMinorAmount(0), true);
    assert.equal(isValidMinorAmount(-50), false);
    assert.equal(isValidMinorAmount(100.5), false);
    assert.equal(isValidMinorAmount('1000'), false);
    assert.equal(isValidMinorAmount(NaN), false);
  });

  it('formats currency correctly and supports hideDecimalsIfWhole', () => {
    // Normal formatting
    assert.match(formatCurrency(10050, 'INR'), /100\.5/);
    assert.match(formatCurrency(10000, 'INR'), /100\.00/);

    // With hideDecimalsIfWhole: true
    const wholeParts = formatCurrencyParts(10000, 'INR', { hideDecimalsIfWhole: true });
    assert.equal(wholeParts.isWhole, true);
    assert.equal(wholeParts.decimal, '');
    assert.match(wholeParts.formatted, /100/);
    assert.doesNotMatch(wholeParts.formatted, /\.00/);

    const fractionalParts = formatCurrencyParts(10050, 'INR', { hideDecimalsIfWhole: true });
    assert.equal(fractionalParts.isWhole, false);
    assert.match(fractionalParts.decimal, /\.50/);

    // Undefined / null handling
    assert.equal(formatCurrency(null, 'INR'), '—');
    assert.equal(formatCurrency(undefined, 'INR'), '—');
  });
});
