import { Router } from 'express';
import { asyncHandler } from '../asyncHandler.js';
import { forbidden, notFound } from '../errors.js';
import { isAdminRole } from '../visibility.js';
import { listOpenFlagsWithReview, findFlagById, resolveFlag } from '../db/flags.js';
import { deleteReview, findAllReviewsWithNames, findReviewById } from '../db/reviews.js';
import { insertNotification } from '../db/notifications.js';
import { searchEmployees } from '../db/employees.js';
import { buildWall } from '../wall.js';
import { syncInternRoster } from '../roster.js';

export const adminRouter = Router();

function requireAdmin(req) {
  if (!isAdminRole(req.user.role)) throw forbidden('Admin or HR role is required.');
}

adminRouter.get(
  '/admin/flags',
  asyncHandler(async (req, res) => {
    requireAdmin(req);
    const flags = await listOpenFlagsWithReview();
    res.json({ flags });
  }),
);

adminRouter.patch(
  '/admin/flags/:id',
  asyncHandler(async (req, res) => {
    requireAdmin(req);
    const flag = await findFlagById(req.params.id);
    if (!flag) throw notFound(`No flag with id ${req.params.id}.`);

    await resolveFlag(req.params.id);
    if (req.body?.deleteReview) await deleteReview(flag.reviewId);
    const review = req.body?.deleteReview ? null : await findReviewById(flag.reviewId);
    await insertNotification({
      userId: flag.flaggedBy,
      type: 'flag_resolved',
      message: 'Your flag was resolved.',
      link: review && `/employees/${review.receiverId}#review-${review.id}`,
    });

    res.status(204).send();
  }),
);

// The employee wall: every employee, with the reviews they gave and the
// reviews they received, author always shown — admin/hr only. Grouped in
// memory from one bulk query rather than one request per employee.
adminRouter.get(
  '/admin/wall',
  asyncHandler(async (req, res) => {
    requireAdmin(req);
    await syncInternRoster().catch((err) => console.error('Intern roster sync failed:', err.message));

    const [employees, reviews] = await Promise.all([searchEmployees(''), findAllReviewsWithNames()]);
    res.json({ employees: buildWall(employees, reviews) });
  }),
);
