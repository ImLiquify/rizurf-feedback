import { Router } from 'express';
import { asyncHandler } from '../asyncHandler.js';
import { searchEmployees } from '../db/employees.js';
import { findAllReviewsWithNames, findReviewsByReceiver } from '../db/reviews.js';
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
    if (!req.query.preview) return res.json({ employees });

    // Directory tiles: each person's reviews that THIS viewer may see (same
    // visibility rule as the profile page), newest first, as rating/text/date
    // only: never an author, so an anonymous one can't be traced from here.
    // ponytail: every visible review in one response; cap per person (or send
    // precomputed tags) once there are thousands.
    const visible = viewReviewsFor(await findAllReviewsWithNames(), req.user);
    const byReceiver = new Map();
    for (const r of visible) {
      if (!byReceiver.has(r.receiverId)) byReceiver.set(r.receiverId, []);
      byReceiver.get(r.receiverId).push({ rating: r.rating, body: r.body, createdAt: r.createdAt });
    }
    res.json({ employees: employees.map((e) => ({ ...e, reviews: byReceiver.get(e.id) ?? [] })) });
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
