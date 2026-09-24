import { randomUUID } from 'node:crypto';
import { pool } from './pool.js';

function mapRow(row) {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    message: row.message,
    read: Boolean(row.is_read),
    createdAt: row.created_at,
  };
}

export async function insertNotification({ userId, type, message }) {
  const id = randomUUID();
  await pool.query('INSERT INTO notifications (id, user_id, type, message) VALUES (?, ?, ?, ?)', [
    id,
    userId,
    type,
    message,
  ]);
}

export async function findNotificationsForUser(userId) {
  const [rows] = await pool.query('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC', [userId]);
  return rows.map(mapRow);
}
