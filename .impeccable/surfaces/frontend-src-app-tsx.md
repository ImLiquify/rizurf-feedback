---
version: 1
slug: "frontend-src-app-tsx"
primary_target: "frontend/src/App.tsx"
related_targets: []
---

## Direction contract

THESIS: Reviews read like messages between coworkers, not rows in an admin table — refuses the generic light-corporate-dashboard default the first build shipped.

OWN-WORLD: A persistent near-black navy sidebar (brand, primary nav, identity/switcher pinned to the bottom) beside a white content canvas. One teal accent (~#14b8a6) carries active nav state, primary buttons, and the anonymous-toggle's "on" state — everything else stays neutral gray/navy/white (Restrained strategy). Review and reply cards render as message bubbles: rounded, a light neutral fill, author + timestamp as a compact header row above the body. Search and text inputs are full-pill rounded fields; primary actions are dark or teal pill buttons, echoing a chat compose bar. Avatars are colored circles with initials.

STORY: An employee opens the app and instantly reads it as an approachable, chat-like tool, not a clinical admin panel; they scan the sidebar for Directory/Admin: Flags, then read reviews about a coworker the way they'd read a conversation.

FIRST VIEWPORT: Full-height dark sidebar at a fixed width (brand top, nav items as pill buttons — filled teal when active, identity/user-switcher pinned bottom) beside a white content pane. Directory search sits at the top of the content pane in a pill input with a leading search icon; results render as rows (avatar, name, role, rating) with a soft teal wash on hover. Signature interaction: sidebar nav items fill with a soft teal slide on hover/active; review cards lift with a soft shadow on hover, echoing a message being picked up.

FORM: User-pinned reference (a chat-app screenshot they supplied). Ran `concept-seed --scope surface` (seed key c8beecd1) per protocol; none of the three dealt challengers (seven-segment display family, kinetic tensegrity, mecha-anime command wall) apply over a user-pinned visual reference — a pinned decision beats the roll. Direction is the pinned reference's visual grammar (dark sidebar, teal accent, card/bubble language) translated onto this product's existing pages (Directory, Employee Profile, Admin Flags, Notifications) at Operate register — navigation/IA unchanged, confirmed with the user.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.
