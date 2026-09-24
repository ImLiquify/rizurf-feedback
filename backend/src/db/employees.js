import { pool } from './pool.js';

function mapRow(row) {
  return { id: row.id, email: row.email, name: row.name, role: row.role };
}

export async function findEmployeeById(id) {
  const [rows] = await pool.query('SELECT id, email, name, role FROM employees WHERE id = ?', [id]);
  return rows[0] ? mapRow(rows[0]) : null;
}

export async function searchEmployees(query) {
  const q = query.trim();
  if (!q) {
    const [rows] = await pool.query('SELECT id, email, name, role FROM employees ORDER BY name');
    return rows.map(mapRow);
  }
  const like = `%${q}%`;
  const [rows] = await pool.query(
    'SELECT id, email, name, role FROM employees WHERE name LIKE ? OR email LIKE ? ORDER BY name',
    [like, like],
  );
  return rows.map(mapRow);
}
