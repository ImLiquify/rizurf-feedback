import { Router } from 'express';
import { newReviewNotice } from '../visibility.js';
import { asyncHandler } from '../asyncHandler.js';
import { validationError, forbidden, notFound } from '../errors.js';
import { findReviewById, findReviewsByAuthor, insertReview, updateReview, deleteReview } from '../db/reviews.js';
import { insertReply, findReplyForReview, findRepliesForReviews } from '../db/replies.js';
import { insertFlag } from '../db/flags.js';
import { insertNotification } from '../db/notifications.js';
import { findEmployeeById } from '../db/employees.js';

export const reviewsRouter = Router();

// The "Me" page's second half: everything the signed-in person has written,
// with who it was about. Always their own reviews, so no visibility filter.
reviewsRouter.get(
  '/me/reviews-given',
  asyncHandler(async (req, res) => {
    const reviews = await findReviewsByAuthor(req.user.id);
    const replies = await findRepliesForReviews(reviews.map((r) => r.id));
    const byReview = new Map(replies.map((reply) => [reply.reviewId, reply]));
    res.json({ reviews: reviews.map((r) => ({ ...r, reply: byReview.get(r.id) ?? null })) });
  }),
);

function assertRating(rating) {
  if (rating !== undefined && (typeof rating !== 'number' || rating < 1 || rating > 5)) {
    throw validationError('Rating must be between 1 and 5.');
  }
}

reviewsRouter.post(
  '/reviews',
  asyncHandler(async (req, res) => {
    const { receiverId, rating, body, visibility } = req.body ?? {};
    if (receiverId === req.user.id) throw validationError('You cannot review yourself.');
    if (rating === undefined) throw validationError('Pick a star rating.');
    assertRating(rating);
    if (!body || !String(body).trim()) throw validationError('Review text is required.');
    if (visibility !== 'public' && visibility !== 'anonymous') throw validationError('Visibility must be "public" or "anonymous".');

    const receiver = await findEmployeeById(receiverId);
    if (!receiver) throw notFound(`No employee with id ${receiverId}.`);

    const review = await insertReview({ authorId: req.user.id, receiverId, rating, body: String(body).trim(), visibility });
    await insertNotification({ userId: receiverId, type: 'review_received', message: newReviewNotice(req.user.name, visibility) });
    res.status(201).json({ review });
  }),
);

reviewsRouter.patch(
  '/reviews/:id',
  asyncHandler(async (req, res) => {
    const review = await findReviewById(req.params.id);
    if (!review) throw notFound(`No review with id ${req.params.id}.`);
    if (review.authorId !== req.user.id) throw forbidden('Only the author can edit this review.');

    const { rating, body, visibility } = req.body ?? {};
    assertRating(rating);
    if (visibility !== undefined && visibility !== 'public' && visibility !== 'anonymous') {
      throw validationError('Visibility must be "public" or "anonymous".');
    }

    const updated = await updateReview(req.params.id, {
      rating,
      body: body !== undefined ? String(body).trim() : undefined,
      visibility,
    });
    res.json({ review: updated });
  }),
);

reviewsRouter.delete(
  '/reviews/:id',
  asyncHandler(async (req, res) => {
    const review = await findReviewById(req.params.id);
    if (!review) throw notFound(`No review with id ${req.params.id}.`);
    if (review.authorId !== req.user.id) throw forbidden('Only the author can delete this review.');

    await deleteReview(req.params.id);
    res.status(204).send();
  }),
);

reviewsRouter.post(
  '/reviews/:id/replies',
  asyncHandler(async (req, res) => {
    const review = await findReviewById(req.params.id);
    if (!review) throw notFound(`No review with id ${req.params.id}.`);
    if (review.receiverId !== req.user.id) throw forbidden('Only the review recipient can reply.');

    const existing = await findReplyForReview(req.params.id);
    if (existing) throw validationError('This review already has a reply.');

    const { body } = req.body ?? {};
    if (!body || !String(body).trim()) throw validationError('Reply text is required.');

    const reply = await insertReply({ reviewId: req.params.id, authorId: req.user.id, body: String(body).trim() });
    await insertNotification({ userId: review.authorId, type: 'reply_received', message: `${req.user.name} replied to your review.` });
    res.status(201).json({ reply });
  }),
);

reviewsRouter.post(
  '/reviews/:id/flags',
  asyncHandler(async (req, res) => {
    const review = await findReviewById(req.params.id);
    if (!review) throw notFound(`No review with id ${req.params.id}.`);

    const { reason } = req.body ?? {};
    if (!reason || !String(reason).trim()) throw validationError('A reason is required to flag a review.');

    const flag = await insertFlag({ reviewId: req.params.id, flaggedBy: req.user.id, reason: String(reason).trim() });
    res.status(201).json({ flag });
  }),
);
