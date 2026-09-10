import { pool } from './database.js';

// SS-13: this table is a local, read-only-by-sync cache of identity data
// pulled from the main directory service's API (see internApi.js). It is
// never written to directly by end users — only upsertInternUsers() writes
// to it, and only from data the intern-database service's API returned.
export async function upsertInternUsers(interns) {
  for (const intern of interns) {
    const localId = `intern_${intern.externalId}`.slice(0, 50);
    await pool.execute(
      `INSERT INTO users (id, external_id, name, email, role_title, department, avatar, skills, source, synced_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'intern-api', CURRENT_TIMESTAMP)
       ON DUPLICATE KEY UPDATE
         name = VALUES(name), email = VALUES(email), role_title = VALUES(role_title),
         department = VALUES(department), avatar = VALUES(avatar), skills = VALUES(skills),
         source = 'intern-api', synced_at = CURRENT_TIMESTAMP`,
      [localId, intern.externalId, intern.name, intern.email, intern.role, intern.department, intern.avatar, JSON.stringify(intern.skills)]
    );
  }
}

// A person who signs in through the gateway (MICROAPP_AUTH.md sections 4 and
// 11) is provisioned here as a local account, so their feedback, comments,
// and private remarks have a stable owner row to reference. The row id is
// derived from the gateway `sub` so re-logins update the same record.
// `role_title` carries the gateway role (admin / hr / supervisor / user).
// `department` is not part of the identity token, so it is left as-is on
// update — an intern sync or an admin may have set it.
export async function upsertGatewayUser({ sub, email, name, role }) {
  if (!sub) throw new Error('Gateway identity is missing sub.');
  const localId = `gw_${sub}`.slice(0, 50);
  await pool.execute(
    `INSERT INTO users (id, external_id, name, email, role_title, source, synced_at)
     VALUES (?, ?, ?, ?, ?, 'gateway', CURRENT_TIMESTAMP)
     ON DUPLICATE KEY UPDATE
       name = VALUES(name), email = VALUES(email), role_title = VALUES(role_title),
       source = 'gateway', synced_at = CURRENT_TIMESTAMP`,
    [localId, String(sub), name || email || `User ${sub}`, email || null, role || null]
  );
  return localId;
}

export async function getUserById(id) {
  const [rows] = await pool.execute(
    `SELECT id, external_id AS externalId, name, email, role_title AS role, department, avatar, skills, source
     FROM users WHERE id = ? LIMIT 1`,
    [id]
  );
  if (!rows[0]) return null;
  return { ...rows[0], skills: rows[0].skills ? JSON.parse(rows[0].skills) : [] };
}

export async function listEmployees({ limit, offset }) {
  const [rows] = await pool.execute(
    'SELECT id, name, role_title AS role, department, avatar, skills FROM users ORDER BY name LIMIT ? OFFSET ?',
    [limit, offset]
  );
  return rows;
}

export async function listSyncedInterns({ limit, offset }) {
  const [rows] = await pool.execute(
    `SELECT id, external_id AS externalId, name, email, role_title AS role, department, avatar, skills, synced_at AS syncedAt
     FROM users WHERE source = 'intern-api' ORDER BY name LIMIT ? OFFSET ?`,
    [limit, offset]
  );
  return rows;
}

export async function listFeedback({ targetId, senderId, limit, offset }) {
  const conditions = [];
  const parameters = [];
  if (targetId) { conditions.push('f.target_id = ?'); parameters.push(targetId); }
  if (senderId) { conditions.push('f.sender_id = ?'); parameters.push(senderId); }
  parameters.push(limit, offset);
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const [rows] = await pool.execute(
    `SELECT f.id, f.sender_id AS senderId, u.name AS senderName, u.avatar AS senderAvatar, f.target_id AS targetId,
       CASE WHEN f.target_id = 'company' THEN f.target_name ELSE target_user.name END AS targetName,
       f.content, f.is_anonymous AS isAnonymous, f.is_edited AS isEdited, f.created_at AS timestamp
     FROM feedback f
     JOIN users u ON u.id = f.sender_id
     LEFT JOIN users target_user ON target_user.id = f.target_id
     ${where}
     ORDER BY f.created_at DESC LIMIT ? OFFSET ?`,
    parameters
  );
  return rows;
}

export async function createFeedback({ id, senderId, targetId, targetName, content, isAnonymous }) {
  await pool.execute(
    'INSERT INTO feedback (id, sender_id, target_id, target_name, content, is_anonymous) VALUES (?, ?, ?, ?, ?, ?)',
    [id, senderId, targetId, targetName, content, isAnonymous]
  );
  const [rows] = await pool.execute('SELECT * FROM feedback WHERE id = ?', [id]);
  return rows[0];
}

export async function feedbackExists(id) {
  const [rows] = await pool.execute('SELECT 1 FROM feedback WHERE id = ? LIMIT 1', [id]);
  return rows.length > 0;
}

export async function listComments({ feedbackId, limit, offset }) {
  const [rows] = await pool.execute(
    `SELECT c.id, c.parent_id AS parentId, c.sender_id AS senderId, u.name AS senderName, u.avatar AS senderAvatar,
       c.content AS text, c.is_anonymous AS isAnonymous, c.is_edited AS isEdited, c.created_at AS timestamp
     FROM comments c
     JOIN users u ON u.id = c.sender_id
     WHERE c.feedback_id = ?
     ORDER BY c.created_at ASC LIMIT ? OFFSET ?`,
    [feedbackId, limit, offset]
  );
  return rows;
}

export async function createComment({ id, feedbackId, parentId, senderId, text, isAnonymous }) {
  await pool.execute(
    'INSERT INTO comments (id, feedback_id, parent_id, sender_id, content, is_anonymous) VALUES (?, ?, ?, ?, ?, ?)',
    [id, feedbackId, parentId, senderId, text, isAnonymous]
  );
  return { id, feedbackId, parentId, senderId, text };
}

export async function listPrivateRemarks({ authorId, limit, offset }) {
  const [rows] = await pool.execute(
    `SELECT id, author_id AS authorId, target_id AS targetId, content, created_at AS createdAt
     FROM private_remarks WHERE author_id = ? ORDER BY created_at ASC LIMIT ? OFFSET ?`,
    [authorId, limit, offset]
  );
  return rows;
}

export async function createPrivateRemark({ id, authorId, targetId, content }) {
  await pool.execute(
    'INSERT INTO private_remarks (id, author_id, target_id, content) VALUES (?, ?, ?, ?)',
    [id, authorId, targetId, content]
  );
  const [rows] = await pool.execute(
    `SELECT id, author_id AS authorId, target_id AS targetId, content, created_at AS createdAt FROM private_remarks WHERE id = ?`,
    [id]
  );
  return rows[0];
}

export async function deletePrivateRemark({ id, authorId }) {
  const [result] = await pool.execute('DELETE FROM private_remarks WHERE id = ? AND author_id = ?', [id, authorId]);
  return result.affectedRows > 0;
}