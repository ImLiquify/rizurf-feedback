import { randomUUID } from 'node:crypto';
import { pool } from './pool.js';

function mapRow(row) {
  return {
    id: row.id,
    authorId: row.author_id,
    receiverId: row.receiver_id,
    rating: row.rating,
    body: row.body,
    visibility: row.visibility,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function findReviewById(id) {
  const [rows] = await pool.query('SELECT * FROM reviews WHERE id = ?', [id]);
  return rows[0] ? mapRow(rows[0]) : null;
}

export async function findReviewsByReceiver(receiverId) {
  const [rows] = await pool.query('SELECT * FROM reviews WHERE receiver_id = ? ORDER BY created_at DESC', [receiverId]);
  return rows.map(mapRow);
}

export async function insertReview({ authorId, receiverId, rating, body, visibility }) {
  const id = randomUUID();
  await pool.query(
    'INSERT INTO reviews (id, author_id, receiver_id, rating, body, visibility) VALUES (?, ?, ?, ?, ?, ?)',
    [id, authorId, receiverId, rating, body, visibility],
  );
  return findReviewById(id);
}

export async function updateReview(id, { rating, body, visibility }) {
  await pool.query(
    'UPDATE reviews SET rating = COALESCE(?, rating), body = COALESCE(?, body), visibility = COALESCE(?, visibility) WHERE id = ?',
    [rating ?? null, body ?? null, visibility ?? null, id],
  );
  return findReviewById(id);
}

export async function deleteReview(id) {
  await pool.query('DELETE FROM reviews WHERE id = ?', [id]);
}
