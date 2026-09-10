import { config } from './config.js';

let cachedAccessToken = null;
let cachedAccessTokenExpiresAt = 0;

function requireInternClientConfig() {
  const values = {
    INTERN_API_BASE_URL: config.internApiBaseUrl,
    INTERN_API_AUDIENCE: config.internApiAudience,
    CLIENT_ID: config.clientId,
    CLIENT_SECRET: config.clientSecret
  };
  for (const [name, value] of Object.entries(values)) {
    if (!value) throw new Error(`Missing required environment variable: ${name}`);
  }
}

async function getInternAccessToken(correlationId) {
  if (cachedAccessToken && cachedAccessTokenExpiresAt > Date.now() + 30_000) {
    return cachedAccessToken;
  }

  requireInternClientConfig();

  const credentials = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64');
  const response = await fetch(`${config.gatewayUrl}/oauth/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/json',
      ...(correlationId ? { 'X-Correlation-ID': correlationId } : {})
    },
    body: JSON.stringify({
      grant_type: 'client_credentials',
      audience: config.internApiAudience,
      scope: 'intern:read'
    })
  });

  if (!response.ok) throw new Error(`Gateway token request failed with status ${response.status}`);
  const payload = await response.json();
  if (!payload.access_token) throw new Error('Gateway token response did not contain access_token');

  cachedAccessToken = payload.access_token;
  cachedAccessTokenExpiresAt = Date.now() + Number(payload.expires_in || 3600) * 1000;
  return cachedAccessToken;
}

function getInternName(intern) {
  return [intern.first_name, intern.last_name].filter(Boolean).join(' ').trim()
    || intern.name
    || intern.full_name
    || `Intern ${intern.id}`;
}

function getInternId(intern) {
  return intern.id ?? intern.intern_id ?? intern.ref_number;
}

function getInternsFromResponse(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.items)) return payload.data.items;
  if (Array.isArray(payload?.interns)) return payload.interns;
  return [];
}

export async function fetchInterns({ limit = 100, offset = 0, correlationId } = {}) {
  requireInternClientConfig();
  const url = new URL(`${config.internApiBaseUrl}/api/interns`);
  url.searchParams.set('limit', String(Math.min(Math.max(Number(limit) || 100, 1), 100)));
  url.searchParams.set('offset', String(Math.max(Number(offset) || 0, 0)));

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${await getInternAccessToken(correlationId)}`,
      Accept: 'application/json',
      ...(correlationId ? { 'X-Correlation-ID': correlationId } : {})
    }
  });

  if (!response.ok) {
    throw new Error(`Intern API request failed with status ${response.status}`);
  }

  const payload = await response.json();
  return getInternsFromResponse(payload).map(intern => ({
    externalId: String(getInternId(intern)),
    id: String(getInternId(intern)),
    name: getInternName(intern),
    role: intern.position || intern.role || 'Intern',
    department: intern.department || 'Internship',
    email: intern.email_address || intern.email || null,
    avatar: intern.photo_url || intern.avatar || intern.profile_photo || null,
    skills: Array.isArray(intern.skills) ? intern.skills : []
  })).filter(intern => intern.externalId !== 'undefined');
}