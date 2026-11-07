import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { validateBackupJson } from '../features/backup/importValidation.ts';

describe('Backup Validation', () => {
  it('accepts a valid backup file with matching relationships', () => {
    const validJson = JSON.stringify({
      app: 'EventLedger',
      schemaVersion: 1,
      exportedAt: '2026-11-07T12:00:00.000Z',
      data: {
        events: [
          {
            id: 'ev-1',
            name: 'Annual Reunion',
            currency: 'INR',
            budgetAmount: 10000000,
            createdAt: '2026-11-07T12:00:00.000Z',
            updatedAt: '2026-11-07T12:00:00.000Z',
          },
        ],
        expenses: [
          {
            id: 'exp-1',
            eventId: 'ev-1',
            name: 'Catering',
            expectedAmount: 5000000,
            createdAt: '2026-11-07T12:00:00.000Z',
            updatedAt: '2026-11-07T12:00:00.000Z',
          },
        ],
        payments: [
          {
            id: 'pay-1',
            expenseId: 'exp-1',
            amount: 2000000,
            paymentDate: '2026-11-07',
            createdAt: '2026-11-07T12:00:00.000Z',
            updatedAt: '2026-11-07T12:00:00.000Z',
          },
        ],
      },
    });

    const result = validateBackupJson(validJson);
    assert.equal(result.isValid, true);
    assert.equal(result.errors.length, 0);
    assert.ok(result.parsedFile);
    assert.equal(result.parsedFile.data.events.length, 1);
  });

  it('rejects invalid JSON syntax', () => {
    const result = validateBackupJson('{ not-valid-json');
    assert.equal(result.isValid, false);
    assert.match(result.errors[0], /Invalid JSON/);
  });

  it('rejects wrong app name or schema version', () => {
    const invalidApp = JSON.stringify({
      app: 'OtherApp',
      schemaVersion: 1,
      data: { events: [], expenses: [], payments: [] },
    });
    const resApp = validateBackupJson(invalidApp);
    assert.equal(resApp.isValid, false);

    const invalidVersion = JSON.stringify({
      app: 'EventLedger',
      schemaVersion: 99,
      data: { events: [], expenses: [], payments: [] },
    });
    const resVer = validateBackupJson(invalidVersion);
    assert.equal(resVer.isValid, false);
  });

  it('rejects broken foreign key references', () => {
    const brokenFk = JSON.stringify({
      app: 'EventLedger',
      schemaVersion: 1,
      exportedAt: '2026-11-07T12:00:00.000Z',
      data: {
        events: [],
        expenses: [
          {
            id: 'exp-1',
            eventId: 'non-existent-event',
            name: 'Photography',
            expectedAmount: 10000,
          },
        ],
        payments: [],
      },
    });

    const result = validateBackupJson(brokenFk);
    assert.equal(result.isValid, false);
    assert.match(result.errors[0], /references non-existent eventId/);
  });

  it('rejects duplicate IDs within dataset', () => {
    const duplicateId = JSON.stringify({
      app: 'EventLedger',
      schemaVersion: 1,
      exportedAt: '2026-11-07T12:00:00.000Z',
      data: {
        events: [
          { id: 'dup-1', name: 'Event A', currency: 'USD' },
          { id: 'dup-1', name: 'Event B', currency: 'USD' },
        ],
        expenses: [],
        payments: [],
      },
    });

    const result = validateBackupJson(duplicateId);
    assert.equal(result.isValid, false);
    assert.match(result.errors[0], /Duplicate event ID/);
  });
});
