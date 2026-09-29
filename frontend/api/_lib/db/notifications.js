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

export async function markNotificationsRead(userId) {
  await pool.query('UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE', [userId]);
}

// For the gateway's app-icon badge (MICROAPP_BADGES.md): one set-based
// query, only people who have something unread, capped at the 5,000 the
// gateway accepts. Served by idx_notifications_user.
export async function unreadCountsByEmail() {
  const [rows] = await pool.query(
    `SELECT e.email, COUNT(*) AS count
     FROM notifications n JOIN employees e ON e.id = n.user_id
     WHERE n.is_read = FALSE
     GROUP BY e.email
     LIMIT 5000`,
  );
  return rows.map((r) => ({ email: r.email, count: Number(r.count) }));
}
