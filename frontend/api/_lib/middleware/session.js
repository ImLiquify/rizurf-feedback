import { readSessionCookie, gatewaySessionIsLive, clearSessionCookie, NO_STORE_HEADERS } from '../auth/session.js';
import { unauthorized } from '../errors.js';

// Replaces the old dev-only X-Mock-User-Id stand-in. MICROAPP_AUTH.md §5:
// checked on every authenticated request, no cache. §7: no-store on every
// authenticated response, or a browser-cached page never re-runs this
// check after sign-out.
export async function requireSession(req, res, next) {
  res.set(NO_STORE_HEADERS);

  const session = readSessionCookie(req);
  if (!session) return next(unauthorized('No session. Sign in through the gateway.'));

  const live = await gatewaySessionIsLive(session);
  if (!live) {
    clearSessionCookie(res);
    return next(unauthorized('Session ended at the gateway.'));
  }

  req.user = { id: session.sub, email: session.email, name: session.name, role: session.role };
  next();
}
