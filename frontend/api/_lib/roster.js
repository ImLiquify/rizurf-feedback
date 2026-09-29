// Fills `employees` from the Intern API (MICROAPP_AUTH.md §10/§11), so
// people are searchable before they've ever signed in here. Server-to-server:
// our own client_credentials token, never the signed-in user's.
import { config } from './config.js';
import { upsertRosterEmployees } from './db/employees.js';

const SYNC_EVERY_MS = 10 * 60 * 1000;
const PAGE = 200; // the Intern API's max page size
let lastSync = 0;

// Former interns are left out; everyone else with an email is listed.
export function internsToEmployeeRows(interns) {
  return interns
    .filter((i) => i.email_address && i.status !== 'Former')
    .map((i) => [i.id, i.email_address, `${i.first_name ?? ''} ${i.last_name ?? ''}`.trim() || i.email_address]);
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

// ponytail: syncs at most every 10 min per warm server instance, on demand
// from search; move to a scheduled job if the roster grows into the thousands.
export async function syncInternRoster() {
  if (!config.clientSecret || Date.now() - lastSync < SYNC_EVERY_MS) return;
  lastSync = Date.now(); // set up front so a failing sync doesn't retry on every search

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
