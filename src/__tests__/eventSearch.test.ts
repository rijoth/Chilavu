import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { matchesEventSearch, filterEvents } from '../features/events/eventSearch.ts';

describe('Event Search and Filtering', () => {
  const sampleEvents = [
    {
      id: '1',
      name: 'Sarah & Alex Wedding',
      eventDate: '2026-11-20',
    },
    {
      id: '2',
      name: 'Goa Trip 2026',
      eventDate: '2026-12-05',
    },
    {
      id: '3',
      name: 'Birthday Party',
      eventDate: '2027-01-15',
    },
    {
      id: '4',
      name: 'Housewarming Dinner',
      eventDate: undefined,
    },
  ];

  it('returns true for empty or whitespace-only search queries', () => {
    assert.equal(matchesEventSearch(sampleEvents[0], ''), true);
    assert.equal(matchesEventSearch(sampleEvents[0], '   '), true);
    assert.equal(filterEvents(sampleEvents, '').length, 4);
    assert.equal(filterEvents(sampleEvents, '  ').length, 4);
  });

  it('matches event names case-insensitively', () => {
    assert.equal(matchesEventSearch(sampleEvents[0], 'wedding'), true);
    assert.equal(matchesEventSearch(sampleEvents[0], 'WEDDING'), true);
    assert.equal(matchesEventSearch(sampleEvents[0], 'Sarah'), true);
    assert.equal(matchesEventSearch(sampleEvents[0], 'alex'), true);
    assert.equal(matchesEventSearch(sampleEvents[1], 'goa'), true);
  });

  it('matches raw ISO date strings', () => {
    assert.equal(matchesEventSearch(sampleEvents[0], '2026-11'), true);
    assert.equal(matchesEventSearch(sampleEvents[0], '2026-11-20'), true);
    assert.equal(matchesEventSearch(sampleEvents[1], '2026-12-05'), true);
  });

  it('matches formatted month names and dates', () => {
    // Sarah's wedding is in November (2026-11-20)
    assert.equal(matchesEventSearch(sampleEvents[0], 'Nov'), true);
    assert.equal(matchesEventSearch(sampleEvents[0], 'november'), true);
    assert.equal(matchesEventSearch(sampleEvents[0], 'NOVEMBER'), true);

    // Goa Trip is in December (2026-12-05)
    assert.equal(matchesEventSearch(sampleEvents[1], 'Dec'), true);
    assert.equal(matchesEventSearch(sampleEvents[1], 'december'), true);

    // Birthday Party is in January (2027-01-15)
    assert.equal(matchesEventSearch(sampleEvents[2], 'Jan'), true);
    assert.equal(matchesEventSearch(sampleEvents[2], 'january'), true);
    assert.equal(matchesEventSearch(sampleEvents[2], '2027'), true);
  });

  it('matches event without eventDate only by name', () => {
    assert.equal(matchesEventSearch(sampleEvents[3], 'dinner'), true);
    assert.equal(matchesEventSearch(sampleEvents[3], 'Housewarming'), true);
    assert.equal(matchesEventSearch(sampleEvents[3], '2026'), false);
    assert.equal(matchesEventSearch(sampleEvents[3], 'nov'), false);
  });

  it('returns false when neither name nor date matches', () => {
    assert.equal(matchesEventSearch(sampleEvents[0], 'conference'), false);
    assert.equal(matchesEventSearch(sampleEvents[1], '2028'), false);
    assert.equal(matchesEventSearch(sampleEvents[2], 'summer'), false);
  });

  it('correctly filters a list of events', () => {
    const weddingMatches = filterEvents(sampleEvents, 'wedding');
    assert.equal(weddingMatches.length, 1);
    assert.equal(weddingMatches[0].name, 'Sarah & Alex Wedding');

    const year2026Matches = filterEvents(sampleEvents, '2026');
    // Events 0 and 1 have 2026 in date and/or name
    assert.equal(year2026Matches.length, 2);

    const noMatches = filterEvents(sampleEvents, 'Nonexistent Query XYZ');
    assert.equal(noMatches.length, 0);
  });
});
