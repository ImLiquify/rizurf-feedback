// Vercel serverless entry point. vercel.json rewrites every /api/* request
// to this function; the Express app inside does its own routing from the
// full path, so no per-route files are needed.
import { app } from './_lib/app.js';

export default app;
