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

// Former interns are left out; everyone else with an email is listed.
export function internsToEmployeeRows(interns) {
  return interns
    .filter((i) => i.email_address && i.status !== 'Former')
    .map((i) => [
      i.id,
      i.email_address,
      `${i.first_name ?? ''} ${i.last_name ?? ''}`.trim() || i.email_address,
      i.photo_url ?? null,
    ]);
}

async function getAccessToken() {
  const res = await fetch(`${config.gatewayUrl}/oauth/token`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'client_credentials',
      client_id: config.clientId,
      client_secret: config.clientSecret,
      audience: 'intern-database',
    }),
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) throw new Error(`Intern API token request failed (HTTP ${res.status}): ${await res.text()}`);
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

async function fetchAndStoreRoster() {
  const token = await getAccessToken();
  const interns = [];
  for (let offset = 0; ; offset += PAGE) {
    const res = await fetch(`${config.internApiUrl}/api/interns?limit=${PAGE}&offset=${offset}`, {
      headers: { authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error(`Intern API list failed (HTTP ${res.status}): ${await res.text()}`);
    const { data, pagination } = await res.json();
    interns.push(...data);
    if (!data.length || offset + PAGE >= pagination.total) break;
  }

  await upsertRosterEmployees(internsToEmployeeRows(interns));
}
