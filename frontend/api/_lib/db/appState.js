import { pool } from './pool.js';

// Returns true (and records now) only if the roster hasn't been synced in the
// last `maxAgeS` seconds — both sides in MySQL's clock, never Node's. The
// conditional UPDATE makes the claim atomic across instances.
export async function claimRosterSync(maxAgeS) {
  await pool.query("INSERT IGNORE INTO app_state (name, updated_at) VALUES ('intern_roster', '1970-01-02')");
  const [result] = await pool.query(
    "UPDATE app_state SET updated_at = NOW() WHERE name = 'intern_roster' AND updated_at < NOW() - INTERVAL ? SECOND",
    [maxAgeS],
  );
  return result.affectedRows === 1;
}

export async function releaseRosterSync() {
  await pool.query("UPDATE app_state SET updated_at = '1970-01-02' WHERE name = 'intern_roster'");
}
