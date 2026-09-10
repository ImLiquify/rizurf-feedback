// Vercel entrypoint. All routes are rewritten here (see vercel.json) so the
// existing Express app's own logic — auth, /health, /openapi.json, static
// asset serving from dist/ — runs unchanged, request by request, with no
// persistent process in between invocations.
import app, { ready } from '../server/rizurfApi.js';

export default async function handler(req, res) {
  await ready;
  return app(req, res);
}