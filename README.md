# Rizurf Feedback

Internal employee feedback tool — search a coworker, leave them a public or
anonymous rating + review. See [docs/superpowers/specs/2026-09-18-feedback-system-design.md](docs/superpowers/specs/2026-09-18-feedback-system-design.md)
for the full design.

## Local development setup (XAMPP)

1. **Database** — start MySQL from the XAMPP control panel (or
   `C:\xampp\mysql_start.bat`), then load the schema and local test data:

   ```bash
   C:\xampp\mysql\bin\mysql.exe -u root < database/schema.sql
   C:\xampp\mysql\bin\mysql.exe -u root < database/seed.sql
   ```

   `database/schema.sql` is the canonical schema — hand this to the DB Lead
   for the real company database. `database/seed.sql` is local test data
   only, never sent anywhere else.

2. **Backend API** (`backend/`):

   ```bash
   cd backend
   npm install
   npm start
   ```

   Runs on `http://127.0.0.1:4000`. Reads DB connection info from `.env`
   (copy `.env.example` if you need to recreate it). There is no real
   gateway wired in yet, so every request must carry an
   `X-Mock-User-Id: <employee id>` header — see
   `backend/src/middleware/currentUser.js` for why, and the "Replacing the
   dev auth stand-in" note below.

   Run the backend's tests (visibility rule, no external deps needed):

   ```bash
   npm test
   ```

3. **Frontend** (`frontend/`):

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

   Runs on `http://localhost:5173`. Use the "Viewing as" dropdown in the top
   bar to switch between the seeded test employees (including one admin) —
   this is what sets the `X-Mock-User-Id` header for you.

## Replacing the dev auth stand-in

`backend/src/middleware/currentUser.js` and the frontend's user switcher
are temporary. Once the real Rizurf gateway integration happens, follow
`MICROAPP_AUTH.md` / `RIZURF_API_TEMPLATE.md` (in the gateway project) for
the real sign-in flow, session handling, and token verification, and
delete both of these dev-only pieces.

## Project layout

```
database/   schema.sql (hand off to the DB Lead) + seed.sql (local test data only)
backend/    Node/Express API, MySQL via mysql2
frontend/   Vite + React SPA
prototype/  throwaway static HTML/JS UI mockup — not part of the real app
docs/       design spec + implementation plans
```
