import { test } from 'node:test';
import assert from 'node:assert/strict';
import { filterReviews, NO_FILTER, topicCounts, topicsOf } from './reviewFilters.ts';

const reviews = [
  { id: 'a', body: 'Explains things clearly, great communication.', rating: 5, createdAt: '2026-01-01' },
  { id: 'b', body: 'Would like more heads-up before changes.', rating: 3, createdAt: '2026-03-01' },
  { id: 'c', body: 'Calm under pressure, strong ownership.', rating: 4, createdAt: '2026-02-01' },
];
const ids = (rs: { id: string }[]) => rs.map((r) => r.id);

test('tags topics from the text', () => {
  assert.deepEqual(topicsOf(reviews[0].body), ['Communication']);
  assert.deepEqual(topicsOf(reviews[2].body), ['Leadership', 'Attitude']);
  assert.deepEqual(topicCounts(reviews), [
    { topic: 'Communication', count: 2 },
    { topic: 'Leadership', count: 1 },
    { topic: 'Attitude', count: 1 },
  ]);
});

test('filters by topic, stars and search, and sorts', () => {
  assert.deepEqual(ids(filterReviews(reviews, NO_FILTER)), ['b', 'c', 'a']);
  assert.deepEqual(ids(filterReviews(reviews, { ...NO_FILTER, sort: 'oldest' })), ['a', 'c', 'b']);
  assert.deepEqual(ids(filterReviews(reviews, { ...NO_FILTER, sort: 'lowest' })), ['b', 'c', 'a']);
  assert.deepEqual(ids(filterReviews(reviews, { ...NO_FILTER, topic: 'Communication' })), ['b', 'a']);
  assert.deepEqual(ids(filterReviews(reviews, { ...NO_FILTER, stars: 4 })), ['c']);
  assert.deepEqual(ids(filterReviews(reviews, { ...NO_FILTER, query: 'CALM' })), ['c']);
  assert.deepEqual(ids(filterReviews(reviews, { ...NO_FILTER, query: 'bob' }, (r) => (r.id === 'a' ? 'Bob' : ''))), ['a']);
});
