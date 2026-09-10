function required(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function positiveInteger(value, fallback) {
  const parsed = Number(value ?? fallback);
  if (!Number.isInteger(parsed) || parsed <= 0) throw new Error('PORT must be a positive integer.');
  return parsed;
}

export const config = Object.freeze({
  port: positiveInteger(process.env.PORT, 3001),
  serviceId: required('SERVICE_ID'),
  gatewayUrl: required('GATEWAY_URL').replace(/\/+$/, ''),
  publicUrl: required('PUBLIC_URL').replace(/\/+$/, ''),
  sessionSecret: required('SESSION_SECRET'),
  sessionTtlSeconds: 15 * 60,
  db: {
    host: process.env.DB_HOST || '127.0.0.1', port: Number(process.env.DB_PORT || 3306),
    database: process.env.DB_NAME || 'pulsefeedback', user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '', ssl: process.env.DB_SSL === 'true'
  },
  internApiBaseUrl: process.env.INTERN_API_BASE_URL?.replace(/\/+$/, ''),
  internApiAudience: process.env.INTERN_API_AUDIENCE,
  clientId: process.env.CLIENT_ID, clientSecret: process.env.CLIENT_SECRET
});