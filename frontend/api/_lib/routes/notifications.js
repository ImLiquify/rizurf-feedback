import { Router } from 'express';
import { asyncHandler } from '../asyncHandler.js';
import { findNotificationsForUser, markNotificationsRead } from '../db/notifications.js';

export const notificationsRouter = Router();

notificationsRouter.get(
  '/notifications',
  asyncHandler(async (req, res) => {
    const notifications = await findNotificationsForUser(req.user.id);
    res.json({ notifications });
  }),
);

// Opening the bell marks everything read, which also clears the badge on
// the app's icon in the gateway.
notificationsRouter.post(
  '/notifications/read',
  asyncHandler(async (req, res) => {
    await markNotificationsRead(req.user.id);
    res.status(204).send();
  }),
);
