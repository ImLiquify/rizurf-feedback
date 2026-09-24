import { randomUUID } from 'node:crypto';
import { pool } from './pool.js';

function mapRow(row) {
  return {
    id: row.id,
    reviewId: row.review_id,
    authorId: row.author_id,
    body: row.body,
    createdAt: row.created_at,
  };
}

export async function findReplyForReview(reviewId) {
  const [rows] = await pool.query('SELECT * FROM review_replies WHERE review_id = ?', [reviewId]);
  return rows[0] ? mapRow(rows[0]) : null;
}

export async function findRepliesForReviews(reviewIds) {
  if (reviewIds.length === 0) return [];
  const [rows] = await pool.query('SELECT * FROM review_replies WHERE review_id IN (?)', [reviewIds]);
  return rows.map(mapRow);
}

export async function insertReply({ reviewId, authorId, body }) {
  const id = randomUUID();
  await pool.query('INSERT INTO review_replies (id, review_id, author_id, body) VALUES (?, ?, ?, ?)', [
    id,
    reviewId,
    authorId,
    body,
  ]);
  return findReplyForReview(reviewId);
}
