import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { formatDate, formatLocalDate } from '../lib/dates.ts';

describe('Date Formatting Utilities', () => {
  it('formats dates in local format for en-GB', () => {
    const formatted = formatLocalDate('2026-12-12', 'en-GB');
    assert.equal(formatted, '12 Dec 2026');
  });

  it('formats dates in local format for en-US', () => {
    const formatted = formatLocalDate('2026-12-12', 'en-US');
    assert.equal(formatted, 'Dec 12, 2026');
  });

  it('returns empty string when dateString is empty or undefined', () => {
    assert.equal(formatLocalDate(''), '');
    assert.equal(formatLocalDate(undefined), '');
  });

  it('handles invalid date strings gracefully', () => {
    assert.equal(formatLocalDate('not-a-date'), 'not-a-date');
  });

  it('preserves ISO date parsing consistency with date-fns formatDate', () => {
    assert.equal(formatDate('2026-12-12'), '12 Dec 2026');
    assert.equal(formatDate(''), '');
  });
});
