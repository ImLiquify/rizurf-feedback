# Rizurf Feedback

Internal employee feedback tool — search a coworker, leave them a public or
anonymous rating + review. See [docs/superpowers/specs/2026-09-18-feedback-system-design.md](docs/superpowers/specs/2026-09-18-feedback-system-design.md)
for the full design, and [DESIGN.md](DESIGN.md) for the UI's visual system.

Signs in through the real Rizurf gateway (`MICROAPP_AUTH.md`) — there is no
local login of any kind. The frontend and API deploy together as **one
Vercel project** (`frontend/`), so the session cookie is a simple same-site
cookie rather than a cross-origin one.

## Local development

1. **Database** — start MySQL (XAMPP control panel, or
   `C:\xampp\mysql_start.bat`), then load the schema and local test data:

   ```bash
   C:\xampp\mysql\bin\mysql.exe -u root < database/schema.sql
   C:\xampp\mysql\bin\mysql.exe -u root < database/seed.sql
   ```

   `database/schema.sql` is the canonical schema — hand this to the DB Lead
   for the real company database. `database/seed.sql` is local test data
   only, never sent anywhere else.

2. **Environment** — in `frontend/`, copy `.env.example` to `.env` and fill
   in real values: `GATEWAY_URL` and `SERVICE_ID` for whatever this service
   is registered as with the gateway, a generated `SESSION_SECRET`
   (`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`),
   and the DB connection info from step 1. `PUBLIC_URL` stays
   `http://localhost:5173` for local dev — that's the origin the browser and
   the gateway both see, even though the API process itself listens on a
   different port.

3. **Run both halves** (two terminals, from `frontend/`):

   ```bash
   npm install
   npm run dev:api   # the Express API on :4000
   npm run dev       # Vite on :5173, proxies /api/* to :4000 (vite.config.ts)
   ```

   Open `http://localhost:5173`. An unauthenticated visit redirects to the
   gateway automatically; there's no login screen or user switcher to click
   through — sign in with a real gateway account.

   Run the API's tests (visibility rule, no external deps needed):

   ```bash
   npm run test:api
   ```

## Deploying

One Vercel project rooted at `frontend/` (Root Directory = `frontend` if
deploying from the repo root). `frontend/api/index.js` runs as a serverless
function; `frontend/vercel.json` rewrites `/api/*` to it and everything else
to the SPA. Before going live:

- Set the real env vars in the Vercel project (same names as `.env.example`,
  with `PUBLIC_URL` set to the deployed domain and `GATEWAY_URL` pointing at
  the real gateway).
- Register this service with the gateway using that exact `PUBLIC_URL` as
  its `app_url` / `baseUrl` — the gateway refuses to send a sign-in code
  anywhere it doesn't already recognize.
- Check `database/schema.sql` against whatever the DB Lead provisions, then
  point `DB_*` at it.
- Update `regions` in `vercel.json` once you know the production database's
  region (`MICROAPP_PERFORMANCE.md` §1) — it's currently a placeholder
  (`sin1`, matching the gateway's own region).
- Run the gateway's `/conformance` check against the deployed `/health` and
  `/openapi.json` before requesting a connection (`RIZURF_API_TEMPLATE.md`
  §3).

## Project layout

```
database/   schema.sql (hand off to the DB Lead) + seed.sql (local test data only)
frontend/   Vite + React SPA, deployed together with...
  api/      ...the Express API (frontend/api/_lib), as Vercel serverless functions
prototype/  throwaway static HTML/JS UI mockup — not part of the real app
docs/       design spec + implementation plans
```
