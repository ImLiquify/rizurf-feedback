// Local dev only — kept outside api/ so Vercel never deploys it as a function. Vercel calls api/index.js's default export
// directly; this just gives the same Express app a port to listen on so
// Vite's dev-server proxy (vite.config.ts) has something to forward /api/*
// requests to.
import express from 'express';
import { app } from './api/_lib/app.js';
import { setSessionCookie } from './api/_lib/auth/session.js';
import { findEmployeeById } from './api/_lib/db/employees.js';

// There's no gateway locally, so sign-in skips it: /api/auth/login signs you
// in as a seed user straight away. Switch users with ?as=emp-1 (default: the
// emp-5 admin). This file never runs on Vercel, so production is unaffected.
const devApp = express();
devApp.get('/api/auth/login', async (req, res, next) => {
  try {
    const user = await findEmployeeById(String(req.query.as ?? 'emp-5'));
    if (!user) return res.status(404).send('No such employee.');
    setSessionCookie(res, { sid: 'local-dev', sub: user.id, email: user.email, name: user.name, role: user.role });
    res.redirect('/');
  } catch (err) {
    next(err);
  }
});
devApp.use(app);

const PORT = Number(process.env.PORT ?? 4000);
devApp.listen(PORT, () => {
  console.log(`rizurf-feedback-api (dev) listening on http://127.0.0.1:${PORT}`);
});
