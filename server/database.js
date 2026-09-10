import mysql from 'mysql2/promise';
import { config } from './config.js';

// No Express imports: workers and command-line tasks may reuse this DAL.
export const pool = mysql.createPool({ ...config.db, waitForConnections: true, connectionLimit: 10, namedPlaceholders: true });

export async function databaseIsHealthy() {
  await pool.query('SELECT 1');
  return true;
}

export async function ensureSchemaCompatibility() {
  await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS external_id VARCHAR(120) NULL UNIQUE');
  await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(255) NULL');
  await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS source VARCHAR(40) NOT NULL DEFAULT 'local'");
  await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS synced_at TIMESTAMP NULL');
  await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS picture VARCHAR(500) NULL');
}
