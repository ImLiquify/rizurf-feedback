import { readSessionCookie, gatewaySessionIsLive, clearSessionCookie, NO_STORE_HEADERS } from '../auth/session.js';
import { unauthorized } from '../errors.js';

// MICROAPP_AUTH.md §5: checked on every authenticated request, no cache.
// §7: no-store on every authenticated response, or a browser-cached page
// never re-runs this check after sign-out.
export async function requireSession(req, res, next) {
  res.set(NO_STORE_HEADERS);

  const session = readSessionCookie(req);
  if (!session) return next(unauthorized('No session. Sign in through the gateway.'));

  const live = gatewaySessionIsLive(session);
  req.user = { id: session.uid ?? session.sub, email: session.email, name: session.name, role: session.role };

  // Writes: check first, write second — never touch data for a dead session.
  if (req.method !== 'GET') {
    if (!(await live)) return endedAtGateway(res, next);
    return next();
  }

  // Reads (RIZURF_PERFORMANCE_CHANGES.md §5): start loading data while the
  // gateway answers, but hold the response until it has. A dead session gets
  // the 401 and none of the data.
  const send = res.json.bind(res);
  res.json = (body) => {
    live.then((ok) => {
      if (ok) return send(body);
      res.json = send;
      endedAtGateway(res, (err) => res.status(err.status).json({
        error: { code: err.code, message: err.message, correlation_id: req.correlationId, details: null },
      }));
    });
    return res;
  };
  next();
}

function endedAtGateway(res, next) {
  clearSessionCookie(res);
  next(unauthorized('Session ended at the gateway.'));
}
