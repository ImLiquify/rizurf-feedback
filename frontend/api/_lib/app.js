import express from 'express';
import { randomUUID } from 'node:crypto';
import { buildHealth, OPENAPI_JSON } from './health.js';
import { requireSession } from './middleware/session.js';
import { authRouter } from './routes/auth.js';
import { employeesRouter } from './routes/employees.js';
import { reviewsRouter } from './routes/reviews.js';
import { adminRouter } from './routes/admin.js';
import { notificationsRouter } from './routes/notifications.js';
import { ApiError } from './errors.js';
import { asyncHandler } from './asyncHandler.js';
import { gatewayBadges } from './gatewayBadges.js';

const CORRELATION_HEADER = 'x-correlation-id';

export const app = express();
app.use(express.json());

// SS-4 — reuse the caller's id when present, mint one when absent, echo on
// every response including errors.
app.use((req, res, next) => {
  const supplied = req.headers[CORRELATION_HEADER];
  req.correlationId = typeof supplied === 'string' && supplied.trim() ? supplied : randomUUID();
  res.setHeader(CORRELATION_HEADER, req.correlationId);
  next();
});

// SS-2/SS-8 — public, no auth, cheap (MICROAPP_PERFORMANCE.md §3).
app.get('/health', async (req, res) => {
  res.json(await buildHealth());
});

// SS-3/SS-8 — public, built once at module load (MICROAPP_PERFORMANCE.md §4).
app.get('/openapi.json', (req, res) => {
  res.set('content-type', 'application/json');
  res.set('cache-control', 'public, max-age=60');
  res.send(OPENAPI_JSON);
});

// App-icon badge counts for the gateway: its own token, not a session, so
// it goes before requireSession and the 404 handler (MICROAPP_BADGES.md §3).
app.get('/gateway/badges', asyncHandler(gatewayBadges));

// SS-5 — a wrong method on a real path is 405, not 404.
app.all(['/health', '/openapi.json', '/gateway/badges'], (req, res) => {
  res.status(405).set('allow', 'GET').json({
    error: {
      code: 'METHOD_NOT_ALLOWED',
      message: `${req.method} is not allowed on ${req.path}.`,
      correlation_id: req.correlationId,
      details: null,
    },
  });
});

// MICROAPP_AUTH.md §4 — these establish the session, so they must be
// reachable without one.
app.use('/api', authRouter);

// Everything else requires a live gateway session, checked on every
// request (MICROAPP_AUTH.md §5).
app.use('/api', requireSession, employeesRouter, reviewsRouter, adminRouter, notificationsRouter);

// SS-5 — unrouted paths get the envelope, never framework HTML.
app.use((req, res) => {
  res.status(404).json({
    error: {
      code: 'RESOURCE_NOT_FOUND',
      message: `No route for ${req.path}.`,
      correlation_id: req.correlationId,
      details: null,
    },
  });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const correlationId = req.correlationId;
  if (err instanceof ApiError) {
    return res
      .status(err.status)
      .json({ error: { code: err.code, message: err.message, correlation_id: correlationId, details: null } });
  }
  if (err?.code === 'ER_DUP_ENTRY') {
    return res.status(422).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'This review already has a reply.',
        correlation_id: correlationId,
        details: null,
      },
    });
  }
  console.error(err);
  res
    .status(500)
    .json({ error: { code: 'INTERNAL_ERROR', message: 'Unexpected error.', correlation_id: correlationId, details: null } });
});
