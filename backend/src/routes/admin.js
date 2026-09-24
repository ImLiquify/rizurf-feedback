import { Router } from 'express';
import { asyncHandler } from '../asyncHandler.js';
import { forbidden, notFound } from '../errors.js';
import { isAdminRole } from '../visibility.js';
import { listOpenFlagsWithReview, findFlagById, resolveFlag } from '../db/flags.js';
import { deleteReview } from '../db/reviews.js';
import { insertNotification } from '../db/notifications.js';

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
    await insertNotification({ userId: flag.flaggedBy, type: 'flag_resolved', message: 'Your flag was resolved.' });

    res.status(204).send();
  }),
);
