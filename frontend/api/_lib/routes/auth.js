import { Router } from 'express';
import { asyncHandler } from '../asyncHandler.js';
import { config } from '../config.js';
import { verifyToken } from '../auth/verifyToken.js';
import { setSessionCookie, readSessionCookie, gatewaySessionIsLive, clearSessionCookie, NO_STORE_HEADERS } from '../auth/session.js';
import { upsertEmployeeFromGateway, findEmployeeById } from '../db/employees.js';
import { unauthorized, validationError } from '../errors.js';

export const authRouter = Router();

// MICROAPP_AUTH.md §4 step 1 — send an unauthenticated visitor here. The
// frontend calls this as a plain navigation (window.location), never fetch.
authRouter.get('/auth/login', (req, res) => {
  res.set(NO_STORE_HEADERS);
  const redirectUri = `${config.publicUrl}/`;
  res.redirect(302, `${config.gatewayUrl}/oauth/authorize?redirect_uri=${encodeURIComponent(redirectUri)}`);
});

// MICROAPP_AUTH.md §4 steps 4-6 — our server, never the browser, exchanges
// the one-time code for an identity token. The browser only ever talks to
// this endpoint, not the gateway's /oauth/token directly.
authRouter.post(
  '/auth/callback',
  asyncHandler(async (req, res) => {
    res.set(NO_STORE_HEADERS);
    const { code } = req.body ?? {};
    if (!code) throw validationError('Missing code.');

    const redirectUri = `${config.publicUrl}/`;
    const tokenRes = await fetch(`${config.gatewayUrl}/oauth/token`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ code, redirect_uri: redirectUri }),
      signal: AbortSignal.timeout(5000),
    });
    if (!tokenRes.ok) {
      throw validationError(`The gateway refused the sign-in code (HTTP ${tokenRes.status}): ${await tokenRes.text()}`);
    }
    const { token } = await tokenRes.json();

    let claims;
    try {
      claims = await verifyToken(token, 'identity');
    } catch (err) {
      throw validationError(`Sign-in token rejected: ${err.message}`);
    }

    const uid = await upsertEmployeeFromGateway({
      id: claims.sub,
      email: claims.email,
      name: claims.name,
      role: claims.role,
    });

    setSessionCookie(res, { ...claims, uid });
    res.json({ user: { id: uid, email: claims.email, name: claims.name, role: claims.role } });
  }),
);

// What the frontend calls on load to know who (if anyone) is signed in.
// Runs the exact same live check as requireSession so a stale cookie never
// reports a stale user.
authRouter.get(
  '/auth/session',
  asyncHandler(async (req, res) => {
    res.set(NO_STORE_HEADERS);
    const session = readSessionCookie(req);
    if (!session) throw unauthorized('No session. Sign in through the gateway.');

    const live = await gatewaySessionIsLive(session);
    if (!live) {
      clearSessionCookie(res);
      throw unauthorized('Session ended at the gateway.');
    }

    const uid = session.uid ?? session.sub;
    const employee = await findEmployeeById(uid);
    res.json({
      user: employee ?? { id: uid, email: session.email, name: session.name, role: session.role },
    });
  }),
);
