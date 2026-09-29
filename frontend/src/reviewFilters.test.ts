import { test } from 'node:test';
import assert from 'node:assert/strict';
import { filterReviews, NO_FILTER, topicCounts, topicsOf } from './reviewFilters.ts';

const reviews = [
  { id: 'a', body: 'Explains things clearly, great communication.', rating: 5, createdAt: '2026-01-01' },
  { id: 'b', body: 'Would like more heads-up before changes.', rating: 3, createdAt: '2026-03-01' },
  { id: 'c', body: 'Calm under pressure, strong ownership.', rating: 4, createdAt: '2026-02-01' },
];
const ids = (rs: { id: string }[]) => rs.map((r) => r.id);

test('tags behaviour from the text', () => {
  assert.deepEqual(topicsOf(reviews[0].body), ['Communication']);
  assert.deepEqual(topicsOf(reviews[2].body), ['Leadership']);
  assert.deepEqual(topicsOf('Shes the best HR!!!'), ['As HR']);
  assert.deepEqual(topicsOf('idk how is she hr by far the meanest person ever.'), ['Mean / rude', 'As HR']);
  assert.deepEqual(topicsOf('he is lazy'), ['Lazy']);
  assert.deepEqual(topicsOf('chill person'), ['Friendly']);
  assert.deepEqual(topicsOf('just yapping all the time'), ['Talkative']);
  // Whole words only: no Friendly for "kinda", no Mean for "meaning".
  assert.deepEqual(topicsOf('kinda meaningful function'), []);
});

test('counts tags with their average rating, most mentioned first', () => {
  const rs = [
    { body: 'Shes the best HR', rating: 5, createdAt: '2026-01-01' },
    { body: 'great hr, very helpful', rating: 4, createdAt: '2026-01-02' },
    { body: 'helped me out', rating: 3, createdAt: '2026-01-03' },
    { body: 'so helpful', rating: 5, createdAt: '2026-01-04' },
  ];
  assert.deepEqual(topicCounts(rs), [
    { topic: 'Helpful', count: 3, average: 4 },
    { topic: 'As HR', count: 2, average: 4.5 },
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
