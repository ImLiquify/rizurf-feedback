import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isAdminRole, newReviewNotice, viewReviewFor, viewReviewsFor } from './visibility.js';

const receiver = { id: 'emp-1', role: 'employee' };
const author = { id: 'emp-3', role: 'employee' };
const unrelated = { id: 'emp-2', role: 'employee' };
const admin = { id: 'emp-5', role: 'admin' };
const hr = { id: 'emp-6', role: 'hr' };

const publicReview = {
  id: 'rev-pub', authorId: 'emp-3', receiverId: 'emp-1', rating: 4,
  body: 'Good work.', visibility: 'public',
};
const anonReview = { ...publicReview, id: 'rev-anon', visibility: 'anonymous' };

test('isAdminRole is true for admin and hr only', () => {
  assert.equal(isAdminRole('admin'), true);
  assert.equal(isAdminRole('hr'), true);
  assert.equal(isAdminRole('employee'), false);
  assert.equal(isAdminRole('supervisor'), false);
});

test('a public review shows its author to anyone', () => {
  assert.deepEqual(viewReviewFor(publicReview, unrelated), { ...publicReview });
});

test('an anonymous review shows the receiver its author stripped', () => {
  assert.deepEqual(viewReviewFor(anonReview, receiver), { ...anonReview, authorId: null });
});

test('an anonymous review shows its own author their identity', () => {
  assert.deepEqual(viewReviewFor(anonReview, author), { ...anonReview });
});

test('an anonymous review shows admin/hr the author', () => {
  assert.deepEqual(viewReviewFor(anonReview, admin), { ...anonReview });
  assert.deepEqual(viewReviewFor(anonReview, hr), { ...anonReview });
});

test('an anonymous review is hidden entirely from an unrelated employee', () => {
  assert.equal(viewReviewFor(anonReview, unrelated), null);
});

test('viewReviewsFor filters out reviews the requester may not see', () => {
  const result = viewReviewsFor([publicReview, anonReview], unrelated);
  assert.deepEqual(result, [{ ...publicReview }]);
});

test('the new-review notification never names an anonymous author', () => {
  assert.equal(newReviewNotice('Bob Santos', 'public'), 'Bob Santos left you a review.');
  assert.equal(newReviewNotice('Bob Santos', 'anonymous'), 'New anonymous review.');
});
