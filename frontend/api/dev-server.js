// Local dev only — not deployed. Vercel calls api/index.js's default export
// directly; this just gives the same Express app a port to listen on so
// Vite's dev-server proxy (vite.config.ts) has something to forward /api/*
// requests to.
import { app } from './_lib/app.js';

const PORT = Number(process.env.PORT ?? 4000);
app.listen(PORT, () => {
  console.log(`rizurf-feedback-api (dev) listening on http://127.0.0.1:${PORT}`);
});
