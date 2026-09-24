import { pool } from './pool.js';

function mapRow(row) {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    avgRating: row.avg_rating !== null ? Number(row.avg_rating) : null,
    reviewCount: Number(row.review_count),
  };
}

// The rating average is computed across every review for that employee,
// public and anonymous alike — a rating number carries no identity, so
// including anonymous reviews in the aggregate doesn't leak who wrote
// them (unlike the review body/author, which the visibility rule still
// gates on read).
const SELECT_WITH_RATING = `
  SELECT e.id, e.email, e.name, e.role,
         AVG(r.rating) AS avg_rating, COUNT(r.id) AS review_count
  FROM employees e
  LEFT JOIN reviews r ON r.receiver_id = e.id
`;

export async function findEmployeeById(id) {
  const [rows] = await pool.query('SELECT id, email, name, role FROM employees WHERE id = ?', [id]);
  return rows[0] ? { id: rows[0].id, email: rows[0].email, name: rows[0].name, role: rows[0].role } : null;
}

export async function searchEmployees(query) {
  const q = query.trim();
  if (!q) {
    const [rows] = await pool.query(`${SELECT_WITH_RATING} GROUP BY e.id, e.email, e.name, e.role ORDER BY e.name`);
    return rows.map(mapRow);
  }
  const like = `%${q}%`;
  const [rows] = await pool.query(
    `${SELECT_WITH_RATING} WHERE e.name LIKE ? OR e.email LIKE ? GROUP BY e.id, e.email, e.name, e.role ORDER BY e.name`,
    [like, like],
  );
  return rows.map(mapRow);
}
