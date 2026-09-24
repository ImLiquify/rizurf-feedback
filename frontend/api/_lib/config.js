import 'dotenv/config';

// SS-20: configuration from the environment, failing loudly at startup —
// never guessed, never read from the incoming request.
const required = [
  'DB_HOST',
  'DB_PORT',
  'DB_USER',
  'DB_NAME',
  'GATEWAY_URL',
  'PUBLIC_URL',
  'SERVICE_ID',
  'SESSION_SECRET',
];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

export const config = {
  db: {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD ?? '',
    database: process.env.DB_NAME,
  },
  gatewayUrl: process.env.GATEWAY_URL.replace(/\/+$/, ''),
  publicUrl: process.env.PUBLIC_URL.replace(/\/+$/, ''),
  serviceId: process.env.SERVICE_ID,
  sessionSecret: process.env.SESSION_SECRET,
};
