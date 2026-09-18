# Pulse Feedback — Design Spec

Date: 2026-09-18

## Purpose

A Google-Reviews-style internal feedback system: any employee can search for
a coworker and leave them a rating + written review. Reviews are public
(visible to all employees) by default, or the author can mark one
anonymous, in which case it's hidden from everyone except the receiver and
admins/HR.

## Stack

- Frontend: Vite + React (SPA)
- Backend: Node.js + Express
- Storage: MySQL in production; an in-memory store behind the same
  data-access interface for local development (see Phasing)
- Auth: Rizurf gateway (OAuth-style), per `MICROAPP_AUTH.md` /
  `RIZURF_API_TEMPLATE.md` in `C:\xampp\htdocs\PulseDiscussion\`

This app is itself a Rizurf microapp and must conform to
`RIZURF_API_TEMPLATE.md` (health check, OpenAPI doc, error envelope,
correlation IDs) to be connectable to the gateway.

## Auth

No local login, no password table, ever — the gateway is the only place
anyone authenticates.

- Unauthenticated visitor → redirect to
  `${GATEWAY_URL}/oauth/authorize?redirect_uri=${PUBLIC_URL}/`
- Backend exchanges the returned `code` server-to-server via
  `POST ${GATEWAY_URL}/oauth/token`
- Backend verifies the returned identity token itself: RS256 signature
  against the gateway's JWKS (`GET /.well-known/jwks.json`, cached for
  process lifetime), and checks `token_use === "identity"`, `iss`, `aud`,
  `exp`, in that order, failing closed on any check
- On success, starts our own session: a signed/encrypted `HttpOnly`,
  `SameSite=Lax` cookie, `Max-Age` 15 minutes, holding `sid`, `sub`,
  `email`, `name`, `role`
- **Every** authenticated request calls `POST ${GATEWAY_URL}/oauth/introspect`
  with `{sid, sub}` — no caching of the answer — and clears the session +
  redirects to sign-in if `active` is false. Fails open (treats as still
  active) only on a network error reaching the gateway; the 15-minute
  session TTL is the backstop for a gateway that stays down.
- `Cache-Control: no-store, no-cache, must-revalidate, max-age=0` (+
  `pragma: no-cache`, `expires: 0`) on every authenticated response and
  every auth redirect
- No sign-out button anywhere in this app — signing out only happens at
  the gateway
- Admin gate: `role === 'admin' || role === 'hr'` (the gateway's own role
  claim, used directly — no separate local admin table)

## Employee directory

The identity token only describes the person currently signed in — it is
not a company roster. Two sync paths populate the local `employees` table:

1. **On login** — upsert the signed-in user's `sub, email, name, role`
   (always keeps at least everyone who has ever logged in current)
2. **From the roster service** — a placeholder service-to-service
   integration (per `RIZURF_API_TEMPLATE.md` §11 / §10, `client_credentials`
   grant) against whatever Rizurf service owns the full employee roster.
   The exact service id and endpoint are unconfirmed — implement this
   behind a single `syncRosterFromService()` function so swapping in the
   real service id/endpoint later is a one-function change, not a
   redesign. Until confirmed, this can be a no-op or manually-seeded list
   for local dev.

## Data model

Same shape in-memory (Phase 1) and in MySQL (Phase 3) — see Phasing.

**employees**
| column | notes |
|---|---|
| id | gateway `sub` |
| email, name | from gateway |
| role | gateway role claim, synced on login |

**reviews**
| column | notes |
|---|---|
| id | |
| author_id | FK employees.id — always stored, even for anonymous reviews |
| receiver_id | FK employees.id |
| rating | 1–5 |
| body | text |
| visibility | `public` \| `anonymous` |
| created_at, updated_at | |

**review_replies**
| column | notes |
|---|---|
| id | |
| review_id | FK reviews.id |
| author_id | must equal reviews.receiver_id for that review |
| body | |
| created_at | |

One reply per review (enforced at write time: reject a second reply on the
same review).

**review_flags**
| column | notes |
|---|---|
| id | |
| review_id | FK reviews.id |
| flagged_by | FK employees.id |
| reason | text |
| status | `open` \| `resolved` |
| created_at | |

## Visibility rule (the core access-control rule)

Enforced in exactly one place — a single function that, given the
requesting user and a review, decides whether they may see it and whether
the author is included in the response:

- `visibility === 'public'` → visible to any authenticated employee,
  author included
- `visibility === 'anonymous'` →
  - visible to `receiver_id === requester.id`, author **stripped**
  - visible to `requester.role in {admin, hr}`, author **included**
  - otherwise not visible at all (not even that it exists)

All list/search endpoints filter through this function — never a
separate "public view" vs "admin view" query that could drift apart.

## Core flows / endpoints

1. **Search employees** — `GET /api/employees?q=` — substring match on
   name/email in the local table
2. **View employee profile** — `GET /api/employees/:id/reviews` — reviews
   about that employee, filtered through the visibility rule above
3. **Post review** — `POST /api/reviews` — `{receiver_id, rating, body,
   visibility}`; reject if `receiver_id === author_id` (no self-reviews)
4. **Edit/delete own review** — `PATCH /DELETE /api/reviews/:id` — author
   only
5. **Reply to a review** — `POST /api/reviews/:id/replies` — only the
   review's `receiver_id` may reply; only once per review
6. **Flag a review** — `POST /api/reviews/:id/flags` — any authenticated
   employee
7. **Admin: list open flags** — `GET /api/admin/flags` — role gate
8. **Admin: resolve a flag** — `PATCH /api/admin/flags/:id` — mark
   resolved, optionally delete the underlying review

## Notifications

In-app only for v1: a `GET /api/notifications` endpoint the SPA polls,
listing "new review received" / "new reply" / "your flag was resolved"
events. No email/SMTP integration.

## Conformance (this app as a registered Rizurf microapp)

- `GET /health` (public) → `{status, service: "pulse-feedback-api",
  version, checks: {database: bool, gateway: bool}}`
- `GET /openapi.json` (public) → OpenAPI 3.x with `info.x-rizurf`
  (`domain`, `owner`, `category`, `use_cases`, `capabilities`,
  `workflows`) per SS-23/SS-27
- `PUBLIC_PATHS` = `/health`, `/openapi.json`, `/` (SPA shell — a browser
  can't carry a bearer token before sign-in)
- Every response echoes `X-Correlation-ID` (reused if the caller sent
  one, minted otherwise)
- Every non-2xx response uses the standard error envelope:
  `{error: {code, message, correlation_id, details}}`
- `GATEWAY_URL`, `PUBLIC_URL` read from environment, validated at startup
  (fail loudly, not on first request)

## Error handling

- `401` — missing/invalid/expired session or gateway token
- `403` — valid session, insufficient role (e.g. non-admin hitting
  `/api/admin/*`) or acting on someone else's resource (editing another
  author's review, replying as non-receiver)
- `404` — resource not found, or a review the requester isn't allowed to
  see (anonymous review visibility denial looks identical to "doesn't
  exist" to an unauthorized requester)
- `422` — validation error (e.g. rating out of 1–5, self-review attempt,
  second reply on a review)

## Phasing

1. **Phase 1 — core functionality, no real database.** Express API +
   gateway auth flow + an in-memory store implementing the same
   data-access interface MySQL will later use (SS-15: a DAL module with
   no web-framework import, swappable). All 8 endpoints above working,
   exercised via curl/Postman/a test script. No React yet.
2. **Phase 2 — UI.** Vite/React SPA wired to the Phase 1 API: search,
   profile view, post/edit/delete review, reply, flag, admin flag queue.
3. **Phase 3 — real database.** Swap the in-memory DAL implementation for
   MySQL behind the same interface; add the roster-service sync once its
   real service id/endpoint is confirmed.

## Testing

- Phase 1: a small script (or curl sequence) exercising each endpoint
  end-to-end against the in-memory store — create a review, verify
  visibility rules from different requester roles, edit/delete, reply,
  flag, admin-resolve. This is the "write tests for write-path behavior"
  requirement from `RIZURF_API_TEMPLATE.md` §3 (SS-10/11/12 aren't
  checkable by the gateway's own conformance checker).
- Auth: verified live per `MICROAPP_AUTH.md` §9 definition of done (sign
  in, open in one tab, sign out at the gateway in another, refresh —
  locks with no delay) once a real gateway is available to test against.

## Out of scope for v1

- Org-hierarchy-based manager visibility (flat admin/hr role only)
- Email notifications
- Public replies beyond one per review
- Rate-limiting reviews per author/receiver pair (unlimited over time, by
  design)
