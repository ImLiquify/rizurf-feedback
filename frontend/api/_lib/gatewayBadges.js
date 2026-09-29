// GET /gateway/badges (MICROAPP_BADGES.md): the gateway reads each person's
// unread count for the number on this app's icon. Only the gateway may call
// it: a gateway-signed ACCESS token for this service carrying
// gateway:badges:read. No browser session involved, so it sits before
// requireSession in app.js.
import { verifyToken } from './auth/verifyToken.js';
import { unauthorized } from './errors.js';
import { unreadCountsByEmail } from './db/notifications.js';

export async function gatewayBadges(req, res) {
  const match = /^Bearer\s+(\S+)$/i.exec(req.get('authorization') ?? '');
  if (!match) throw unauthorized('A gateway access token is required.');

  let claims;
  try {
    claims = await verifyToken(match[1], 'access');
  } catch {
    throw unauthorized('Gateway token required.');
  }
  if (!String(claims.scope ?? '').split(/\s+/).includes('gateway:badges:read')) {
    throw unauthorized('Gateway token required.');
  }

  res.set('cache-control', 'no-store');
  res.json({ badges: await unreadCountsByEmail() });
}
