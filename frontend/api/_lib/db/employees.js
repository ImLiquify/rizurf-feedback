import { pool } from './pool.js';

function mapRow(row) {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    photoUrl: row.photo_url ?? null,
    title: row.title ?? null,
    department: row.department ?? null,
    left: row.left_at != null,
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
  SELECT e.id, e.email, e.name, e.role, e.photo_url, e.title, e.department, e.left_at,
         AVG(r.rating) AS avg_rating, COUNT(r.id) AS review_count
  FROM employees e
  LEFT JOIN reviews r ON r.receiver_id = e.id
`;

export async function findEmployeeById(id) {
  const [rows] = await pool.query('SELECT id, email, name, role, photo_url, title, department FROM employees WHERE id = ?', [id]);
  return rows[0] ? { id: rows[0].id, email: rows[0].email, name: rows[0].name, role: rows[0].role, photoUrl: rows[0].photo_url ?? null, title: rows[0].title ?? null, department: rows[0].department ?? null } : null;
}

export async function searchEmployees(query) {
  const q = query.trim();
  if (!q) {
    const [rows] = await pool.query(`${SELECT_WITH_RATING} GROUP BY e.id, e.email, e.name, e.role, e.photo_url, e.title, e.department, e.left_at ORDER BY e.name`);
    return rows.map(mapRow);
  }
  const like = `%${q}%`;
  const [rows] = await pool.query(
    `${SELECT_WITH_RATING} WHERE e.name LIKE ? OR e.email LIKE ? OR e.department LIKE ? GROUP BY e.id, e.email, e.name, e.role, e.photo_url, e.title, e.department, e.left_at ORDER BY e.name`,
    [like, like, like],
  );
  return rows.map(mapRow);
}

// Synced from the gateway identity token on every successful sign-in
// (MICROAPP_AUTH.md §4 step 6). Matched on id OR email: someone added from
// the intern roster keeps their existing row (and any reviews on it) when
// they first sign in. Returns the employee id this app uses for them.
export async function upsertEmployeeFromGateway({ id, email, name, role }) {
  await pool.query(
    `INSERT INTO employees (id, email, name, role) VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE email = VALUES(email), name = VALUES(name), role = VALUES(role)`,
    [id, email, name, role],
  );
  const [rows] = await pool.query('SELECT id FROM employees WHERE email = ?', [email]);
  return rows[0]?.id ?? id;
}

// Roster rows from the Intern API: [id, email, name, photo_url, title,
// department]. An existing email keeps its row and access role; the rest refresh.
// Anyone no longer on the roster is marked as left: hidden from the directory
// and wall (names still resolve on old reviews), but kept rather than deleted,
// since deleting would cascade away every review they wrote or received.
export async function upsertRosterEmployees(rows) {
  if (!rows.length) return; // an empty roster means a broken fetch, not everyone leaving
  await pool.query('INSERT INTO employees (id, email, name, photo_url, title, department) VALUES ? ON DUPLICATE KEY UPDATE name = VALUES(name), photo_url = VALUES(photo_url), title = VALUES(title), department = VALUES(department), left_at = NULL', [rows]);
  await pool.query('UPDATE employees SET left_at = NOW() WHERE left_at IS NULL AND email NOT IN (?)', [rows.map((r) => r[1])]);
}
