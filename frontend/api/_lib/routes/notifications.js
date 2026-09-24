import { Router } from 'express';
import { asyncHandler } from '../asyncHandler.js';
import { findNotificationsForUser } from '../db/notifications.js';

export const notificationsRouter = Router();

notificationsRouter.get(
  '/notifications',
  asyncHandler(async (req, res) => {
    const notifications = await findNotificationsForUser(req.user.id);
    res.json({ notifications });
  }),
);
