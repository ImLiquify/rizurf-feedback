import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { fetchInterns } from './internApi.js';

const app = express();
const port = Number(process.env.PORT || 3001);
const projectRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const serviceId = process.env.SERVICE_ID || 'pulsefeedback';
const version = '1.0.0';
let jwksCache = null;

function base64UrlDecode(value) {
  return Buffer.from(value, 'base64url');
}

async function verifyAccessToken(token) {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Malformed token');
  const [headerB64, payloadB64, signatureB64] = parts;
  const header = JSON.parse(base64UrlDecode(headerB64).toString('utf8'));
  if (header.alg !== 'RS256') throw new Error('Unexpected token algorithm');

  if (!jwksCache) {
    const gatewayUrl = (process.env.GATEWAY_URL || 'http://127.0.0.1:4301').replace(/\/+$/, '');
    const response = await fetch(`${gatewayUrl}/.well-known/jwks.json`);
    if (!response.ok) throw new Error('Gateway signing keys are unavailable');
    jwksCache = await response.json();
  }

  const jwk = jwksCache.keys.find(key => key.kid === header.kid);
  if (!jwk) throw new Error('Unknown gateway signing key');
  const publicKey = crypto.createPublicKey({ key: jwk, format: 'jwk' });
  const valid = crypto.verify(
    'RSA-SHA256',
    Buffer.from(`${headerB64}.${payloadB64}`),
    publicKey,
    base64UrlDecode(signatureB64)
  );
  if (!valid) throw new Error('Token signature is invalid');

  const claims = JSON.parse(base64UrlDecode(payloadB64).toString('utf8'));
  const gatewayUrl = (process.env.GATEWAY_URL || 'http://127.0.0.1:4301').replace(/\/+$/, '');
  if (claims.token_use !== 'access' || claims.iss !== gatewayUrl
    || claims.aud !== serviceId || typeof claims.exp !== 'number' || claims.exp * 1000 < Date.now()) {
    throw new Error('Token claims are invalid');
  }
  return claims;
}

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  database: process.env.DB_NAME || 'pulsefeedback',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  waitForConnections: true,
  connectionLimit: 10,
  namedPlaceholders: true
});

const allowedOrigins = new Set([
  'http://localhost',
  'http://127.0.0.1',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  process.env.CLIENT_ORIGIN
].filter(Boolean));

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.has(origin)) return callback(null, true);
    return callback(new Error('Origin is not allowed'));
  }
}));
app.use(express.json());

app.use((request, response, next) => {
  const correlationId = typeof request.headers['x-correlation-id'] === 'string'
    && request.headers['x-correlation-id'].trim()
    ? request.headers['x-correlation-id'].trim()
    : crypto.randomUUID();
  request.correlationId = correlationId;
  response.setHeader('X-Correlation-ID', correlationId);
  next();
});

app.use(async (request, response, next) => {
  const isPublic = request.path === '/' || request.path === '/health'
    || request.path === '/openapi.json' || request.path === '/api/health';
  if (isPublic) return next();

  const match = /^Bearer\s+(\S+)$/i.exec(request.headers.authorization || '');
  if (!match) return sendError(response, request, 401, 'UNAUTHORIZED', 'A bearer token is required.');
  try {
    request.auth = await verifyAccessToken(match[1]);
    return next();
  } catch (error) {
    return sendError(response, request, 401, 'UNAUTHORIZED', error.message);
  }
});

const openapi = {
  openapi: '3.0.3',
  info: {
    title: 'PulseFeedback API',
    version,
    description: 'Manage local employee feedback, comments, reactions, and synchronized intern profiles.',
    'x-rizurf': {
      domain: 'Human Resources',
      owner: 'pulsefeedback-team',
      app_url: '/',
      category: 'Customer Management',
      industries: ['Human Resources', 'Main Database'],
      use_cases: ['Browse intern profiles', 'Collect employee feedback', 'Review workplace suggestions'],
      capabilities: [
        {
          name: 'Browse Interns',
          icon: '👥',
          description: 'Synchronize intern profile data from the main intern service for local display.',
          does: ['List synchronized intern profiles'],
          best_for: 'Feedback applications that need current intern profile information.',
          endpoints: ['GET /api/interns']
        },
        {
          name: 'Manage Feedback',
          icon: '💬',
          description: 'Store feedback and threaded comments in the local PulseFeedback database.',
          does: ['Read feedback', 'Create feedback', 'Read comments', 'Create comments'],
          best_for: 'Teams collecting recognition and workplace improvement ideas.',
          endpoints: ['GET /api/feedback', 'POST /api/feedback', 'GET /api/feedback/{feedbackId}/comments']
        }
      ],
      workflows: [{
        name: 'Refresh intern profiles',
        steps: ['GET /api/interns', 'GET /api/employees']
      }],
      related_services: []
    }
  },
  paths: {
    '/health': { get: { summary: 'Check service health' } },
    '/openapi.json': { get: { summary: 'Read the API document' } },
    '/api/interns': {
      get: {
        summary: 'Synchronize and list intern profiles',
        security: [{ bearerAuth: ['intern:read'] }],
        'x-rizurf': {
          name: 'List Interns',
          purpose: 'Refresh intern profiles for PulseFeedback.',
          use_when: ['Displaying the Employee Wall', 'Refreshing local intern profiles'],
          do_not_use_when: ['Reading feedback or comments'],
          inputs: ['limit', 'offset'],
          outputs: ['data', 'synced'],
          requires: ['A valid Rizurf access token', 'intern:read scope'],
          related_endpoints: ['GET /api/employees'],
          tags: ['interns', 'employees', 'profiles', 'directory']
        }
      }
    },
    '/api/employees': {
      get: {
        summary: 'List local feedback participants',
        security: [{ bearerAuth: ['intern:read'] }],
        'x-rizurf': {
          name: 'List Participants',
          purpose: 'Read local users linked to feedback records.',
          use_when: ['Rendering the Employee Wall'],
          do_not_use_when: ['Refreshing the source intern service directly'],
          inputs: [],
          outputs: ['id', 'name', 'role', 'department', 'avatar', 'skills'],
          requires: ['A valid Rizurf access token', 'intern:read scope'],
          related_endpoints: ['GET /api/interns'],
          tags: ['employees', 'participants', 'directory', 'users']
        }
      }
    },
    '/api/feedback': {
      get: { summary: 'List feedback', security: [{ bearerAuth: ['feedback:read'] }] },
      post: { summary: 'Create feedback', security: [{ bearerAuth: ['feedback:write'] }] }
    },
    '/api/feedback/{feedbackId}/comments': {
      get: { summary: 'List feedback comments', security: [{ bearerAuth: ['feedback:read'] }] },
      post: { summary: 'Create a feedback comment', security: [{ bearerAuth: ['feedback:write'] }] }
    }
  },
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }
    }
  }
};

function sendError(response, request, status, code, message, details = null) {
  response.status(status).json({
    error: { code, message, correlation_id: request.correlationId, details }
  });
}

async function ensureUserMappingColumns() {
  await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS external_id VARCHAR(120) NULL UNIQUE');
  await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(255) NULL');
  await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS source VARCHAR(40) NOT NULL DEFAULT 'local'");
  await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS synced_at TIMESTAMP NULL');
}

async function syncInternUsers(correlationId) {
  const interns = await fetchInterns({ correlationId });
  for (const intern of interns) {
    const localId = `intern_${intern.externalId}`.slice(0, 50);
    await pool.execute(`
      INSERT INTO users (id, external_id, name, email, role_title, department, avatar, skills, source, synced_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'intern-api', CURRENT_TIMESTAMP)
      ON DUPLICATE KEY UPDATE
        name = VALUES(name), email = VALUES(email), role_title = VALUES(role_title),
        department = VALUES(department), avatar = VALUES(avatar), skills = VALUES(skills),
        source = 'intern-api', synced_at = CURRENT_TIMESTAMP
    `, [localId, intern.externalId, intern.name, intern.email, intern.role,
      intern.department, intern.avatar, JSON.stringify(intern.skills)]);
  }
  return interns.length;
}

app.get('/', (_request, response) => {
  response.sendFile(path.join(projectRoot, 'index.html'));
});

app.get('/health', async (_request, response) => {
  try {
    await pool.query('SELECT 1');
    response.json({ status: 'ok', service: serviceId, version, checks: { database: true } });
  } catch {
    response.status(503).json({ status: 'degraded', service: serviceId, version, checks: { database: false } });
  }
});

app.get('/openapi.json', (_request, response) => response.json(openapi));

app.get('/api/health', async (_request, response) => {
  try {
    await pool.query('SELECT 1');
    response.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    response.status(503).json({ status: 'error', database: 'unavailable' });
  }
});

app.get('/api/employees', async (request, response, next) => {
  try {
    try {
      await syncInternUsers(request.correlationId);
    } catch (error) {
      console.warn('Intern profile sync unavailable; using local users:', error.message);
    }
    const [rows] = await pool.query(
      'SELECT id, name, role_title AS role, department, avatar, skills FROM users ORDER BY name'
    );
    response.json(rows);
  } catch (error) {
    next(error);
  }
});

app.get('/api/private-remarks', async (request, response, next) => {
  const { authorId } = request.query;
  if (!authorId) return response.status(400).json({ error: 'authorId is required' });

  try {
    const [rows] = await pool.query(`
      SELECT id, author_id AS authorId, target_id AS targetId, content, created_at AS createdAt
      FROM private_remarks
      WHERE author_id = ?
      ORDER BY created_at ASC
    `, [authorId]);
    response.json(rows);
  } catch (error) {
    next(error);
  }
});

app.post('/api/private-remarks', async (request, response, next) => {
  const { authorId, targetId, content } = request.body;
  if (!authorId || !targetId || !content?.trim()) {
    return response.status(400).json({ error: 'authorId, targetId, and content are required' });
  }

  try {
    const id = `remark_${crypto.randomUUID()}`;
    await pool.execute(`
      INSERT INTO private_remarks (id, author_id, target_id, content)
      VALUES (?, ?, ?, ?)
    `, [id, authorId, targetId, content.trim()]);
    const [rows] = await pool.query(`
      SELECT id, author_id AS authorId, target_id AS targetId, content, created_at AS createdAt
      FROM private_remarks
      WHERE id = ?
    `, [id]);
    response.status(201).json(rows[0]);
  } catch (error) {
    next(error);
  }
});

app.delete('/api/private-remarks/:remarkId', async (request, response, next) => {
  const { authorId } = request.query;
  if (!authorId) return response.status(400).json({ error: 'authorId is required' });

  try {
    const [result] = await pool.execute(
      'DELETE FROM private_remarks WHERE id = ? AND author_id = ?',
      [request.params.remarkId, authorId]
    );
    if (!result.affectedRows) return response.status(404).json({ error: 'Remark not found' });
    response.status(204).end();
  } catch (error) {
    next(error);
  }
});

app.get('/api/feedback', async (request, response, next) => {
  try {
    const conditions = [];
    const parameters = {};
    if (request.query.targetId) {
      conditions.push('f.target_id = :targetId');
      parameters.targetId = request.query.targetId;
    }
    if (request.query.senderId) {
      conditions.push('f.sender_id = :senderId');
      parameters.senderId = request.query.senderId;
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const [rows] = await pool.query(`
            SELECT f.id, f.sender_id AS senderId, u.name AS senderName, u.avatar AS senderAvatar,
              f.target_id AS targetId,
              CASE WHEN f.target_id = 'company' THEN f.target_name ELSE target_user.name END AS targetName,
              f.content,
             f.is_anonymous AS isAnonymous, f.is_edited AS isEdited, f.created_at AS timestamp
      FROM feedback f
      JOIN users u ON u.id = f.sender_id
            LEFT JOIN users target_user ON target_user.id = f.target_id
      ${where}
      ORDER BY f.created_at DESC
    `, parameters);

    response.json(rows);
  } catch (error) {
    next(error);
  }
});

app.post('/api/feedback', async (request, response, next) => {
  const { senderId = 'u_alex', targetId, targetName, content, isAnonymous = false } = request.body;
  if (!targetId || !targetName || !content?.trim()) {
    return response.status(400).json({ error: 'targetId, targetName, and content are required' });
  }

  try {
    const id = `fb_${crypto.randomUUID()}`;
    await pool.execute(`
      INSERT INTO feedback (id, sender_id, target_id, target_name, content, is_anonymous)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [id, senderId, targetId, targetName, content.trim(), Boolean(isAnonymous)]);
    const [rows] = await pool.query('SELECT * FROM feedback WHERE id = ?', [id]);
    response.status(201).json(rows[0]);
  } catch (error) {
    next(error);
  }
});

app.get('/api/feedback/:feedbackId/comments', async (request, response, next) => {
  try {
    const [rows] = await pool.query(`
      SELECT c.id, c.parent_id AS parentId, c.sender_id AS senderId, u.name AS senderName,
             u.avatar AS senderAvatar, c.content AS text, c.is_anonymous AS isAnonymous,
             c.is_edited AS isEdited, c.created_at AS timestamp
      FROM comments c
      JOIN users u ON u.id = c.sender_id
      WHERE c.feedback_id = ?
      ORDER BY c.created_at ASC
    `, [request.params.feedbackId]);
    response.json(rows);
  } catch (error) {
    next(error);
  }
});

app.post('/api/feedback/:feedbackId/comments', async (request, response, next) => {
  const { senderId = 'u_alex', parentId = null, text, isAnonymous = false } = request.body;
  if (!text?.trim()) return response.status(400).json({ error: 'text is required' });

  try {
    const id = `cm_${crypto.randomUUID()}`;
    await pool.execute(`
      INSERT INTO comments (id, feedback_id, parent_id, sender_id, content, is_anonymous)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [id, request.params.feedbackId, parentId, senderId, text.trim(), Boolean(isAnonymous)]);
    response.status(201).json({ id, feedbackId: request.params.feedbackId, parentId, senderId, text: text.trim() });
  } catch (error) {
    next(error);
  }
});

app.get('/api/interns', async (request, response, next) => {
  try {
    const count = await syncInternUsers(request.correlationId);
    const [rows] = await pool.query(`
      SELECT id, external_id AS externalId, name, email, role_title AS role,
             department, avatar, skills, synced_at AS syncedAt
      FROM users
      WHERE source = 'intern-api'
      ORDER BY name
    `);
    response.json({ data: rows, synced: count });
  } catch (error) {
    next(error);
  }
});

app.use((request, response) => {
  sendError(response, request, 404, 'RESOURCE_NOT_FOUND', `No route for ${request.path}.`);
});

app.use((error, _request, response, _next) => {
  console.error(error);
  sendError(response, _request, 502, 'INTERNAL_ERROR', 'An upstream or internal service error occurred.');
});

ensureUserMappingColumns()
  .then(() => {
    app.listen(port, () => {
      console.log(`PulseFeedback API listening on http://localhost:${port}`);
    });
  })
  .catch(error => {
    console.error('PulseFeedback database migration failed:', error.message);
    process.exitCode = 1;
  });
