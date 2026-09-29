// Fills `employees` from the Intern API (MICROAPP_AUTH.md §10/§11), so
// people are searchable before they've ever signed in here. Server-to-server:
// our own client_credentials token, never the signed-in user's.
import { config } from './config.js';
import { upsertRosterEmployees } from './db/employees.js';
import { claimRosterSync, releaseRosterSync } from './db/appState.js';

const SYNC_EVERY_S = 10 * 60;
const RECHECK_MS = 60 * 1000; // how often a warm instance asks the DB whether a sync is due
const PAGE = 200; // the Intern API's max page size
let lastCheck = 0;
let inFlight = null;

// Former interns are left out; everyone else with an email is listed. Their
// Intern API role name becomes a display title only: access (admin/hr) is
// never taken from here, only from the gateway at sign-in.
export function internsToEmployeeRows(interns, roleNames = new Map(), departmentNames = new Map()) {
  return interns
    .filter((i) => i.email_address && i.status !== 'Former')
    .map((i) => [
      i.id,
      i.email_address,
      `${i.first_name ?? ''} ${i.last_name ?? ''}`.trim() || i.email_address,
      i.photo_url ?? null,
      roleNames.get(i.role_id) ?? null,
      departmentNames.get(i.department_id) ?? null,
    ]);
}

async function getJson(url, token) {
  const res = await fetch(url, {
    headers: { authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) throw new Error(`${url} failed (HTTP ${res.status}): ${await res.text()}`);
  return res.json();
}

// One token per target service (the gateway scopes each to its audience).
async function getAccessToken(audience) {
  const res = await fetch(`${config.gatewayUrl}/oauth/token`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'client_credentials',
      client_id: config.clientId,
      client_secret: config.clientSecret,
      audience,
    }),
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) throw new Error(`${audience} token request failed (HTTP ${res.status}): ${await res.text()}`);
  return (await res.json()).access_token;
}

// At most one sync per 10 min across ALL instances: freshness lives in the
// database (its own clock, survives cold starts). A warm instance only asks
// once a minute, and concurrent requests share one in-flight sync.
export function syncInternRoster() {
  if (!config.clientSecret) return Promise.resolve();
  if (inFlight) return inFlight;
  if (Date.now() - lastCheck < RECHECK_MS) return Promise.resolve();
  lastCheck = Date.now();
  inFlight = runSync().finally(() => {
    inFlight = null;
  });
  return inFlight;
}

async function runSync() {
  // Claim first so parallel instances don't all sync; release on failure so a
  // fixed credential is picked up within a minute, not ten.
  if (!(await claimRosterSync(SYNC_EVERY_S))) return;
  try {
    await fetchAndStoreRoster();
  } catch (err) {
    await releaseRosterSync();
    throw err;
  }
}

// The department service's list may come bare or wrapped; take either.
const listOf = (body) => (Array.isArray(body) ? body : body?.data ?? body?.departments ?? []);

// Names are nice-to-haves: if roles or departments fail (e.g. the API client
// has no department-api grant yet), log it and still store the roster.
function optional(label, promise) {
  return promise.catch((err) => {
    console.warn(`Roster sync: skipped ${label}: ${err.message}`);
    return [];
  });
}

async function fetchAndStoreRoster() {
  const token = await getAccessToken('intern-database');
  const rolesPromise = optional('intern roles', getJson(`${config.internApiUrl}/api/roles`, token).then(listOf));
  const departmentsPromise = optional(
    'departments',
    getAccessToken('department-api').then((t) => getJson(`${config.departmentApiUrl}/api/departments`, t)).then(listOf),
  );

  const interns = [];
  for (let offset = 0; ; offset += PAGE) {
    const { data, pagination } = await getJson(`${config.internApiUrl}/api/interns?limit=${PAGE}&offset=${offset}`, token);
    interns.push(...data);
    if (!data.length || offset + PAGE >= pagination.total) break;
  }

  const [roles, departments] = await Promise.all([rolesPromise, departmentsPromise]);
  const roleNames = new Map(roles.map((role) => [role.id, role.name]));
  const departmentNames = new Map(departments.map((d) => [d.id, d.name]));
  await upsertRosterEmployees(internsToEmployeeRows(interns, roleNames, departmentNames));
}
