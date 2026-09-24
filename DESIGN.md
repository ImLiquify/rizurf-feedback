---
name: Rizurf Feedback
description: A chat-like internal feedback tool — dark sidebar, white message-bubble canvas, one teal accent.
colors:
  sidebar-bg: "#0d1220"
  sidebar-hover: "rgba(20, 184, 166, 0.14)"
  sidebar-text: "#cbd2e1"
  sidebar-muted: "#6b7690"
  sidebar-border: "rgba(255, 255, 255, 0.08)"
  accent: "#14b8a6"
  accent-strong: "#0d9488"
  accent-light: "#e6fbf7"
  accent-on: "#04211d"
  text: "#101828"
  muted: "#667085"
  border: "#e5e7eb"
  bg: "#f8fafc"
  card-bg: "#ffffff"
  danger: "#dc2626"
  danger-light: "#fef2f2"
  rating-star: "#f5a623"
typography:
  body:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  title:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
    fontSize: "22px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  label:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
    fontSize: "11px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0.06em"
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  pill: "999px"
  circle: "50%"
spacing:
  xs: "6px"
  sm: "10px"
  md: "16px"
  lg: "20px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-on}"
    rounded: "{rounded.pill}"
    padding: "10px 20px"
  button-primary-hover:
    backgroundColor: "{colors.accent-strong}"
    textColor: "#ffffff"
  button-dark:
    backgroundColor: "{colors.sidebar-bg}"
    textColor: "#ffffff"
    rounded: "{rounded.pill}"
    padding: "10px 20px"
  sidebar-nav-item-active:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-on}"
    rounded: "{rounded.sm}"
    padding: "10px 14px"
  review-card:
    backgroundColor: "{colors.card-bg}"
    rounded: "{rounded.lg}"
    padding: "16px 18px"
  compose-input:
    backgroundColor: "{colors.bg}"
    rounded: "{rounded.pill}"
    padding: "12px 18px"
---

# Design System: Rizurf Feedback

## Overview

**Creative North Star: "The Message Thread"**

Rizurf Feedback reads employee reviews as messages between coworkers, not rows in an admin table — the build explicitly refuses the generic light-corporate-dashboard default its own first pass shipped. A persistent near-black navy sidebar carries brand, primary nav, and the current identity; everything else lives on a white content canvas. Reviews, replies, and flags render as rounded cards with a compact header row (author, timestamp, actions), echoing chat bubbles rather than table rows; reply and flag inputs use a pill-shaped compose bar with a circular send button. This is an Operate-register internal tool (per PRODUCT.md), so the chat-app visual grammar is restrained rather than playful: one teal accent, no illustration, no gradients beyond the small brand mark.

Color is deliberately rationed: teal (#14b8a6) is the single accent carrying active nav state, primary actions, and the anonymous-toggle's "on" state; nothing else competes with it. Depth is soft and functional (low, diffuse shadows on hover) rather than decorative. Inter is the workhorse UI/body face throughout — confirmed intentional for this Operate surface (see `.impeccable/config.json`), not a placeholder.

**Key Characteristics:**
- Dark navy sidebar + white content pane, restrained one-accent palette
- Reviews/replies/flags as rounded message-bubble cards, not table rows
- Pill-shaped inputs and buttons; compose bar with circular send button
- Authored inline-SVG icon set (18px, 1.75 stroke, round caps) — no emoji, no icon fonts
- Soft, functional shadows; flat at rest, lifted on hover

## Colors

Palette is restrained: one accent, a navy/near-black sidebar, and white/gray neutrals. No secondary or tertiary accent exists in the build.

### Primary
- **Teal Accent** (`#14b8a6`): active sidebar nav, primary buttons, anonymous-toggle "on" state, search/input focus outline, hover wash on rows.
- **Teal Strong** (`#0d9488`): hover state for teal buttons/links, avatar initials text, "on" toggle color.
- **Teal Light** (`#e6fbf7`): avatar fill, reply-block background, sidebar/row hover wash, table-row hover tint.

### Neutral
- **Sidebar Ink** (`#0d1220`): sidebar background; also reused as the compose-bar send button and the "dark" button variant — the only place navy appears outside the sidebar.
- **Sidebar Text** (`#cbd2e1`) / **Sidebar Muted** (`#6b7690`): sidebar nav/label text on the dark ground.
- **Body Text** (`#101828`): primary text on the white canvas.
- **Muted Text** (`#667085`): secondary text, labels, meta rows (timestamps, roles).
- **Border** (`#e5e7eb`): card, input, and divider strokes.
- **Canvas** (`#f8fafc`): input/search field fill.
- **Card White** (`#ffffff`): card and content-pane background.
- **Danger** (`#dc2626`) / **Danger Light** (`#fef2f2`): flag reasons, delete action, error text.
- **Rating Star** (`#f5a623`): filled star rating glyphs (★/☆) — the one non-teal accent color, scoped to ratings only.

### Named Rules
**The One Accent Rule.** Teal is the only color that carries interactive/active meaning (nav, primary buttons, toggle-on, focus rings). Everything else is navy, gray, or white. Don't introduce a second accent hue.

## Typography

**Body/UI Font:** Inter (with -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif)

**Character:** A single workhorse grotesk carries every register in this Operate-mode tool — headings, body, labels, and sidebar chrome are all Inter at different weights, not a display/body pairing. This is a confirmed intentional choice for this surface, not an unreviewed default (see `.impeccable/config.json` `detector.ignoreValues`).

### Hierarchy
- **Title** (700, 22px, 1.2 line-height, -0.01em): page headings (`h1`), e.g. employee name on the profile page.
- **Subtitle** (default weight, 15px): section headings (`h2`).
- **Body** (400, 14px, 1.5 line-height): review body text, form fields, list rows.
- **Label** (700, 11-12px, uppercase, 0.04-0.06em letter-spacing): form labels, sidebar section labels, user-switcher field labels.
- **Meta** (400, 13px, muted color): timestamps, author lines, role text.

## Layout

Two-region shell: a fixed 264px sidebar (full viewport height, sticky) beside a flex-1 white content pane capped at an 880px `main` width with 32px padding. Content topbar (16px/32px padding) holds the notifications bell, right-aligned. Spacing rhythm runs in small steps: 4-8px between tightly related elements (label to field), 12-20px between cards/sections, 32px for page-level padding.

Below 768px the sidebar collapses into a horizontal top bar: nav items become an inline row, identity block hides, and `main` padding drops to 20px/16px — a single documented breakpoint, no intermediate tablet step.

## Elevation & Depth

Flat at rest, lifted only on hover/interaction — a hybrid of tonal layering (teal-light washes) and soft ambient shadow. Cards and panels carry no shadow by default; hovering a review card or employee row adds a diffuse shadow and a 1px lift.

### Shadow Vocabulary
- **sm** (`0 1px 2px rgba(16, 24, 40, 0.06)`): resting panel elevation (forms, review-detail panel).
- **md** (`0 8px 20px rgba(16, 24, 40, 0.08)`): review-card hover state.
- **lg** (`0 16px 40px rgba(16, 24, 40, 0.14)`): floating overlays — notifications panel, dropdown menu.

### Named Rules
**The Hover-Lift Rule.** Shadows only deepen in response to state (hover) or float above content (menus, panels); nothing carries a resting drop shadow that isn't a floating overlay.

## Shapes

Pill radius (999px) dominates interactive controls: nav items collapse to pills on mobile, all buttons, search/compose inputs, and the notification bell button are full pills. Cards and panels use a softer large radius (14-16px): review cards, flag rows, employee rows, the notifications/dropdown panels. Small chrome (sidebar nav items, avatars-as-circles aside) uses 8-12px. Avatars and the compose-send button are perfect circles (50%). No hard/sharp corners appear anywhere in the build.

## Components

### Buttons
- **Shape:** full pill (`border-radius: 999px`), 10px/20px padding; `.btn.small` drops to 6px/14px.
- **Primary:** teal fill (`#14b8a6`), dark-teal text (`#04211d`); hover deepens to `#0d9488` with white text.
- **Dark:** navy fill (`#0d1220`), white text; used for the compose-send button and one dark CTA variant.
- **Secondary/Ghost:** white fill, 1px `#e5e7eb` border, body-text color; hover fills to canvas gray.
- **Danger:** white fill, red text/border; hover fills to `#fef2f2`.
- **Hover/Focus:** background/color transitions at 0.12s; active state nudges 1px down; focus-visible gets a 2px teal outline offset 1-2px.

### Cards / Containers
- **Corner Style:** 14-16px radius (review cards 16px, employee/flag rows 14px).
- **Background:** white on the content canvas; hover applies a teal-light wash (employee rows) or a shadow lift (review cards).
- **Shadow Strategy:** flat at rest, `--shadow-md` lift on review-card hover (see Elevation).
- **Border:** 1px `#e5e7eb`, shifts to accent teal on employee-row hover.
- **Internal Padding:** panels 20px; review cards 16px/18px; flag/employee rows 12-16px.

### Inputs / Fields
- **Style:** 1px `#e5e7eb` border, `#f8fafc` fill, 12px radius for standard fields; search and compose fields are full pill.
- **Focus:** 2px teal outline, 1px offset, background lifts to white.
- **Labels:** uppercase, 11-12px, 700 weight, muted color, 0.04-0.06em letter-spacing.

### Navigation (Sidebar)
- **Style:** navy ground (`#0d1220`), nav items as pill/rounded (10px) rows; default state uses `#cbd2e1` text.
- **Hover:** soft teal wash (`rgba(20,184,166,0.14)`), text brightens to white.
- **Active:** solid teal fill, dark-teal text — the accent's primary carrier.
- **Mobile:** sidebar becomes a horizontal top bar below 768px; nav row goes inline, identity block hides.

### Compose Bar (signature component)
A chat-style input used for both review replies and flag reasons: a pill text input/textarea paired with a circular 40px send button (navy by default, teal-strong on hover). This is the build's signature translation of the pinned reference's messaging-app grammar onto form actions that were previously plain buttons.

### Authored Icon Set
18x18 inline SVGs (24x24 viewBox, 1.75 stroke, round caps/joins) for bell, kebab-menu (dots), pencil, trash, flag, send, chevron-left, close, search, and the eye/eye-slash anonymity toggle. One consistent outline style replaces emoji/Unicode glyphs as UI chrome. Star ratings (`★`/`☆`) remain literal glyphs, scoped only to rating display, not treated as icon chrome.

## Do's and Don'ts

### Do:
- **Do** keep teal (`#14b8a6`/`#0d9488`) as the only accent hue; every other interactive surface stays navy, gray, or white.
- **Do** render review/reply/flag content as rounded cards with a compact header row, never a bare HTML table.
- **Do** use the pill compose-bar (input + circular send button) for any new chat-style input action.
- **Do** draw new UI chrome from the authored SVG icon set (18px, 1.75 stroke) rather than emoji or Unicode glyphs.

### Don't:
- **Don't** add a second accent color; the One Accent Rule covers nav, buttons, and toggles.
- **Don't** introduce hard-edged/sharp-corner components; every surface in this world uses pill or 12-16px rounding.
- **Don't** reintroduce bare `<table>` markup for list data (admin flags, reviews) — the shipped pattern is card rows.
