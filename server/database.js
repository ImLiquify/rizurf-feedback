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
  // schema.sql. `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` is MariaDB / MySQL
  // 8.0.29+ only — the VPS runs MySQL 5.7 — so check information_schema and
  // add just the missing columns.
  const wanted = [
    ['external_id', 'VARCHAR(120) NULL UNIQUE'],
    ['email', 'VARCHAR(255) NULL'],
    ['role_title', 'VARCHAR(120) NULL'],
    ['avatar', 'VARCHAR(500) NULL'],
    ['skills', 'TEXT NULL'],
    ['source', "VARCHAR(40) NOT NULL DEFAULT 'local'"],
    ['synced_at', 'TIMESTAMP NULL']
  ];
  const [rows] = await pool.query(
    'SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?',
    ['users']
  );
  const existing = new Set(rows.map(row => row.COLUMN_NAME));
  for (const [column, definition] of wanted) {
    if (!existing.has(column)) await pool.query(`ALTER TABLE users ADD COLUMN ${column} ${definition}`);
  }
}