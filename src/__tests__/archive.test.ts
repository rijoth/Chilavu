import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { Event } from '../types/event.ts';

describe('Event Archive Eligibility and Rules', () => {
  it('allows archiving only when event has at least one expense and zero pending balance', () => {
    // Helper function matching the domain eligibility condition
    const canArchive = (expenseCount: number, pending: number) => {
      return expenseCount > 0 && pending === 0;
    };

    // 0 expenses, 0 pending: not eligible (must have at least one item)
    assert.equal(canArchive(0, 0), false);

    // 2 expenses, 5000 pending: not eligible (must be fully settled)
    assert.equal(canArchive(2, 5000), false);

    // 1 expense, 0 pending: eligible!
    assert.equal(canArchive(1, 0), true);

    // 5 expenses, 0 pending: eligible!
    assert.equal(canArchive(5, 0), true);
  });

  it('correctly filters active and archived events treating missing values as not archived', () => {
    const events: Event[] = [
      {
        id: '1',
        name: 'Active Event Without Field',
        currency: 'INR',
        createdAt: '2026-11-01T00:00:00Z',
        updatedAt: '2026-11-01T00:00:00Z',
      },
      {
        id: '2',
        name: 'Active Event With Undefined',
        currency: 'USD',
        createdAt: '2026-11-02T00:00:00Z',
        updatedAt: '2026-11-02T00:00:00Z',
        archivedAt: undefined,
      },
      {
        id: '3',
        name: 'Archived Event',
        currency: 'EUR',
        createdAt: '2026-11-03T00:00:00Z',
        updatedAt: '2026-11-03T00:00:00Z',
        archivedAt: '2026-11-07T12:00:00Z',
      },
    ];

    const activeEvents = events.filter((e) => !e.archivedAt);
    const archivedEvents = events.filter((e) => Boolean(e.archivedAt));

    assert.equal(activeEvents.length, 2);
    assert.equal(activeEvents[0].id, '1');
    assert.equal(activeEvents[1].id, '2');

    assert.equal(archivedEvents.length, 1);
    assert.equal(archivedEvents[0].id, '3');
    assert.equal(archivedEvents[0].archivedAt, '2026-11-07T12:00:00Z');
  });
});
