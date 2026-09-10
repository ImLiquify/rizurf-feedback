import mysql from 'mysql2/promise';
import { config } from './config.js';

// No Express imports: workers and command-line tasks may reuse this DAL.
//
// On Vercel each invocation may spin up its own process, so a large pool
// (fine for one long-lived server) can exhaust a small hosted MySQL plan's
// max_connections under concurrent invocations. Keep the limit small when
// VERCEL is set; local dev keeps the old default.
export const pool = mysql.createPool({
  ...config.db,
  waitForConnections: true,
  connectionLimit: process.env.VERCEL ? 1 : 10,
  namedPlaceholders: true,
  ...(config.db.ssl ? { ssl: { rejectUnauthorized: true } } : {})
});

export async function databaseIsHealthy() {
  await pool.query('SELECT 1');
  return true;
}

export async function ensureSchemaCompatibility() {
  // Idempotent migration path for a `users` table created from an older
  // schema.sql. Safe to run repeatedly: each ADD COLUMN is a no-op once the
  // column exists.
  await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS external_id VARCHAR(120) NULL UNIQUE');
  await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(255) NULL');
  await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS role_title VARCHAR(120) NULL');
  await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar VARCHAR(500) NULL');
  await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS skills TEXT NULL');
  await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS source VARCHAR(40) NOT NULL DEFAULT 'local'");
  await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS synced_at TIMESTAMP NULL');
}