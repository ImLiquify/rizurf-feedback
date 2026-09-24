# Pulse Feedback Frontend (Mocked Backend) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a working Vite + React frontend for the Pulse Feedback system, backed entirely by an in-memory/localStorage mock data layer, so every core flow (search, post/edit/delete a review, reply, flag, admin flag queue, notifications) can be clicked through and verified before any real backend, database, or gateway integration exists.

**Architecture:** A `frontend/` Vite+React+TypeScript SPA. All "backend" behavior lives in `src/mockApi/` — a data-access layer (seed data + a `localStorage`-persisted store) and an API-shaped function surface (`src/mockApi/mockApi.ts`) that enforces the same rules the real Express API will later enforce (visibility, no self-review, one reply per review, receiver-only reply, admin/hr role gate). Because the mock layer's function signatures mirror the future real API, swapping in real HTTP calls later changes only the data layer, not the pages/components. A dev-only `CurrentUserContext` + `UserSwitcher` stand in for gateway login, letting you click through every role/permission case.

**Tech Stack:** Vite, React 18, TypeScript, react-router-dom, Vitest, @testing-library/react, @testing-library/user-event, @testing-library/jest-dom, jsdom.

**Spec:** [docs/superpowers/specs/2026-09-18-feedback-system-design.md](../specs/2026-09-18-feedback-system-design.md)

## Global Constraints

- This plan is frontend-only: no real backend, no MySQL, no Rizurf gateway calls. All data lives in the mock layer described above.
- The mock layer's behavior must match the spec's rules exactly: anonymous reviews are visible to the receiver (author stripped), to the review's own author (author included — you always know your own identity), or to `admin`/`hr` roles (author included); invisible to anyone else. No self-reviews. One reply per review, receiver only. Admin actions gated on `role === 'admin' || role === 'hr'`.
- All frontend code lives under `frontend/` at the repo root.
- TypeScript throughout; no `any` in new code.
- Every task that adds logic (not pure markup/config) is test-first: write the failing test, watch it fail, implement, watch it pass, commit.
- Commit after every task using the attribution trailer already used in this repo's other commits: `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>`.

---

### Task 1: Scaffold the Vite + React + TypeScript app with Vitest configured

**Files:**
- Create: `frontend/` (via Vite scaffold — package.json, vite.config.ts, tsconfig*.json, index.html, src/main.tsx, src/App.tsx, etc.)
- Modify: `frontend/vite.config.ts`
- Create: `frontend/src/setupTests.ts`
- Test: `frontend/src/sanity.test.ts`

**Interfaces:**
- Consumes: nothing (first task)
- Produces: a working `npm test` command in `frontend/` that runs Vitest; a `frontend/src/setupTests.ts` that every later test file's config relies on via `vite.config.ts`'s `test.setupFiles`

- [ ] **Step 1: Scaffold the app**

Run from the repo root:

```bash
npm create vite@latest frontend -- --template react-ts
```

- [ ] **Step 2: Install the generated dependencies**

```bash
cd frontend && npm install
```

- [ ] **Step 3: Install test tooling and the router**

```bash
cd frontend && npm install -D vitest @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom
cd frontend && npm install react-router-dom
```

- [ ] **Step 4: Add the Vitest config block to `vite.config.ts`**

Replace the generated `frontend/vite.config.ts` with:

```ts
/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
    globals: true,
  },
})
```

- [ ] **Step 5: Create the test setup file**

Create `frontend/src/setupTests.ts`:

```ts
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 6: Add a `test` script**

In `frontend/package.json`, add to `"scripts"`:

```json
"test": "vitest run"
```

- [ ] **Step 7: Write a sanity test**

Create `frontend/src/sanity.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

describe('sanity', () => {
  it('runs a basic assertion', () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 8: Run the test suite and verify it passes**

```bash
cd frontend && npx vitest run src/sanity.test.ts
```

Expected: PASS (1 test).

- [ ] **Step 9: Commit**

```bash
git add frontend
git commit -m "$(cat <<'EOF'
Scaffold Vite+React+TS frontend with Vitest configured

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Shared types, seed data, and a persisted mock store

**Files:**
- Create: `frontend/src/types.ts`
- Create: `frontend/src/mockApi/seed.ts`
- Create: `frontend/src/mockApi/store.ts`
- Test: `frontend/src/mockApi/store.test.ts`

**Interfaces:**
- Consumes: nothing new
- Produces: types `Role`, `Employee`, `Visibility`, `Review`, `ReviewView`, `ReviewReply`, `FlagStatus`, `ReviewFlag`, `NotificationType`, `NotificationItem` (all from `types.ts`); `seedEmployees: Employee[]`, `seedReviews: Review[]` (from `mockApi/seed.ts`); `getStore(): StoreData`, `setStore(next: StoreData): void`, `resetStore(): void`, interface `StoreData` (from `mockApi/store.ts`)

- [ ] **Step 1: Write the types**

Create `frontend/src/types.ts`:

```ts
export type Role = 'employee' | 'admin' | 'hr' | 'supervisor';

export interface Employee {
  id: string;
  email: string;
  name: string;
  role: Role;
}

export type Visibility = 'public' | 'anonymous';

export interface Review {
  id: string;
  authorId: string;
  receiverId: string;
  rating: number;
  body: string;
  visibility: Visibility;
  createdAt: string;
  updatedAt: string;
}

// What a specific requester is allowed to see: authorId is null when the
// review is anonymous and the requester is neither the receiver, the
// author, nor an admin/hr.
export interface ReviewView extends Omit<Review, 'authorId'> {
  authorId: string | null;
}

export interface ReviewReply {
  id: string;
  reviewId: string;
  authorId: string;
  body: string;
  createdAt: string;
}

export type FlagStatus = 'open' | 'resolved';

export interface ReviewFlag {
  id: string;
  reviewId: string;
  flaggedBy: string;
  reason: string;
  status: FlagStatus;
  createdAt: string;
}

export type NotificationType = 'review_received' | 'reply_received' | 'flag_resolved';

export interface NotificationItem {
  id: string;
  userId: string;
  type: NotificationType;
  message: string;
  createdAt: string;
  read: boolean;
}
```

- [ ] **Step 2: Write seed data**

Create `frontend/src/mockApi/seed.ts`:

```ts
import type { Employee, Review } from '../types';

export const seedEmployees: Employee[] = [
  { id: 'emp-1', email: 'alice@rizurf.local', name: 'Alice Nguyen', role: 'employee' },
  { id: 'emp-2', email: 'bob@rizurf.local', name: 'Bob Santos', role: 'employee' },
  { id: 'emp-3', email: 'carla@rizurf.local', name: 'Carla Cruz', role: 'employee' },
  { id: 'emp-4', email: 'diego@rizurf.local', name: 'Diego Reyes', role: 'supervisor' },
  { id: 'emp-5', email: 'erika@rizurf.local', name: 'Erika Flores', role: 'admin' },
];

export const seedReviews: Review[] = [
  {
    id: 'rev-1',
    authorId: 'emp-2',
    receiverId: 'emp-1',
    rating: 5,
    body: 'Alice is always quick to help unblock the team.',
    visibility: 'public',
    createdAt: '2026-09-01T09:00:00.000Z',
    updatedAt: '2026-09-01T09:00:00.000Z',
  },
  {
    id: 'rev-2',
    authorId: 'emp-3',
    receiverId: 'emp-1',
    rating: 3,
    body: 'Communication could be clearer during handoffs.',
    visibility: 'anonymous',
    createdAt: '2026-09-05T09:00:00.000Z',
    updatedAt: '2026-09-05T09:00:00.000Z',
  },
];
```

- [ ] **Step 3: Write the failing store test**

Create `frontend/src/mockApi/store.test.ts`:

```ts
import { beforeEach, describe, expect, it } from 'vitest';
import { getStore, setStore, resetStore } from './store';
import { seedEmployees } from './seed';

describe('store', () => {
  beforeEach(() => {
    localStorage.clear();
    resetStore();
  });

  it('starts from seed data', () => {
    expect(getStore().employees).toEqual(seedEmployees);
  });

  it('persists changes to localStorage', () => {
    const next = { ...getStore(), employees: [] };
    setStore(next);

    const raw = localStorage.getItem('pulse-feedback-mock-store-v1');
    expect(raw).not.toBeNull();
    expect(JSON.parse(raw as string).employees).toEqual([]);
  });

  it('reflects the updated data through getStore after setStore', () => {
    setStore({ ...getStore(), employees: [] });
    expect(getStore().employees).toEqual([]);
  });
});
```

- [ ] **Step 4: Run it to verify it fails**

```bash
cd frontend && npx vitest run src/mockApi/store.test.ts
```

Expected: FAIL (`store.ts` does not exist yet).

- [ ] **Step 5: Implement the store**

Create `frontend/src/mockApi/store.ts`:

```ts
import type { Employee, Review, ReviewReply, ReviewFlag, NotificationItem } from '../types';
import { seedEmployees, seedReviews } from './seed';

const STORAGE_KEY = 'pulse-feedback-mock-store-v1';

export interface StoreData {
  employees: Employee[];
  reviews: Review[];
  replies: ReviewReply[];
  flags: ReviewFlag[];
  notifications: NotificationItem[];
}

function seedData(): StoreData {
  return {
    employees: seedEmployees,
    reviews: seedReviews,
    replies: [],
    flags: [],
    notifications: [],
  };
}

function loadStore(): StoreData {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      return JSON.parse(raw) as StoreData;
    } catch {
      // fall through to seed
    }
  }
  return seedData();
}

let data: StoreData = loadStore();

function persist(): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getStore(): StoreData {
  return data;
}

export function setStore(next: StoreData): void {
  data = next;
  persist();
}

export function resetStore(): void {
  data = seedData();
  persist();
}
```

- [ ] **Step 6: Run the test again to verify it passes**

```bash
cd frontend && npx vitest run src/mockApi/store.test.ts
```

Expected: PASS (3 tests).

- [ ] **Step 7: Commit**

```bash
git add frontend/src/types.ts frontend/src/mockApi/seed.ts frontend/src/mockApi/store.ts frontend/src/mockApi/store.test.ts
git commit -m "$(cat <<'EOF'
Add shared types, seed data, and a persisted mock store

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: The visibility rule (single source of truth for who sees what)

**Files:**
- Create: `frontend/src/mockApi/visibility.ts`
- Test: `frontend/src/mockApi/visibility.test.ts`

**Interfaces:**
- Consumes: `Employee`, `Review`, `ReviewView`, `Role` from `../types`
- Produces: `isAdminRole(role: Role): boolean`, `viewReviewFor(review: Review, requester: Employee): ReviewView | null`, `viewReviewsFor(reviews: Review[], requester: Employee): ReviewView[]`

- [ ] **Step 1: Write the failing tests**

Create `frontend/src/mockApi/visibility.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { isAdminRole, viewReviewFor, viewReviewsFor } from './visibility';
import type { Employee, Review } from '../types';

const receiver: Employee = { id: 'emp-1', email: 'a@x.local', name: 'A', role: 'employee' };
const author: Employee = { id: 'emp-3', email: 'c@x.local', name: 'C', role: 'employee' };
const unrelated: Employee = { id: 'emp-2', email: 'b@x.local', name: 'B', role: 'employee' };
const admin: Employee = { id: 'emp-5', email: 'e@x.local', name: 'E', role: 'admin' };
const hr: Employee = { id: 'emp-6', email: 'h@x.local', name: 'H', role: 'hr' };

const publicReview: Review = {
  id: 'rev-pub',
  authorId: 'emp-3',
  receiverId: 'emp-1',
  rating: 4,
  body: 'Good work.',
  visibility: 'public',
  createdAt: '2026-09-01T00:00:00.000Z',
  updatedAt: '2026-09-01T00:00:00.000Z',
};

const anonReview: Review = { ...publicReview, id: 'rev-anon', visibility: 'anonymous' };

describe('isAdminRole', () => {
  it('is true for admin and hr, false otherwise', () => {
    expect(isAdminRole('admin')).toBe(true);
    expect(isAdminRole('hr')).toBe(true);
    expect(isAdminRole('employee')).toBe(false);
    expect(isAdminRole('supervisor')).toBe(false);
  });
});

describe('viewReviewFor', () => {
  it('shows a public review with its author to anyone', () => {
    expect(viewReviewFor(publicReview, unrelated)).toEqual({ ...publicReview, authorId: 'emp-3' });
  });

  it('shows an anonymous review to its receiver with the author stripped', () => {
    expect(viewReviewFor(anonReview, receiver)).toEqual({ ...anonReview, authorId: null });
  });

  it('shows an anonymous review to its own author, with their identity included', () => {
    expect(viewReviewFor(anonReview, author)).toEqual({ ...anonReview, authorId: 'emp-3' });
  });

  it('shows an anonymous review to an admin with the author included', () => {
    expect(viewReviewFor(anonReview, admin)).toEqual({ ...anonReview, authorId: 'emp-3' });
  });

  it('shows an anonymous review to hr with the author included', () => {
    expect(viewReviewFor(anonReview, hr)).toEqual({ ...anonReview, authorId: 'emp-3' });
  });

  it('hides an anonymous review entirely from an unrelated, non-admin employee', () => {
    expect(viewReviewFor(anonReview, unrelated)).toBeNull();
  });
});

describe('viewReviewsFor', () => {
  it('filters out reviews the requester is not allowed to see', () => {
    const result = viewReviewsFor([publicReview, anonReview], unrelated);
    expect(result).toEqual([{ ...publicReview, authorId: 'emp-3' }]);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

```bash
cd frontend && npx vitest run src/mockApi/visibility.test.ts
```

Expected: FAIL (`visibility.ts` does not exist yet).

- [ ] **Step 3: Implement the visibility rule**

Create `frontend/src/mockApi/visibility.ts`:

```ts
import type { Employee, Review, ReviewView, Role } from '../types';

export function isAdminRole(role: Role): boolean {
  return role === 'admin' || role === 'hr';
}

export function viewReviewFor(review: Review, requester: Employee): ReviewView | null {
  if (review.visibility === 'public') {
    return { ...review, authorId: review.authorId };
  }
  // Anonymous: the receiver sees it with the author stripped. The author
  // themselves and any admin/hr see it with the author included — you
  // always know your own identity, so revealing it to yourself breaks
  // nothing about the anonymity guarantee, which is about hiding it from
  // everyone ELSE.
  if (review.receiverId === requester.id) {
    return { ...review, authorId: null };
  }
  if (review.authorId === requester.id || isAdminRole(requester.role)) {
    return { ...review, authorId: review.authorId };
  }
  return null;
}

export function viewReviewsFor(reviews: Review[], requester: Employee): ReviewView[] {
  return reviews
    .map((review) => viewReviewFor(review, requester))
    .filter((review): review is ReviewView => review !== null);
}
```

- [ ] **Step 4: Run the tests again to verify they pass**

```bash
cd frontend && npx vitest run src/mockApi/visibility.test.ts
```

Expected: PASS (8 tests).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/mockApi/visibility.ts frontend/src/mockApi/visibility.test.ts
git commit -m "$(cat <<'EOF'
Add the review visibility rule as a single shared function

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: Mock API — employee search and review CRUD

**Files:**
- Create: `frontend/src/mockApi/mockApi.ts`
- Test: `frontend/src/mockApi/mockApi.test.ts`

**Interfaces:**
- Consumes: `getStore`, `setStore` from `./store`; `viewReviewsFor` from `./visibility`; `Employee`, `Review`, `ReviewView`, `Visibility` from `../types`
- Produces: class `MockApiError` (`code: string`, extends `Error`); `searchEmployees(query: string): Employee[]`; `getEmployeeReviews(employeeId: string, requesterId: string): ReviewView[]`; interface `PostReviewInput`; `postReview(input: PostReviewInput): Review`; interface `EditReviewInput`; `editReview(input: EditReviewInput): Review`; `deleteReview(reviewId: string, requesterId: string): void`

- [ ] **Step 1: Write the failing tests**

Create `frontend/src/mockApi/mockApi.test.ts`:

```ts
import { beforeEach, describe, expect, it } from 'vitest';
import { resetStore } from './store';
import {
  MockApiError,
  searchEmployees,
  getEmployeeReviews,
  postReview,
  editReview,
  deleteReview,
} from './mockApi';

beforeEach(() => {
  localStorage.clear();
  resetStore();
});

describe('searchEmployees', () => {
  it('returns everyone for an empty query', () => {
    expect(searchEmployees('')).toHaveLength(5);
  });

  it('matches by name or email, case-insensitively', () => {
    expect(searchEmployees('ERIKA').map((e) => e.id)).toEqual(['emp-5']);
    expect(searchEmployees('bob@rizurf').map((e) => e.id)).toEqual(['emp-2']);
  });
});

describe('getEmployeeReviews', () => {
  it("returns an employee's reviews filtered through the visibility rule", () => {
    const asReceiver = getEmployeeReviews('emp-1', 'emp-1');
    expect(asReceiver).toHaveLength(2);

    const asUnrelated = getEmployeeReviews('emp-1', 'emp-2');
    expect(asUnrelated).toHaveLength(1);
    expect(asUnrelated[0].visibility).toBe('public');
  });
});

describe('postReview', () => {
  it('creates a review and rejects a self-review', () => {
    const review = postReview({
      authorId: 'emp-2',
      receiverId: 'emp-3',
      rating: 5,
      body: 'Great teammate.',
      visibility: 'public',
    });
    expect(review.id).toBeTruthy();
    expect(getEmployeeReviews('emp-3', 'emp-2')).toHaveLength(1);

    expect(() =>
      postReview({ authorId: 'emp-2', receiverId: 'emp-2', rating: 5, body: 'x', visibility: 'public' }),
    ).toThrow(MockApiError);
  });

  it('rejects a rating outside 1-5', () => {
    expect(() =>
      postReview({ authorId: 'emp-2', receiverId: 'emp-3', rating: 6, body: 'x', visibility: 'public' }),
    ).toThrow(MockApiError);
  });
});

describe('editReview', () => {
  it('lets the author edit their own review', () => {
    const review = postReview({
      authorId: 'emp-2',
      receiverId: 'emp-3',
      rating: 2,
      body: 'Needs work.',
      visibility: 'public',
    });
    const updated = editReview({ reviewId: review.id, requesterId: 'emp-2', body: 'Much better now.' });
    expect(updated.body).toBe('Much better now.');
  });

  it('rejects an edit from someone other than the author', () => {
    const review = postReview({
      authorId: 'emp-2',
      receiverId: 'emp-3',
      rating: 2,
      body: 'Needs work.',
      visibility: 'public',
    });
    expect(() => editReview({ reviewId: review.id, requesterId: 'emp-4', body: 'x' })).toThrow(MockApiError);
  });
});

describe('deleteReview', () => {
  it('lets the author delete their own review', () => {
    const review = postReview({
      authorId: 'emp-2',
      receiverId: 'emp-3',
      rating: 2,
      body: 'Needs work.',
      visibility: 'public',
    });
    deleteReview(review.id, 'emp-2');
    expect(getEmployeeReviews('emp-3', 'emp-2')).toHaveLength(0);
  });

  it('rejects a delete from someone other than the author', () => {
    const review = postReview({
      authorId: 'emp-2',
      receiverId: 'emp-3',
      rating: 2,
      body: 'Needs work.',
      visibility: 'public',
    });
    expect(() => deleteReview(review.id, 'emp-4')).toThrow(MockApiError);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

```bash
cd frontend && npx vitest run src/mockApi/mockApi.test.ts
```

Expected: FAIL (`mockApi.ts` does not exist yet).

- [ ] **Step 3: Implement employee search and review CRUD**

Create `frontend/src/mockApi/mockApi.ts`:

```ts
import { getStore, setStore } from './store';
import { viewReviewsFor } from './visibility';
import type { Employee, Review, ReviewView, Visibility } from '../types';

export class MockApiError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

function nextId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function requireEmployee(id: string): Employee {
  const employee = getStore().employees.find((e) => e.id === id);
  if (!employee) throw new MockApiError('RESOURCE_NOT_FOUND', `No employee with id ${id}.`);
  return employee;
}

function findReviewOrThrow(reviewId: string): Review {
  const review = getStore().reviews.find((r) => r.id === reviewId);
  if (!review) throw new MockApiError('RESOURCE_NOT_FOUND', `No review with id ${reviewId}.`);
  return review;
}

export function searchEmployees(query: string): Employee[] {
  const q = query.trim().toLowerCase();
  if (!q) return getStore().employees;
  return getStore().employees.filter(
    (e) => e.name.toLowerCase().includes(q) || e.email.toLowerCase().includes(q),
  );
}

export function getEmployeeReviews(employeeId: string, requesterId: string): ReviewView[] {
  const requester = requireEmployee(requesterId);
  const reviews = getStore().reviews.filter((r) => r.receiverId === employeeId);
  return viewReviewsFor(reviews, requester);
}

export interface PostReviewInput {
  authorId: string;
  receiverId: string;
  rating: number;
  body: string;
  visibility: Visibility;
}

export function postReview(input: PostReviewInput): Review {
  if (input.authorId === input.receiverId) {
    throw new MockApiError('VALIDATION_ERROR', 'You cannot review yourself.');
  }
  if (input.rating < 1 || input.rating > 5) {
    throw new MockApiError('VALIDATION_ERROR', 'Rating must be between 1 and 5.');
  }
  if (!input.body.trim()) {
    throw new MockApiError('VALIDATION_ERROR', 'Review text is required.');
  }
  requireEmployee(input.authorId);
  requireEmployee(input.receiverId);

  const now = new Date().toISOString();
  const review: Review = {
    id: nextId('rev'),
    authorId: input.authorId,
    receiverId: input.receiverId,
    rating: input.rating,
    body: input.body.trim(),
    visibility: input.visibility,
    createdAt: now,
    updatedAt: now,
  };

  const store = getStore();
  setStore({
    ...store,
    reviews: [...store.reviews, review],
    notifications: [
      ...store.notifications,
      {
        id: nextId('notif'),
        userId: input.receiverId,
        type: 'review_received',
        message: 'You received a new review.',
        createdAt: now,
        read: false,
      },
    ],
  });
  return review;
}

export interface EditReviewInput {
  reviewId: string;
  requesterId: string;
  rating?: number;
  body?: string;
  visibility?: Visibility;
}

export function editReview(input: EditReviewInput): Review {
  const review = findReviewOrThrow(input.reviewId);
  if (review.authorId !== input.requesterId) {
    throw new MockApiError('FORBIDDEN', 'Only the author can edit this review.');
  }
  if (input.rating !== undefined && (input.rating < 1 || input.rating > 5)) {
    throw new MockApiError('VALIDATION_ERROR', 'Rating must be between 1 and 5.');
  }
  const updated: Review = {
    ...review,
    rating: input.rating ?? review.rating,
    body: input.body?.trim() ?? review.body,
    visibility: input.visibility ?? review.visibility,
    updatedAt: new Date().toISOString(),
  };
  const store = getStore();
  setStore({ ...store, reviews: store.reviews.map((r) => (r.id === updated.id ? updated : r)) });
  return updated;
}

export function deleteReview(reviewId: string, requesterId: string): void {
  const review = findReviewOrThrow(reviewId);
  if (review.authorId !== requesterId) {
    throw new MockApiError('FORBIDDEN', 'Only the author can delete this review.');
  }
  const store = getStore();
  setStore({
    ...store,
    reviews: store.reviews.filter((r) => r.id !== reviewId),
    replies: store.replies.filter((r) => r.reviewId !== reviewId),
    flags: store.flags.filter((f) => f.reviewId !== reviewId),
  });
}
```

- [ ] **Step 4: Run the tests again to verify they pass**

```bash
cd frontend && npx vitest run src/mockApi/mockApi.test.ts
```

Expected: PASS (9 tests).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/mockApi/mockApi.ts frontend/src/mockApi/mockApi.test.ts
git commit -m "$(cat <<'EOF'
Add mock API: employee search and review CRUD

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: Mock API — replies, flags, admin actions, notifications

**Files:**
- Modify: `frontend/src/mockApi/mockApi.ts`
- Modify: `frontend/src/mockApi/mockApi.test.ts`

**Interfaces:**
- Consumes: everything from Task 4's `mockApi.ts` (same file); `isAdminRole` from `./visibility`; `ReviewReply`, `ReviewFlag`, `NotificationItem` from `../types`
- Produces: `replyToReview(reviewId: string, authorId: string, body: string): ReviewReply`; `getReplyForReview(reviewId: string): ReviewReply | undefined`; `flagReview(reviewId: string, flaggedBy: string, reason: string): ReviewFlag`; interface `OpenFlagView { flag: ReviewFlag; review: Review }`; `listOpenFlags(requesterId: string): OpenFlagView[]`; `resolveFlag(flagId: string, requesterId: string, deleteReviewToo: boolean): void`; `getNotifications(userId: string): NotificationItem[]`

- [ ] **Step 1: Write the failing tests**

Append to `frontend/src/mockApi/mockApi.test.ts` (add these names to the existing import from `'./mockApi'`, and add these new `describe` blocks at the end of the file):

```ts
// Add to the existing import from './mockApi':
//   replyToReview, getReplyForReview, flagReview, listOpenFlags, resolveFlag, getNotifications

describe('replyToReview', () => {
  it('lets the receiver reply exactly once', () => {
    const review = postReview({
      authorId: 'emp-2',
      receiverId: 'emp-3',
      rating: 4,
      body: 'Nice work.',
      visibility: 'public',
    });
    const reply = replyToReview(review.id, 'emp-3', 'Thanks!');
    expect(reply.body).toBe('Thanks!');
    expect(getReplyForReview(review.id)?.body).toBe('Thanks!');

    expect(() => replyToReview(review.id, 'emp-3', 'Again?')).toThrow(MockApiError);
  });

  it('rejects a reply from anyone other than the receiver', () => {
    const review = postReview({
      authorId: 'emp-2',
      receiverId: 'emp-3',
      rating: 4,
      body: 'Nice work.',
      visibility: 'public',
    });
    expect(() => replyToReview(review.id, 'emp-4', 'Not mine to reply to.')).toThrow(MockApiError);
  });
});

describe('flagReview and admin moderation', () => {
  it('lists an open flag for an admin and rejects a non-admin', () => {
    const review = postReview({
      authorId: 'emp-2',
      receiverId: 'emp-3',
      rating: 1,
      body: 'Unfair comment.',
      visibility: 'public',
    });
    flagReview(review.id, 'emp-3', 'This seems unfair.');

    const openFlags = listOpenFlags('emp-5'); // emp-5 is admin
    expect(openFlags).toHaveLength(1);
    expect(openFlags[0].review.id).toBe(review.id);

    expect(() => listOpenFlags('emp-2')).toThrow(MockApiError);
  });

  it('resolves a flag and optionally deletes the underlying review', () => {
    const review = postReview({
      authorId: 'emp-2',
      receiverId: 'emp-3',
      rating: 1,
      body: 'Unfair comment.',
      visibility: 'public',
    });
    const flag = flagReview(review.id, 'emp-3', 'This seems unfair.');

    resolveFlag(flag.id, 'emp-5', true);

    expect(listOpenFlags('emp-5')).toHaveLength(0);
    expect(getEmployeeReviews('emp-3', 'emp-5')).toHaveLength(0);
  });
});

describe('getNotifications', () => {
  it('records a notification when a review is received', () => {
    postReview({ authorId: 'emp-2', receiverId: 'emp-3', rating: 5, body: 'Great job.', visibility: 'public' });
    const notifications = getNotifications('emp-3');
    expect(notifications).toHaveLength(1);
    expect(notifications[0].type).toBe('review_received');
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

```bash
cd frontend && npx vitest run src/mockApi/mockApi.test.ts
```

Expected: FAIL (the new imports don't exist yet).

- [ ] **Step 3: Implement replies, flags, admin actions, and notifications**

Append to `frontend/src/mockApi/mockApi.ts` (add `isAdminRole` and `ReviewReply`, `ReviewFlag`, `NotificationItem` to the existing imports at the top of the file):

```ts
// Update the top of the file:
// import { getStore, setStore } from './store';
// import { isAdminRole, viewReviewsFor } from './visibility';
// import type { Employee, Review, ReviewReply, ReviewFlag, ReviewView, NotificationItem, Visibility } from '../types';

export function replyToReview(reviewId: string, authorId: string, body: string): ReviewReply {
  const review = findReviewOrThrow(reviewId);
  if (review.receiverId !== authorId) {
    throw new MockApiError('FORBIDDEN', 'Only the review recipient can reply.');
  }
  const store = getStore();
  if (store.replies.some((r) => r.reviewId === reviewId)) {
    throw new MockApiError('VALIDATION_ERROR', 'This review already has a reply.');
  }
  if (!body.trim()) {
    throw new MockApiError('VALIDATION_ERROR', 'Reply text is required.');
  }
  const now = new Date().toISOString();
  const reply: ReviewReply = { id: nextId('reply'), reviewId, authorId, body: body.trim(), createdAt: now };
  setStore({
    ...store,
    replies: [...store.replies, reply],
    notifications: [
      ...store.notifications,
      {
        id: nextId('notif'),
        userId: review.authorId,
        type: 'reply_received',
        message: 'Someone replied to your review.',
        createdAt: now,
        read: false,
      },
    ],
  });
  return reply;
}

export function getReplyForReview(reviewId: string): ReviewReply | undefined {
  return getStore().replies.find((r) => r.reviewId === reviewId);
}

export function flagReview(reviewId: string, flaggedBy: string, reason: string): ReviewFlag {
  findReviewOrThrow(reviewId);
  if (!reason.trim()) {
    throw new MockApiError('VALIDATION_ERROR', 'A reason is required to flag a review.');
  }
  const flag: ReviewFlag = {
    id: nextId('flag'),
    reviewId,
    flaggedBy,
    reason: reason.trim(),
    status: 'open',
    createdAt: new Date().toISOString(),
  };
  const store = getStore();
  setStore({ ...store, flags: [...store.flags, flag] });
  return flag;
}

function requireAdmin(requesterId: string): Employee {
  const requester = requireEmployee(requesterId);
  if (!isAdminRole(requester.role)) {
    throw new MockApiError('FORBIDDEN', 'Admin or HR role is required.');
  }
  return requester;
}

export interface OpenFlagView {
  flag: ReviewFlag;
  review: Review;
}

export function listOpenFlags(requesterId: string): OpenFlagView[] {
  requireAdmin(requesterId);
  const store = getStore();
  return store.flags
    .filter((f) => f.status === 'open')
    .map((flag) => ({ flag, review: store.reviews.find((r) => r.id === flag.reviewId) }))
    .filter((entry): entry is OpenFlagView => entry.review !== undefined);
}

export function resolveFlag(flagId: string, requesterId: string, deleteReviewToo: boolean): void {
  requireAdmin(requesterId);
  const store = getStore();
  const flag = store.flags.find((f) => f.id === flagId);
  if (!flag) throw new MockApiError('RESOURCE_NOT_FOUND', `No flag with id ${flagId}.`);

  const notifications = [
    ...store.notifications,
    {
      id: nextId('notif'),
      userId: flag.flaggedBy,
      type: 'flag_resolved' as const,
      message: 'Your flag was resolved.',
      createdAt: new Date().toISOString(),
      read: false,
    },
  ];

  setStore({
    ...store,
    flags: store.flags.map((f) => (f.id === flagId ? { ...f, status: 'resolved' as const } : f)),
    reviews: deleteReviewToo ? store.reviews.filter((r) => r.id !== flag.reviewId) : store.reviews,
    notifications,
  });
}

export function getNotifications(userId: string): NotificationItem[] {
  return getStore()
    .notifications.filter((n) => n.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
```

Also update `getEmployeeReviews`'s import line usage: it already imports `viewReviewsFor`; just add `isAdminRole` alongside it as shown in the comment above.

- [ ] **Step 4: Run the tests again to verify they pass**

```bash
cd frontend && npx vitest run src/mockApi/mockApi.test.ts
```

Expected: PASS (14 tests).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/mockApi/mockApi.ts frontend/src/mockApi/mockApi.test.ts
git commit -m "$(cat <<'EOF'
Add mock API: replies, flags, admin moderation, notifications

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: Dev-only current-user context and switcher

**Files:**
- Create: `frontend/src/context/CurrentUserContext.tsx`
- Create: `frontend/src/components/UserSwitcher.tsx`
- Test: `frontend/src/context/CurrentUserContext.test.tsx`

**Interfaces:**
- Consumes: `seedEmployees` from `../mockApi/seed`; `Employee` from `../types`
- Produces: `CurrentUserProvider` (component), `useCurrentUser(): { currentUser: Employee; allUsers: Employee[]; setCurrentUserId: (id: string) => void }`, `UserSwitcher` (component, reads `useCurrentUser`)

- [ ] **Step 1: Write the failing test**

Create `frontend/src/context/CurrentUserContext.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CurrentUserProvider, useCurrentUser } from './CurrentUserContext';
import { UserSwitcher } from '../components/UserSwitcher';

function CurrentUserProbe() {
  const { currentUser } = useCurrentUser();
  return <div data-testid="current-user-name">{currentUser.name}</div>;
}

describe('CurrentUserProvider + UserSwitcher', () => {
  it('defaults to the first seeded employee and switches on selection', async () => {
    const user = userEvent.setup();
    render(
      <CurrentUserProvider>
        <UserSwitcher />
        <CurrentUserProbe />
      </CurrentUserProvider>,
    );

    expect(screen.getByTestId('current-user-name')).toHaveTextContent('Alice Nguyen');

    await user.selectOptions(screen.getByLabelText('Viewing as'), 'emp-5');
    expect(screen.getByTestId('current-user-name')).toHaveTextContent('Erika Flores');
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

```bash
cd frontend && npx vitest run src/context/CurrentUserContext.test.tsx
```

Expected: FAIL (neither file exists yet).

- [ ] **Step 3: Implement the context**

Create `frontend/src/context/CurrentUserContext.tsx`:

```tsx
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { Employee } from '../types';
import { seedEmployees } from '../mockApi/seed';

interface CurrentUserContextValue {
  currentUser: Employee;
  allUsers: Employee[];
  setCurrentUserId: (id: string) => void;
}

const CurrentUserContext = createContext<CurrentUserContextValue | undefined>(undefined);

export function CurrentUserProvider({ children }: { children: ReactNode }) {
  const [currentUserId, setCurrentUserId] = useState(seedEmployees[0].id);

  const value = useMemo<CurrentUserContextValue>(() => {
    const currentUser = seedEmployees.find((e) => e.id === currentUserId) ?? seedEmployees[0];
    return { currentUser, allUsers: seedEmployees, setCurrentUserId };
  }, [currentUserId]);

  return <CurrentUserContext.Provider value={value}>{children}</CurrentUserContext.Provider>;
}

export function useCurrentUser(): CurrentUserContextValue {
  const ctx = useContext(CurrentUserContext);
  if (!ctx) throw new Error('useCurrentUser must be used within a CurrentUserProvider');
  return ctx;
}
```

- [ ] **Step 4: Implement the switcher**

Create `frontend/src/components/UserSwitcher.tsx`:

```tsx
import { useCurrentUser } from '../context/CurrentUserContext';

export function UserSwitcher() {
  const { currentUser, allUsers, setCurrentUserId } = useCurrentUser();

  return (
    <div data-testid="user-switcher">
      <label htmlFor="mock-user-select">Viewing as</label>
      <select
        id="mock-user-select"
        value={currentUser.id}
        onChange={(e) => setCurrentUserId(e.target.value)}
      >
        {allUsers.map((user) => (
          <option key={user.id} value={user.id}>
            {user.name} ({user.role})
          </option>
        ))}
      </select>
    </div>
  );
}
```

- [ ] **Step 5: Run the test again to verify it passes**

```bash
cd frontend && npx vitest run src/context/CurrentUserContext.test.tsx
```

Expected: PASS (1 test).

- [ ] **Step 6: Commit**

```bash
git add frontend/src/context/CurrentUserContext.tsx frontend/src/context/CurrentUserContext.test.tsx frontend/src/components/UserSwitcher.tsx
git commit -m "$(cat <<'EOF'
Add dev-only current-user context and switcher

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 7: App shell and routing

**Files:**
- Modify: `frontend/src/App.tsx` (replace the generated template content)
- Modify: `frontend/src/main.tsx` (replace the generated template content)
- Test: `frontend/src/App.test.tsx`

**Interfaces:**
- Consumes: `useCurrentUser` from `./context/CurrentUserContext`; `UserSwitcher` from `./components/UserSwitcher`; `isAdminRole` from `./mockApi/visibility`; `CurrentUserProvider` from `./context/CurrentUserContext`
- Produces: `App` (component, exported, renders nav + routed pages); route paths `/`, `/employees/:employeeId`, `/admin/flags` (pages for these are created in later tasks — this task renders placeholder text for them so the shell is testable now, and Tasks 8, 10, 11 replace the placeholders)

- [ ] **Step 1: Write the failing test**

Create `frontend/src/App.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { App } from './App';
import { CurrentUserProvider } from './context/CurrentUserContext';

function renderApp() {
  return render(
    <MemoryRouter>
      <CurrentUserProvider>
        <App />
      </CurrentUserProvider>
    </MemoryRouter>,
  );
}

describe('App shell', () => {
  it('hides the admin flags link for a non-admin user', () => {
    renderApp();
    expect(screen.queryByText('Admin: Flags')).not.toBeInTheDocument();
  });

  it('shows the admin flags link once switched to an admin user', async () => {
    const user = userEvent.setup();
    renderApp();
    await user.selectOptions(screen.getByLabelText('Viewing as'), 'emp-5');
    expect(screen.getByText('Admin: Flags')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

```bash
cd frontend && npx vitest run src/App.test.tsx
```

Expected: FAIL (`App` doesn't export a named component with this shape yet — the Vite template's default `App` is a plain counter demo).

- [ ] **Step 3: Implement the app shell**

Replace the contents of `frontend/src/App.tsx`:

```tsx
import { NavLink, Route, Routes } from 'react-router-dom';
import { useCurrentUser } from './context/CurrentUserContext';
import { UserSwitcher } from './components/UserSwitcher';
import { isAdminRole } from './mockApi/visibility';

function DirectoryPlaceholder() {
  return <p>Directory coming in a later task.</p>;
}

function EmployeeProfilePlaceholder() {
  return <p>Employee profile coming in a later task.</p>;
}

function AdminFlagsPlaceholder() {
  return <p>Admin flags coming in a later task.</p>;
}

export function App() {
  const { currentUser } = useCurrentUser();

  return (
    <div>
      <header>
        <nav>
          <NavLink to="/">Directory</NavLink>
          {isAdminRole(currentUser.role) && <NavLink to="/admin/flags">Admin: Flags</NavLink>}
        </nav>
        <UserSwitcher />
      </header>
      <main>
        <Routes>
          <Route path="/" element={<DirectoryPlaceholder />} />
          <Route path="/employees/:employeeId" element={<EmployeeProfilePlaceholder />} />
          <Route path="/admin/flags" element={<AdminFlagsPlaceholder />} />
        </Routes>
      </main>
    </div>
  );
}
```

Replace the contents of `frontend/src/main.tsx`:

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
import { CurrentUserProvider } from './context/CurrentUserContext';
import './index.css';

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <BrowserRouter>
      <CurrentUserProvider>
        <App />
      </CurrentUserProvider>
    </BrowserRouter>
  </StrictMode>,
);
```

Delete `frontend/src/App.css` content you don't need (leave the file empty or remove the import from `App.tsx` — the shell above no longer imports it).

- [ ] **Step 4: Run the test again to verify it passes**

```bash
cd frontend && npx vitest run src/App.test.tsx
```

Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/App.tsx frontend/src/main.tsx frontend/src/App.test.tsx
git commit -m "$(cat <<'EOF'
Add app shell with role-gated navigation and routing

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 8: Directory page (search employees)

**Files:**
- Create: `frontend/src/pages/DirectoryPage.tsx`
- Modify: `frontend/src/App.tsx` (swap `DirectoryPlaceholder` for `DirectoryPage`)
- Test: `frontend/src/pages/DirectoryPage.test.tsx`

**Interfaces:**
- Consumes: `searchEmployees` from `../mockApi/mockApi`; `Link` from `react-router-dom`
- Produces: `DirectoryPage` (component)

- [ ] **Step 1: Write the failing test**

Create `frontend/src/pages/DirectoryPage.test.tsx`:

```tsx
import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { DirectoryPage } from './DirectoryPage';
import { resetStore } from '../mockApi/store';

describe('DirectoryPage', () => {
  beforeEach(() => {
    localStorage.clear();
    resetStore();
  });

  it('lists every seeded employee by default and filters as you type', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <DirectoryPage />
      </MemoryRouter>,
    );

    expect(screen.getAllByRole('listitem')).toHaveLength(5);

    await user.type(screen.getByLabelText('Search employees'), 'erika');
    expect(screen.getAllByRole('listitem')).toHaveLength(1);
    expect(screen.getByText('Erika Flores')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

```bash
cd frontend && npx vitest run src/pages/DirectoryPage.test.tsx
```

Expected: FAIL (`DirectoryPage.tsx` does not exist yet).

- [ ] **Step 3: Implement the page**

Create `frontend/src/pages/DirectoryPage.tsx`:

```tsx
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { searchEmployees } from '../mockApi/mockApi';

export function DirectoryPage() {
  const [query, setQuery] = useState('');
  const results = useMemo(() => searchEmployees(query), [query]);

  return (
    <div>
      <h1>Find a coworker</h1>
      <input
        aria-label="Search employees"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by name or email"
      />
      <ul>
        {results.map((employee) => (
          <li key={employee.id}>
            <Link to={`/employees/${employee.id}`}>{employee.name}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 4: Wire it into the app shell**

In `frontend/src/App.tsx`, remove the `DirectoryPlaceholder` function entirely, add `import { DirectoryPage } from './pages/DirectoryPage';` at the top, and change `<Route path="/" element={<DirectoryPlaceholder />} />` to `<Route path="/" element={<DirectoryPage />} />`.

- [ ] **Step 5: Run the test again to verify it passes**

```bash
cd frontend && npx vitest run src/pages/DirectoryPage.test.tsx
```

Expected: PASS (1 test).

- [ ] **Step 6: Run the full suite to confirm nothing else broke**

```bash
cd frontend && npm test
```

Expected: all tests PASS.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/pages/DirectoryPage.tsx frontend/src/pages/DirectoryPage.test.tsx frontend/src/App.tsx
git commit -m "$(cat <<'EOF'
Add employee directory search page

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 9: ReviewCard and ReviewForm components (with edit support)

**Files:**
- Create: `frontend/src/components/ReviewForm.tsx`
- Create: `frontend/src/components/ReviewCard.tsx`
- Test: `frontend/src/components/ReviewForm.test.tsx`
- Test: `frontend/src/components/ReviewCard.test.tsx`

**Interfaces:**
- Consumes: `ReviewView`, `ReviewReply`, `Visibility` from `../types`; `ReviewForm` (used inside `ReviewCard` for its inline edit mode)
- Produces: `ReviewForm` (props: `onSubmit: (input: { rating: number; body: string; visibility: Visibility }) => void`, `error?: string`, `initial?: { rating: number; body: string; visibility: Visibility }`, `submitLabel?: string`); `ReviewCard` (props: `review: ReviewView`, `authorName: string | null`, `reply?: ReviewReply`, `onFlag: (reason: string) => void`, `canManage?: boolean`, `onEdit?: (input: { rating: number; body: string; visibility: Visibility }) => void`, `onDelete?: () => void`, `children?: ReactNode`)

- [ ] **Step 1: Write the failing ReviewForm test**

Create `frontend/src/components/ReviewForm.test.tsx`:

```tsx
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReviewForm } from './ReviewForm';

describe('ReviewForm', () => {
  it('submits the entered rating, body and visibility, then clears the body', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<ReviewForm onSubmit={onSubmit} />);

    await user.selectOptions(screen.getByLabelText('Rating'), '3');
    await user.type(screen.getByLabelText('Review'), 'Great teammate.');
    await user.selectOptions(screen.getByLabelText('Visibility'), 'anonymous');
    await user.click(screen.getByRole('button', { name: 'Post review' }));

    expect(onSubmit).toHaveBeenCalledWith({ rating: 3, body: 'Great teammate.', visibility: 'anonymous' });
    expect(screen.getByLabelText('Review')).toHaveValue('');
  });

  it('shows a validation error when provided', () => {
    render(<ReviewForm onSubmit={vi.fn()} error="You cannot review yourself." />);
    expect(screen.getByRole('alert')).toHaveTextContent('You cannot review yourself.');
  });

  it('pre-fills from `initial` and uses a custom submit label', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <ReviewForm
        onSubmit={onSubmit}
        initial={{ rating: 2, body: 'Original text.', visibility: 'anonymous' }}
        submitLabel="Save changes"
      />,
    );

    expect(screen.getByLabelText('Rating')).toHaveValue('2');
    expect(screen.getByLabelText('Review')).toHaveValue('Original text.');
    expect(screen.getByLabelText('Visibility')).toHaveValue('anonymous');

    await user.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(onSubmit).toHaveBeenCalledWith({ rating: 2, body: 'Original text.', visibility: 'anonymous' });
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

```bash
cd frontend && npx vitest run src/components/ReviewForm.test.tsx
```

Expected: FAIL (`ReviewForm.tsx` does not exist yet).

- [ ] **Step 3: Implement ReviewForm**

Create `frontend/src/components/ReviewForm.tsx`:

```tsx
import { useState, type FormEvent } from 'react';
import type { Visibility } from '../types';

interface ReviewFormProps {
  onSubmit: (input: { rating: number; body: string; visibility: Visibility }) => void;
  error?: string;
  initial?: { rating: number; body: string; visibility: Visibility };
  submitLabel?: string;
}

export function ReviewForm({ onSubmit, error, initial, submitLabel = 'Post review' }: ReviewFormProps) {
  const [rating, setRating] = useState(initial?.rating ?? 5);
  const [body, setBody] = useState(initial?.body ?? '');
  const [visibility, setVisibility] = useState<Visibility>(initial?.visibility ?? 'public');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSubmit({ rating, body, visibility });
    if (!initial) setBody('');
  }

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="review-rating">Rating</label>
      <select id="review-rating" value={rating} onChange={(e) => setRating(Number(e.target.value))}>
        {[1, 2, 3, 4, 5].map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>

      <label htmlFor="review-body">Review</label>
      <textarea id="review-body" value={body} onChange={(e) => setBody(e.target.value)} />

      <label htmlFor="review-visibility">Visibility</label>
      <select
        id="review-visibility"
        value={visibility}
        onChange={(e) => setVisibility(e.target.value as Visibility)}
      >
        <option value="public">Public</option>
        <option value="anonymous">Anonymous</option>
      </select>

      {error && <p role="alert">{error}</p>}
      <button type="submit">{submitLabel}</button>
    </form>
  );
}
```

- [ ] **Step 4: Run the ReviewForm test again to verify it passes**

```bash
cd frontend && npx vitest run src/components/ReviewForm.test.tsx
```

Expected: PASS (3 tests).

- [ ] **Step 5: Write the failing ReviewCard test**

Create `frontend/src/components/ReviewCard.test.tsx`:

```tsx
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReviewCard } from './ReviewCard';
import type { ReviewView } from '../types';

const baseReview: ReviewView = {
  id: 'rev-1',
  authorId: 'emp-2',
  receiverId: 'emp-1',
  rating: 4,
  body: 'Solid work this sprint.',
  visibility: 'public',
  createdAt: '2026-09-01T09:00:00.000Z',
  updatedAt: '2026-09-01T09:00:00.000Z',
};

describe('ReviewCard', () => {
  it('shows the author name for a public review', () => {
    render(<ReviewCard review={baseReview} authorName="Bob Santos" onFlag={vi.fn()} />);
    expect(screen.getByText('— Bob Santos')).toBeInTheDocument();
  });

  it('shows "Anonymous" with no name when authorName is null', () => {
    render(
      <ReviewCard
        review={{ ...baseReview, visibility: 'anonymous', authorId: null }}
        authorName={null}
        onFlag={vi.fn()}
      />,
    );
    expect(screen.getByText('Anonymous')).toBeInTheDocument();
  });

  it('reveals the author name for an anonymous review when one is provided', () => {
    render(
      <ReviewCard
        review={{ ...baseReview, visibility: 'anonymous', authorId: 'emp-2' }}
        authorName="Bob Santos"
        onFlag={vi.fn()}
      />,
    );
    expect(screen.getByText('Anonymous (author visible to you: Bob Santos)')).toBeInTheDocument();
  });

  it('collects a reason and calls onFlag when submitted', async () => {
    const user = userEvent.setup();
    const onFlag = vi.fn();
    render(<ReviewCard review={baseReview} authorName="Bob Santos" onFlag={onFlag} />);

    await user.click(screen.getByRole('button', { name: 'Flag' }));
    await user.type(screen.getByLabelText('Reason for flagging'), 'Inappropriate language');
    await user.click(screen.getByRole('button', { name: 'Submit flag' }));

    expect(onFlag).toHaveBeenCalledWith('Inappropriate language');
  });

  it('hides Edit/Delete when canManage is not set', () => {
    render(<ReviewCard review={baseReview} authorName="Bob Santos" onFlag={vi.fn()} />);
    expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument();
  });

  it('lets the owner delete their review', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    render(
      <ReviewCard review={baseReview} authorName="Bob Santos" onFlag={vi.fn()} canManage onDelete={onDelete} />,
    );
    await user.click(screen.getByRole('button', { name: 'Delete' }));
    expect(onDelete).toHaveBeenCalled();
  });

  it('lets the owner edit their review inline and calls onEdit with the updated fields', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    render(
      <ReviewCard review={baseReview} authorName="Bob Santos" onFlag={vi.fn()} canManage onEdit={onEdit} />,
    );

    await user.click(screen.getByRole('button', { name: 'Edit' }));
    const bodyField = screen.getByLabelText('Review');
    await user.clear(bodyField);
    await user.type(bodyField, 'Updated text.');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(onEdit).toHaveBeenCalledWith({ rating: 4, body: 'Updated text.', visibility: 'public' });
  });
});
```

- [ ] **Step 6: Run it to verify it fails**

```bash
cd frontend && npx vitest run src/components/ReviewCard.test.tsx
```

Expected: FAIL (`ReviewCard.tsx` does not exist yet).

- [ ] **Step 7: Implement ReviewCard**

Create `frontend/src/components/ReviewCard.tsx`:

```tsx
import { useState, type ReactNode } from 'react';
import type { ReviewView, ReviewReply, Visibility } from '../types';
import { ReviewForm } from './ReviewForm';

interface ReviewCardProps {
  review: ReviewView;
  authorName: string | null;
  reply?: ReviewReply;
  onFlag: (reason: string) => void;
  canManage?: boolean;
  onEdit?: (input: { rating: number; body: string; visibility: Visibility }) => void;
  onDelete?: () => void;
  children?: ReactNode;
}

export function ReviewCard({
  review,
  authorName,
  reply,
  onFlag,
  canManage,
  onEdit,
  onDelete,
  children,
}: ReviewCardProps) {
  const [flagging, setFlagging] = useState(false);
  const [reason, setReason] = useState('');
  const [editing, setEditing] = useState(false);

  function submitFlag() {
    if (!reason.trim()) return;
    onFlag(reason.trim());
    setReason('');
    setFlagging(false);
  }

  if (editing && onEdit) {
    return (
      <article data-testid={`review-${review.id}`}>
        <ReviewForm
          initial={{ rating: review.rating, body: review.body, visibility: review.visibility }}
          submitLabel="Save changes"
          onSubmit={(input) => {
            onEdit(input);
            setEditing(false);
          }}
        />
        <button type="button" onClick={() => setEditing(false)}>
          Cancel
        </button>
      </article>
    );
  }

  return (
    <article data-testid={`review-${review.id}`}>
      <p>
        {'★'.repeat(review.rating)}
        {'☆'.repeat(5 - review.rating)}
      </p>
      <p>{review.body}</p>
      <p>
        {review.visibility === 'anonymous'
          ? authorName
            ? `Anonymous (author visible to you: ${authorName})`
            : 'Anonymous'
          : `— ${authorName ?? 'Unknown'}`}
      </p>

      {canManage && (
        <div>
          <button type="button" onClick={() => setEditing(true)}>
            Edit
          </button>
          <button type="button" onClick={onDelete}>
            Delete
          </button>
        </div>
      )}

      {flagging ? (
        <div>
          <label htmlFor={`flag-reason-${review.id}`}>Reason for flagging</label>
          <input id={`flag-reason-${review.id}`} value={reason} onChange={(e) => setReason(e.target.value)} />
          <button type="button" onClick={submitFlag}>
            Submit flag
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => setFlagging(true)}>
          Flag
        </button>
      )}

      {reply && <blockquote data-testid={`reply-${review.id}`}>{reply.body}</blockquote>}
      {children}
    </article>
  );
}
```

- [ ] **Step 8: Run the ReviewCard test again to verify it passes**

```bash
cd frontend && npx vitest run src/components/ReviewCard.test.tsx
```

Expected: PASS (7 tests).

- [ ] **Step 9: Commit**

```bash
git add frontend/src/components/ReviewCard.tsx frontend/src/components/ReviewCard.test.tsx frontend/src/components/ReviewForm.tsx frontend/src/components/ReviewForm.test.tsx
git commit -m "$(cat <<'EOF'
Add ReviewCard (with inline edit) and ReviewForm components

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 10: ReplyForm and the employee profile page (post, edit, delete, reply, flag)

**Files:**
- Create: `frontend/src/components/ReplyForm.tsx`
- Create: `frontend/src/pages/EmployeeProfilePage.tsx`
- Modify: `frontend/src/App.tsx` (swap `EmployeeProfilePlaceholder` for `EmployeeProfilePage`)
- Test: `frontend/src/components/ReplyForm.test.tsx`
- Test: `frontend/src/pages/EmployeeProfilePage.test.tsx`

**Interfaces:**
- Consumes: `useCurrentUser` from `../context/CurrentUserContext`; `getEmployeeReviews`, `getReplyForReview`, `postReview`, `editReview`, `deleteReview`, `flagReview`, `replyToReview`, `MockApiError` from `../mockApi/mockApi`; `ReviewCard` from `../components/ReviewCard`; `ReviewForm` from `../components/ReviewForm`; `ReplyForm` from `../components/ReplyForm`; `useParams` from `react-router-dom`
- Produces: `ReplyForm` (props: `onSubmit: (body: string) => void`); `EmployeeProfilePage` (component, route `/employees/:employeeId`)

- [ ] **Step 1: Write the failing ReplyForm test**

Create `frontend/src/components/ReplyForm.test.tsx`:

```tsx
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReplyForm } from './ReplyForm';

describe('ReplyForm', () => {
  it('submits the entered reply text and clears the field', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<ReplyForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText('Reply'), 'Thanks for the feedback!');
    await user.click(screen.getByRole('button', { name: 'Post reply' }));

    expect(onSubmit).toHaveBeenCalledWith('Thanks for the feedback!');
    expect(screen.getByLabelText('Reply')).toHaveValue('');
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

```bash
cd frontend && npx vitest run src/components/ReplyForm.test.tsx
```

Expected: FAIL (`ReplyForm.tsx` does not exist yet).

- [ ] **Step 3: Implement ReplyForm**

Create `frontend/src/components/ReplyForm.tsx`:

```tsx
import { useState, type FormEvent } from 'react';

interface ReplyFormProps {
  onSubmit: (body: string) => void;
}

export function ReplyForm({ onSubmit }: ReplyFormProps) {
  const [body, setBody] = useState('');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    onSubmit(body.trim());
    setBody('');
  }

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="reply-body">Reply</label>
      <textarea id="reply-body" value={body} onChange={(e) => setBody(e.target.value)} />
      <button type="submit">Post reply</button>
    </form>
  );
}
```

- [ ] **Step 4: Run the ReplyForm test again to verify it passes**

```bash
cd frontend && npx vitest run src/components/ReplyForm.test.tsx
```

Expected: PASS (1 test).

- [ ] **Step 5: Write the failing EmployeeProfilePage tests**

Create `frontend/src/pages/EmployeeProfilePage.test.tsx`:

```tsx
import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { EmployeeProfilePage } from './EmployeeProfilePage';
import { CurrentUserProvider } from '../context/CurrentUserContext';
import { UserSwitcher } from '../components/UserSwitcher';
import { resetStore } from '../mockApi/store';

function renderProfile(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <CurrentUserProvider>
        <UserSwitcher />
        <Routes>
          <Route path="/employees/:employeeId" element={<EmployeeProfilePage />} />
        </Routes>
      </CurrentUserProvider>
    </MemoryRouter>,
  );
}

describe('EmployeeProfilePage', () => {
  beforeEach(() => {
    localStorage.clear();
    resetStore();
  });

  it('lets the signed-in viewer (default emp-1) post a public review for someone else', async () => {
    const user = userEvent.setup();
    renderProfile('/employees/emp-2');

    await user.type(screen.getByLabelText('Review'), 'Great to work with.');
    await user.click(screen.getByRole('button', { name: 'Post review' }));

    expect(screen.getByText('Great to work with.')).toBeInTheDocument();
  });

  it('hides the review form and shows a message when viewing your own profile', () => {
    renderProfile('/employees/emp-1');
    expect(screen.getByText('You cannot review yourself.')).toBeInTheDocument();
    expect(screen.queryByLabelText('Review')).not.toBeInTheDocument();
  });

  it('hides an anonymous review author from an unrelated employee but reveals it to admin', async () => {
    const user = userEvent.setup();
    renderProfile('/employees/emp-1');

    // default viewer is emp-1 (Alice), the receiver: sees it as Anonymous
    expect(screen.getByText('Anonymous')).toBeInTheDocument();

    // switch to an unrelated employee (Bob, emp-2): the anonymous review is not shown at all
    await user.selectOptions(screen.getByLabelText('Viewing as'), 'emp-2');
    expect(screen.queryByText('Communication could be clearer during handoffs.')).not.toBeInTheDocument();

    // switch to admin (Erika, emp-5): sees it with the author revealed
    await user.selectOptions(screen.getByLabelText('Viewing as'), 'emp-5');
    expect(screen.getByText('Anonymous (author visible to you: Carla Cruz)')).toBeInTheDocument();
  });

  it('shows a reply form only under the receiver-visible review, and the reply once posted', async () => {
    const user = userEvent.setup();
    renderProfile('/employees/emp-1');

    const publicReviewCard = within(screen.getByTestId('review-rev-1'));
    await user.type(publicReviewCard.getByLabelText('Reply'), 'Appreciate it!');
    await user.click(publicReviewCard.getByRole('button', { name: 'Post reply' }));

    expect(publicReviewCard.getByText('Appreciate it!')).toBeInTheDocument();
  });

  it('lets the author edit their own review from the receiver profile page', async () => {
    const user = userEvent.setup();
    renderProfile('/employees/emp-2');

    await user.type(screen.getByLabelText('Review'), 'First draft.');
    await user.click(screen.getByRole('button', { name: 'Post review' }));

    const card = within(screen.getByText('First draft.').closest('article') as HTMLElement);
    await user.click(card.getByRole('button', { name: 'Edit' }));
    const bodyField = card.getByLabelText('Review');
    await user.clear(bodyField);
    await user.type(bodyField, 'Revised review.');
    await user.click(card.getByRole('button', { name: 'Save changes' }));

    expect(screen.getByText('Revised review.')).toBeInTheDocument();
    expect(screen.queryByText('First draft.')).not.toBeInTheDocument();
  });

  it('lets the author delete their own review from the receiver profile page', async () => {
    const user = userEvent.setup();
    renderProfile('/employees/emp-2');

    await user.type(screen.getByLabelText('Review'), 'Temporary review.');
    await user.click(screen.getByRole('button', { name: 'Post review' }));

    const card = within(screen.getByText('Temporary review.').closest('article') as HTMLElement);
    await user.click(card.getByRole('button', { name: 'Delete' }));

    expect(screen.queryByText('Temporary review.')).not.toBeInTheDocument();
  });

  it('lets the author see and manage their own anonymous review even though they are not the receiver', async () => {
    const user = userEvent.setup();
    renderProfile('/employees/emp-2');

    await user.selectOptions(screen.getByLabelText('Visibility'), 'anonymous');
    await user.type(screen.getByLabelText('Review'), 'Anonymous feedback for Bob.');
    await user.click(screen.getByRole('button', { name: 'Post review' }));

    const card = within(screen.getByText('Anonymous feedback for Bob.').closest('article') as HTMLElement);
    expect(card.getByText(/Anonymous \(author visible to you: /)).toBeInTheDocument();
    expect(card.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
  });
});
```

- [ ] **Step 6: Run it to verify it fails**

```bash
cd frontend && npx vitest run src/pages/EmployeeProfilePage.test.tsx
```

Expected: FAIL (`EmployeeProfilePage.tsx` does not exist yet).

- [ ] **Step 7: Implement EmployeeProfilePage**

Create `frontend/src/pages/EmployeeProfilePage.tsx`:

```tsx
import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useCurrentUser } from '../context/CurrentUserContext';
import {
  getEmployeeReviews,
  getReplyForReview,
  postReview,
  editReview,
  deleteReview,
  flagReview,
  replyToReview,
  MockApiError,
} from '../mockApi/mockApi';
import { ReviewCard } from '../components/ReviewCard';
import { ReviewForm } from '../components/ReviewForm';
import { ReplyForm } from '../components/ReplyForm';
import type { Visibility } from '../types';

export function EmployeeProfilePage() {
  const { employeeId = '' } = useParams();
  const { currentUser, allUsers } = useCurrentUser();
  const [error, setError] = useState<string | undefined>(undefined);
  const [version, setVersion] = useState(0);

  const employee = allUsers.find((e) => e.id === employeeId);
  const reviews = useMemo(
    () => getEmployeeReviews(employeeId, currentUser.id),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [employeeId, currentUser.id, version],
  );

  function refresh() {
    setVersion((v) => v + 1);
  }

  function handlePostReview(input: { rating: number; body: string; visibility: Visibility }) {
    setError(undefined);
    try {
      postReview({ authorId: currentUser.id, receiverId: employeeId, ...input });
      refresh();
    } catch (e) {
      setError(e instanceof MockApiError ? e.message : 'Could not post review.');
    }
  }

  function handleEditReview(reviewId: string, input: { rating: number; body: string; visibility: Visibility }) {
    editReview({ reviewId, requesterId: currentUser.id, ...input });
    refresh();
  }

  function handleDeleteReview(reviewId: string) {
    deleteReview(reviewId, currentUser.id);
    refresh();
  }

  function handleFlag(reviewId: string, reason: string) {
    flagReview(reviewId, currentUser.id, reason);
    refresh();
  }

  function handleReply(reviewId: string, body: string) {
    replyToReview(reviewId, currentUser.id, body);
    refresh();
  }

  if (!employee) {
    return <p>No employee with id {employeeId}.</p>;
  }

  return (
    <div>
      <h1>{employee.name}</h1>
      <p>{employee.email}</p>

      {employee.id === currentUser.id ? (
        <p>You cannot review yourself.</p>
      ) : (
        <ReviewForm onSubmit={handlePostReview} error={error} />
      )}

      <h2>Reviews</h2>
      {reviews.map((review) => (
        <ReviewCard
          key={review.id}
          review={review}
          authorName={review.authorId ? allUsers.find((e) => e.id === review.authorId)?.name ?? 'Unknown' : null}
          reply={getReplyForReview(review.id)}
          onFlag={(reason) => handleFlag(review.id, reason)}
          canManage={review.authorId === currentUser.id}
          onEdit={(input) => handleEditReview(review.id, input)}
          onDelete={() => handleDeleteReview(review.id)}
        >
          {review.receiverId === currentUser.id && !getReplyForReview(review.id) && (
            <ReplyForm onSubmit={(body) => handleReply(review.id, body)} />
          )}
        </ReviewCard>
      ))}
    </div>
  );
}
```

- [ ] **Step 8: Wire it into the app shell**

In `frontend/src/App.tsx`, remove the `EmployeeProfilePlaceholder` function entirely, add `import { EmployeeProfilePage } from './pages/EmployeeProfilePage';`, and change `<Route path="/employees/:employeeId" element={<EmployeeProfilePlaceholder />} />` to `<Route path="/employees/:employeeId" element={<EmployeeProfilePage />} />`.

- [ ] **Step 9: Run the EmployeeProfilePage tests again to verify they pass**

```bash
cd frontend && npx vitest run src/pages/EmployeeProfilePage.test.tsx
```

Expected: PASS (7 tests).

- [ ] **Step 10: Run the full suite to confirm nothing else broke**

```bash
cd frontend && npm test
```

Expected: all tests PASS.

- [ ] **Step 11: Commit**

```bash
git add frontend/src/components/ReplyForm.tsx frontend/src/components/ReplyForm.test.tsx frontend/src/pages/EmployeeProfilePage.tsx frontend/src/pages/EmployeeProfilePage.test.tsx frontend/src/App.tsx
git commit -m "$(cat <<'EOF'
Add reply form and the employee profile page (post, edit, delete, reply, flag)

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 11: Admin flags page

**Files:**
- Create: `frontend/src/pages/AdminFlagsPage.tsx`
- Modify: `frontend/src/App.tsx` (swap `AdminFlagsPlaceholder` for `AdminFlagsPage`)
- Test: `frontend/src/pages/AdminFlagsPage.test.tsx`

**Interfaces:**
- Consumes: `useCurrentUser` from `../context/CurrentUserContext`; `listOpenFlags`, `resolveFlag`, `MockApiError` from `../mockApi/mockApi`
- Produces: `AdminFlagsPage` (component, route `/admin/flags`)

- [ ] **Step 1: Write the failing tests**

Create `frontend/src/pages/AdminFlagsPage.test.tsx`:

```tsx
import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CurrentUserProvider } from '../context/CurrentUserContext';
import { UserSwitcher } from '../components/UserSwitcher';
import { AdminFlagsPage } from './AdminFlagsPage';
import { resetStore } from '../mockApi/store';
import { flagReview } from '../mockApi/mockApi';

function renderAdminPage() {
  return render(
    <CurrentUserProvider>
      <UserSwitcher />
      <AdminFlagsPage />
    </CurrentUserProvider>,
  );
}

describe('AdminFlagsPage', () => {
  beforeEach(() => {
    localStorage.clear();
    resetStore();
  });

  it('blocks a non-admin viewer with a message instead of the flag list', () => {
    renderAdminPage();
    expect(screen.getByText('Admin or HR role is required.')).toBeInTheDocument();
  });

  it('lists an open flag and resolves it for an admin viewer', async () => {
    const user = userEvent.setup();
    flagReview('rev-1', 'emp-3', 'Seems off-topic');
    renderAdminPage();

    await user.selectOptions(screen.getByLabelText('Viewing as'), 'emp-5');
    expect(screen.getByText('Reason: Seems off-topic')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Resolve' }));
    expect(screen.getByText('No open flags.')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

```bash
cd frontend && npx vitest run src/pages/AdminFlagsPage.test.tsx
```

Expected: FAIL (`AdminFlagsPage.tsx` does not exist yet).

- [ ] **Step 3: Implement the page**

Create `frontend/src/pages/AdminFlagsPage.tsx`:

```tsx
import { useState } from 'react';
import { useCurrentUser } from '../context/CurrentUserContext';
import { listOpenFlags, resolveFlag, MockApiError } from '../mockApi/mockApi';

export function AdminFlagsPage() {
  const { currentUser, allUsers } = useCurrentUser();
  const [version, setVersion] = useState(0);
  const [error, setError] = useState<string | undefined>(undefined);

  let flags: ReturnType<typeof listOpenFlags> = [];
  try {
    flags = listOpenFlags(currentUser.id);
  } catch (e) {
    return <p>{e instanceof MockApiError ? e.message : 'Could not load flags.'}</p>;
  }

  function handleResolve(flagId: string, deleteReviewToo: boolean) {
    setError(undefined);
    try {
      resolveFlag(flagId, currentUser.id, deleteReviewToo);
      setVersion((v) => v + 1);
    } catch (e) {
      setError(e instanceof MockApiError ? e.message : 'Could not resolve flag.');
    }
  }

  return (
    <div>
      <h1>Open flags</h1>
      {error && <p role="alert">{error}</p>}
      {flags.length === 0 && <p>No open flags.</p>}
      <ul>
        {flags.map(({ flag, review }) => {
          const author = allUsers.find((e) => e.id === review.authorId);
          return (
            <li key={flag.id} data-testid={`flag-${flag.id}`}>
              <p>Reason: {flag.reason}</p>
              <p>
                Review: "{review.body}" — {author?.name ?? 'Unknown'}
              </p>
              <button type="button" onClick={() => handleResolve(flag.id, false)}>
                Resolve
              </button>
              <button type="button" onClick={() => handleResolve(flag.id, true)}>
                Resolve and delete review
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
```

Note: `flags` is computed directly in the render body (not memoized) — that's fine here because the mock store read is synchronous and cheap; `version` forces a re-render after a resolve action.

- [ ] **Step 4: Wire it into the app shell**

In `frontend/src/App.tsx`, remove the `AdminFlagsPlaceholder` function entirely, add `import { AdminFlagsPage } from './pages/AdminFlagsPage';`, and change `<Route path="/admin/flags" element={<AdminFlagsPlaceholder />} />` to `<Route path="/admin/flags" element={<AdminFlagsPage />} />`.

- [ ] **Step 5: Run the tests again to verify they pass**

```bash
cd frontend && npx vitest run src/pages/AdminFlagsPage.test.tsx
```

Expected: PASS (2 tests).

- [ ] **Step 6: Run the full suite to confirm nothing else broke**

```bash
cd frontend && npm test
```

Expected: all tests PASS.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/pages/AdminFlagsPage.tsx frontend/src/pages/AdminFlagsPage.test.tsx frontend/src/App.tsx
git commit -m "$(cat <<'EOF'
Add admin flags moderation page

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 12: Notifications list

**Files:**
- Create: `frontend/src/components/NotificationsList.tsx`
- Modify: `frontend/src/App.tsx` (render `NotificationsList` in the header)
- Test: `frontend/src/components/NotificationsList.test.tsx`

**Interfaces:**
- Consumes: `useCurrentUser` from `../context/CurrentUserContext`; `getNotifications` from `../mockApi/mockApi`
- Produces: `NotificationsList` (component)

- [ ] **Step 1: Write the failing test**

Create `frontend/src/components/NotificationsList.test.tsx`:

```tsx
import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CurrentUserProvider } from '../context/CurrentUserContext';
import { NotificationsList } from './NotificationsList';
import { resetStore } from '../mockApi/store';
import { postReview } from '../mockApi/mockApi';

describe('NotificationsList', () => {
  beforeEach(() => {
    localStorage.clear();
    resetStore();
  });

  it('shows a notification for a review the current user (default emp-1) received', async () => {
    const user = userEvent.setup();
    postReview({ authorId: 'emp-2', receiverId: 'emp-1', rating: 4, body: 'Nice work.', visibility: 'public' });

    render(
      <CurrentUserProvider>
        <NotificationsList />
      </CurrentUserProvider>,
    );

    expect(screen.getByText('Notifications (1)')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Notifications/ }));
    expect(screen.getByText('You received a new review.')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

```bash
cd frontend && npx vitest run src/components/NotificationsList.test.tsx
```

Expected: FAIL (`NotificationsList.tsx` does not exist yet).

- [ ] **Step 3: Implement the component**

Create `frontend/src/components/NotificationsList.tsx`:

```tsx
import { useState } from 'react';
import { useCurrentUser } from '../context/CurrentUserContext';
import { getNotifications } from '../mockApi/mockApi';

export function NotificationsList() {
  const { currentUser } = useCurrentUser();
  const [open, setOpen] = useState(false);
  const notifications = getNotifications(currentUser.id);

  return (
    <div>
      <button type="button" onClick={() => setOpen((o) => !o)}>
        Notifications ({notifications.length})
      </button>
      {open && (
        <ul>
          {notifications.length === 0 && <li>No notifications yet.</li>}
          {notifications.map((n) => (
            <li key={n.id}>{n.message}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Wire it into the app shell**

In `frontend/src/App.tsx`, add `import { NotificationsList } from './components/NotificationsList';` and render `<NotificationsList />` inside `<header>`, next to `<UserSwitcher />`:

```tsx
<header>
  <nav>
    <NavLink to="/">Directory</NavLink>
    {isAdminRole(currentUser.role) && <NavLink to="/admin/flags">Admin: Flags</NavLink>}
  </nav>
  <NotificationsList />
  <UserSwitcher />
</header>
```

- [ ] **Step 5: Run the test again to verify it passes**

```bash
cd frontend && npx vitest run src/components/NotificationsList.test.tsx
```

Expected: PASS (1 test).

- [ ] **Step 6: Run the full suite to confirm nothing else broke**

```bash
cd frontend && npm test
```

Expected: all tests PASS.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/components/NotificationsList.tsx frontend/src/components/NotificationsList.test.tsx frontend/src/App.tsx
git commit -m "$(cat <<'EOF'
Add in-app notifications list

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 13: Manual smoke test in the browser

**Files:** none (verification only)

**Interfaces:**
- Consumes: the whole app built in Tasks 1–12

- [ ] **Step 1: Start the dev server**

```bash
cd frontend && npm run dev
```

- [ ] **Step 2: Click through the golden path**

Open the printed local URL and verify, using the "Viewing as" switcher:
- As Alice (`emp-1`, default): the directory lists all 5 employees; searching filters it; Alice's own profile shows "You cannot review yourself." and one public + one anonymous review, the anonymous one showing as plain "Anonymous"; replying to the public review works and the reply appears; flagging a review with a reason works.
- As Bob (`emp-2`): Alice's anonymous review from Carla is not shown at all; posting a new public or anonymous review to Carla's profile works and appears immediately; editing and deleting that review (using its own "Edit"/"Delete" buttons) both work; posting an anonymous review to someone else still shows it to you afterward with your own name and Edit/Delete controls, even though you're not the receiver.
- As Erika (`emp-5`, admin): Alice's anonymous review from Carla now shows "Anonymous (author visible to you: Carla Cruz)"; the "Admin: Flags" nav link appears; any flags raised during this walkthrough show up there and "Resolve" / "Resolve and delete review" both work.
- Notifications button shows a growing count as reviews/replies are posted to the current user, and lists them when opened.
- Refresh the page — all of the above state (reviews, replies, flags, notifications) survives, because it's persisted to `localStorage`.

- [ ] **Step 3: Stop the dev server**

Press `Ctrl+C` in the terminal running `npm run dev`.

This task has no commit — it's a verification pass confirming Tasks 1–12 add up to the working app described in the spec's Phase 2 (built here ahead of Phase 1/3 per the user's requested order: frontend and functionality first, real backend/DB/gateway later).
