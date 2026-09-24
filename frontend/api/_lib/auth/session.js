// Our own app session — a cookie we control, HMAC-signed the same way the
// gateway signs its own tokens (MICROAPP_AUTH.md §6). Holds just enough to
// ask the gateway "is this still alive" on every request: sid, sub, email,
// name, role, and its own expiry (the backstop, not the mechanism — §5's
// introspect check is what actually locks things out).
import { createHmac, timingSafeEqual } from 'node:crypto';
import { config } from '../config.js';

const COOKIE_NAME = 'rizurf_feedback_session';
const SESSION_TTL_SECONDS = 15 * 60;

export const NO_STORE_HEADERS = {
  'cache-control': 'no-store, no-cache, must-revalidate, max-age=0',
  pragma: 'no-cache',
  expires: '0',
};

function sign(payload) {
  return createHmac('sha256', config.sessionSecret).update(payload).digest('base64url');
}

export function createSessionCookieValue(claims) {
  const session = {
    sid: claims.sid,
    sub: claims.sub,
    email: claims.email,
    name: claims.name,
    role: claims.role,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  };
  const payload = Buffer.from(JSON.stringify(session)).toString('base64url');
  return `${payload}.${sign(payload)}`;
}

// An expired session is treated as absent — otherwise a gateway sign-out
// during a long-lived cookie would never reach an app that stopped asking.
export function readSessionFromCookieValue(value) {
  if (!value) return null;
  const [payload, signature] = value.split('.');
  if (!payload || !signature) return null;

  const expected = sign(payload);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  let session;
  try {
    session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
  if (typeof session.exp !== 'number' || session.exp * 1000 < Date.now()) return null;
  return session;
}

export function setSessionCookie(res, claims) {
  const value = createSessionCookieValue(claims);
  const isHttps = config.publicUrl.startsWith('https://');
  res.setHeader(
    'set-cookie',
    `${COOKIE_NAME}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_TTL_SECONDS}${isHttps ? '; Secure' : ''}`,
  );
}

export function clearSessionCookie(res) {
  res.setHeader('set-cookie', `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
}

export function readSessionCookie(req) {
  const header = req.headers.cookie;
  if (!header) return null;
  const match = header.split(';').map((c) => c.trim()).find((c) => c.startsWith(`${COOKIE_NAME}=`));
  if (!match) return null;
  return readSessionFromCookieValue(match.slice(COOKIE_NAME.length + 1));
}

// MICROAPP_AUTH.md §5 — checked on every request, never cached. Fails open
// only on a network error; the session's own expiry above is the backstop
// for a gateway that stays down.
export async function gatewaySessionIsLive(session) {
  if (!session?.sid) return false;
  try {
    const response = await fetch(`${config.gatewayUrl}/oauth/introspect`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ sid: session.sid, sub: session.sub }),
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return true;
    const { active } = await response.json();
    return Boolean(active);
  } catch {
    return true;
  }
}
