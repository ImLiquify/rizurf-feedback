import { randomUUID } from 'node:crypto';
import { pool } from './pool.js';

function mapFlagRow(row) {
  return {
    id: row.id,
    reviewId: row.review_id,
    flaggedBy: row.flagged_by,
    reason: row.reason,
    status: row.status,
    createdAt: row.created_at,
  };
}

export async function findFlagById(id) {
  const [rows] = await pool.query('SELECT * FROM review_flags WHERE id = ?', [id]);
  return rows[0] ? mapFlagRow(rows[0]) : null;
}

export async function insertFlag({ reviewId, flaggedBy, reason }) {
  const id = randomUUID();
  await pool.query('INSERT INTO review_flags (id, review_id, flagged_by, reason) VALUES (?, ?, ?, ?)', [
    id,
    reviewId,
    flaggedBy,
    reason,
  ]);
  return findFlagById(id);
}

export async function listOpenFlagsWithReview() {
  const [rows] = await pool.query(
    `SELECT f.id AS flag_id, f.review_id, f.flagged_by, f.reason, f.status, f.created_at AS flag_created_at,
            r.author_id, r.receiver_id, r.rating, r.body, r.visibility,
            r.created_at AS review_created_at, r.updated_at AS review_updated_at
     FROM review_flags f
     JOIN reviews r ON r.id = f.review_id
     WHERE f.status = 'open'
     ORDER BY f.created_at DESC`,
  );
  return rows.map((row) => ({
    flag: {
      id: row.flag_id,
      reviewId: row.review_id,
      flaggedBy: row.flagged_by,
      reason: row.reason,
      status: row.status,
      createdAt: row.flag_created_at,
    },
    review: {
      id: row.review_id,
      authorId: row.author_id,
      receiverId: row.receiver_id,
      rating: row.rating,
      body: row.body,
      visibility: row.visibility,
      createdAt: row.review_created_at,
      updatedAt: row.review_updated_at,
    },
  }));
}

export async function resolveFlag(id) {
  await pool.query("UPDATE review_flags SET status = 'resolved' WHERE id = ?", [id]);
}
