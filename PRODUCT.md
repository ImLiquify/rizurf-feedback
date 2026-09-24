# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Any employee of the company, using it to search for a coworker and leave (or receive) peer feedback. A secondary role, admin/HR, moderates flagged reviews and can see the author behind an anonymous review; this role is a flat permission (no org-hierarchy "manager" concept).

## Product Purpose

Rizurf Feedback is an internal employee feedback tool, modeled after Google Reviews but for coworkers: any employee can rate and review any other employee (1–5 stars + written text), either publicly or anonymously. Success means employees actually use it to give timely, honest feedback without fear of reprisal — anonymity is preserved from peers, but the organization retains oversight through admin/HR.

## Positioning

Anonymous-but-accountable feedback: an anonymous review always stores its author, but access to that identity is enforced by a single shared rule — visible to the review's receiver and to admin/hr, invisible to everyone else. A neighboring tool that goes either fully anonymous (no oversight, ripe for abuse) or fully attributed (no safe way to give hard feedback) could not copy this mechanism.

## Operating Context

Employees use this from a browser at work, as one of several internal "Rizurf" microapps sitting behind a shared company gateway (single sign-on). Authentication is fully wired to that gateway per `MICROAPP_AUTH.md` / `RIZURF_API_TEMPLATE.md`: no local login of any kind, a signed own-app session checked against the gateway on every request, no cache. The frontend and API deploy together as one Vercel project so the session cookie stays same-site. The full employee roster still just grows as people log in; syncing it from another Rizurf microservice remains unconfirmed/undecided.

## Capabilities and Constraints

- Search employees by name or email.
- Leave a 1–5 star rating + written review for any other employee (not yourself), marked public or anonymous.
- Anonymous review visibility is enforced server-side: the receiver sees it with the author hidden; admin/hr see it with the author shown; everyone else does not see it exists at all.
- Edit or delete your own review at any time; no limit on how many times one employee can review another over time.
- Reply to a review only if you are its receiver; one reply per review.
- Flag a review for moderation; admin/hr resolves a flag and may delete the underlying review.
- In-app notifications for "review received," "reply received," and "your flag was resolved" — no email/SMS.
- The production database is owned by a separate DB Lead; `database/schema.sql` is the canonical handoff artifact, kept in sync with whatever the app actually needs. Local development runs against a XAMPP MySQL instance seeded with test-only data (`database/seed.sql`), never real company data.
- Open/undecided: the exact roster-sync service/endpoint for populating the employee directory ahead of first login.

## Brand Commitments

Name: **Rizurf Feedback**. Part of the "Rizurf" company microapp ecosystem, sharing that ecosystem's gateway and service conventions (`RIZURF_API_TEMPLATE.md`).

## Evidence on Hand

None. All employees, reviews, and ratings currently in the app are local seed/mock data for testing — future work must never present that data as real, and must not fabricate testimonials, metrics, or company specifics beyond what's confirmed here.

## Product Principles

- Feedback must be safe to give honestly — anonymity is an access-control guarantee, not a UI convention that a bug or a new screen could accidentally leak.
- Accountability for admin/HR is preserved even when peers can never see who wrote a review.
- There is no dev-only auth bypass to drift into production — local development authenticates through the same real gateway flow as production, just pointed at whatever `GATEWAY_URL` is configured.
- Reuse the Rizurf ecosystem's existing conventions (gateway SSO, service template) rather than inventing a parallel identity or API system.
- Nothing ships that the real database handoff (`database/schema.sql`) can't also support.

## Accessibility & Inclusion

No formal standard required. Build to normal good practice: semantic HTML, full keyboard access, sufficient color contrast.
