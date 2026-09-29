import { Router } from 'express';
import { asyncHandler } from '../asyncHandler.js';
import { findNotificationsForUser, markNotificationRead, markNotificationsRead } from '../db/notifications.js';

export const notificationsRouter = Router();

notificationsRouter.get(
  '/notifications',
  asyncHandler(async (req, res) => {
    const notifications = await findNotificationsForUser(req.user.id);
    res.json({ notifications });
  }),
);

// Marks everything read, which also clears the badge on
// the app's icon in the gateway.
notificationsRouter.post(
  '/notifications/read',
  asyncHandler(async (req, res) => {
    await markNotificationsRead(req.user.id);
    res.status(204).send();
  }),
);

// Opening one notification marks just that one read.
notificationsRouter.post(
  '/notifications/:id/read',
  asyncHandler(async (req, res) => {
    await markNotificationRead(req.user.id, req.params.id);
    res.status(204).send();
  }),
);
