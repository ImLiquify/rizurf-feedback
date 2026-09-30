import { Router } from 'express';
import { asyncHandler } from '../asyncHandler.js';
import { searchEmployees } from '../db/employees.js';
import { findReviewsByReceiver } from '../db/reviews.js';
import { findRepliesForReviews } from '../db/replies.js';
import { viewReviewsFor } from '../visibility.js';
import { syncInternRoster } from '../roster.js';
import { ratingSummary } from '../ratingSummary.js';

export const employeesRouter = Router();

employeesRouter.get(
  '/employees',
  asyncHandler(async (req, res) => {
    // A roster outage must never break search — log it and serve what we have.
    await syncInternRoster().catch((err) => console.error('Intern roster sync failed:', err.message));
    const employees = await searchEmployees(String(req.query.q ?? ''));
    res.json({ employees });
  }),
);

employeesRouter.get(
  '/employees/:id/reviews',
  asyncHandler(async (req, res) => {
    const reviews = await findReviewsByReceiver(req.params.id);
    const visible = viewReviewsFor(reviews, req.user);
    const replies = await findRepliesForReviews(visible.map((r) => r.id));
    const repliesByReview = new Map(replies.map((reply) => [reply.reviewId, reply]));
    res.json({
      summary: ratingSummary(reviews),
      reviews: visible.map((review) => ({ ...review, reply: repliesByReview.get(review.id) ?? null })),
    });
  }),
);
