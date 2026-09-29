import 'dotenv/config';

// SS-20: configuration from the environment, failing loudly at startup —
// never guessed, never read from the incoming request.
const required = [
  'DB_HOST',
  'DB_PORT',
  'DB_USER',
  'DB_NAME',
  'GATEWAY_URL',
  'SESSION_SECRET',
];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

// PUBLIC_URL, else Vercel's own production domain (a system env var, not
// anything from the request).
const publicUrl =
  process.env.PUBLIC_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL && `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`);
if (!publicUrl) throw new Error('Missing required environment variable: PUBLIC_URL');

// The gateway's client_id doubles as this service's id (the token `aud`).
const serviceId = process.env.SERVICE_ID || process.env.CLIENT_ID;
if (!serviceId) throw new Error('Missing required environment variable: CLIENT_ID (or SERVICE_ID)');

export const config = {
  db: {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD ?? '',
    database: process.env.DB_NAME,
  },
  gatewayUrl: process.env.GATEWAY_URL.replace(/\/+$/, ''),
  publicUrl: publicUrl.replace(/\/+$/, ''),
  serviceId,
  sessionSecret: process.env.SESSION_SECRET,
  // Intern roster sync (roster.js) — skipped entirely if no CLIENT_SECRET.
  clientId: process.env.CLIENT_ID || serviceId,
  clientSecret: process.env.CLIENT_SECRET,
  internApiUrl: (process.env.INTERN_API_URL || 'https://intern-database.vercel.app').replace(/\/+$/, ''),
};
