import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { filterBySearch } from '../features/expenses/expenseSearch.ts';

describe('Expense filterBySearch Domain Helper', () => {
  const sampleExpenses = [
    {
      id: 'e1',
      name: 'Grand Ballroom Venue',
      vendor: 'Leela Palace',
    },
    {
      id: 'e2',
      name: 'Wedding Photography',
      vendor: 'PixelCraft Studios',
    },
    {
      id: 'e3',
      name: 'Buffet Catering',
      vendor: 'Flavors of Malabar',
    },
    {
      id: 'e4',
      name: 'Return Gifts',
      vendor: undefined,
    },
  ];

  it('returns all items when query is empty or whitespace', () => {
    assert.deepEqual(filterBySearch(sampleExpenses, ''), sampleExpenses);
    assert.deepEqual(filterBySearch(sampleExpenses, '   '), sampleExpenses);
  });

  it('filters items by name case-insensitively', () => {
    const venueMatches = filterBySearch(sampleExpenses, 'ballroom');
    assert.equal(venueMatches.length, 1);
    assert.equal(venueMatches[0].id, 'e1');

    const photoMatches = filterBySearch(sampleExpenses, 'PHOTOGRAPHY');
    assert.equal(photoMatches.length, 1);
    assert.equal(photoMatches[0].id, 'e2');

    const giftsMatches = filterBySearch(sampleExpenses, 'gifts');
    assert.equal(giftsMatches.length, 1);
    assert.equal(giftsMatches[0].id, 'e4');
  });

  it('filters items by vendor case-insensitively', () => {
    const leelaMatches = filterBySearch(sampleExpenses, 'leela');
    assert.equal(leelaMatches.length, 1);
    assert.equal(leelaMatches[0].id, 'e1');

    const malabarMatches = filterBySearch(sampleExpenses, 'MALABAR');
    assert.equal(malabarMatches.length, 1);
    assert.equal(malabarMatches[0].id, 'e3');

    const pixelMatches = filterBySearch(sampleExpenses, 'pixelcraft');
    assert.equal(pixelMatches.length, 1);
    assert.equal(pixelMatches[0].id, 'e2');
  });

  it('handles items with undefined vendor gracefully', () => {
    const results = filterBySearch(sampleExpenses, 'craft');
    assert.equal(results.length, 1);
    assert.equal(results[0].id, 'e2');
  });

  it('returns empty array when no item matches query', () => {
    const results = filterBySearch(sampleExpenses, 'Nonexistent Vendor');
    assert.equal(results.length, 0);
  });

  it('supports custom field extraction if provided', () => {
    const customItems = [
      { id: '1', title: 'DJ Night', location: 'Beach' },
      { id: '2', title: 'Dinner', location: 'Rooftop' },
    ];
    const results = filterBySearch(customItems, 'beach', (item) => [item.title, item.location]);
    assert.equal(results.length, 1);
    assert.equal(results[0].id, '1');
  });
});
