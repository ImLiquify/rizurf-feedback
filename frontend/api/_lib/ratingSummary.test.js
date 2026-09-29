import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ratingSummary } from './ratingSummary.js';

test('averages and buckets ratings, anonymous included', () => {
  const s = ratingSummary([
    { rating: 5, visibility: 'public' },
    { rating: 5, visibility: 'anonymous' },
    { rating: 2, visibility: 'public' },
  ]);
  assert.equal(s.count, 3);
  assert.equal(s.average, 4);
  assert.deepEqual(s.counts, { 5: 2, 4: 0, 3: 0, 2: 1, 1: 0 });
});

test('no reviews means no average, not zero', () => {
  assert.deepEqual(ratingSummary([]), { average: null, count: 0, counts: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } });
});
