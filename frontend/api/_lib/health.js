import { pool } from './db/pool.js';
import { config } from './config.js';

const VERSION = '1.0.0';
const started = Date.now();

// MICROAPP_PERFORMANCE.md §3 — time-box every check so one hanging
// dependency reports degraded instead of hanging the whole endpoint.
async function withTimeout(fn, ms = 800) {
  try {
    await Promise.race([fn(), new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))]);
    return true;
  } catch {
    return false;
  }
}

// SS-2 — a trivial ping, not a real query; called every 15s by the
// gateway's catalog refresh, must never be the slow part of anyone's page.
export async function buildHealth() {
  const database = await withTimeout(() => pool.query('SELECT 1'));
  return {
    status: database ? 'ok' : 'degraded',
    service: config.serviceId,
    version: VERSION,
    uptime_seconds: Math.floor((Date.now() - started) / 1000),
    checks: { database },
  };
}

const REVIEW_ENDPOINT_META = {
  employeeSearch: {
    name: 'Search Employees',
    purpose: 'Find a coworker by name or email',
    use_when: ['Looking up a coworker before viewing their profile or leaving a review'],
    do_not_use_when: ['You already have the employee id — use the reviews endpoint directly'],
    inputs: ['q'],
    outputs: ['id', 'email', 'name', 'role', 'avgRating', 'reviewCount'],
    requires: ['Signed-in session'],
    related_endpoints: ['GET /api/employees/{id}/reviews'],
    tags: ['search', 'directory', 'coworker', 'employees'],
  },
  employeeReviews: {
    name: 'Get Employee Reviews',
    purpose: "List the reviews about one employee, filtered to what the caller may see",
    use_when: ['Viewing a coworker profile', 'Checking your own received reviews'],
    do_not_use_when: ['Listing reviews you wrote about others — no such endpoint exists yet'],
    inputs: ['employeeId (path)'],
    outputs: ['reviews[]: id, authorId, receiverId, rating, body, visibility, createdAt, updatedAt, reply'],
    requires: ['Signed-in session'],
    related_endpoints: ['POST /api/reviews', 'POST /api/reviews/{id}/replies'],
    tags: ['reviews', 'profile', 'ratings', 'feedback'],
  },
  postReview: {
    name: 'Post Review',
    purpose: 'Leave a public or anonymous rating and review for a coworker',
    use_when: ['Giving feedback about a coworker you are not reviewing yourself'],
    do_not_use_when: ['Reviewing yourself — rejected', 'Editing an existing review — use PATCH instead'],
    inputs: ['receiverId', 'rating', 'body', 'visibility'],
    outputs: ['review: id, authorId, receiverId, rating, body, visibility, createdAt, updatedAt'],
    requires: ['Signed-in session', 'receiverId is not the caller'],
    related_endpoints: ['GET /api/employees/{id}/reviews', 'PATCH /api/reviews/{id}'],
    tags: ['review', 'rate', 'feedback', 'anonymous'],
  },
  editReview: {
    name: 'Edit Review',
    purpose: 'Update a review you authored',
    use_when: ['Correcting or updating your own review'],
    do_not_use_when: ["Editing someone else's review — forbidden"],
    inputs: ['reviewId (path)', 'rating', 'body', 'visibility'],
    outputs: ['review: id, authorId, receiverId, rating, body, visibility, createdAt, updatedAt'],
    requires: ['Signed-in session', 'Caller is the review author'],
    related_endpoints: ['DELETE /api/reviews/{id}'],
    tags: ['review', 'edit', 'update'],
  },
  deleteReview: {
    name: 'Delete Review',
    purpose: 'Remove a review you authored',
    use_when: ['Retracting your own review'],
    do_not_use_when: ["Deleting someone else's review — forbidden; use the admin flag flow instead"],
    inputs: ['reviewId (path)'],
    outputs: [],
    requires: ['Signed-in session', 'Caller is the review author'],
    related_endpoints: ['PATCH /api/reviews/{id}'],
    tags: ['review', 'delete', 'remove'],
  },
  replyToReview: {
    name: 'Reply To Review',
    purpose: 'Post the one allowed reply to a review you received',
    use_when: ['Responding to feedback you received, once'],
    do_not_use_when: ['You are not the review receiver — forbidden', 'A reply already exists — rejected'],
    inputs: ['reviewId (path)', 'body'],
    outputs: ['reply: id, reviewId, authorId, body, createdAt'],
    requires: ['Signed-in session', 'Caller is the review receiver', 'No existing reply'],
    related_endpoints: ['GET /api/employees/{id}/reviews'],
    tags: ['reply', 'respond', 'feedback'],
  },
  flagReview: {
    name: 'Flag Review',
    purpose: 'Report a review for admin/HR moderation',
    use_when: ['A review seems inappropriate, false, or abusive'],
    do_not_use_when: ['You want to remove your own review — use delete instead'],
    inputs: ['reviewId (path)', 'reason'],
    outputs: ['flag: id, reviewId, flaggedBy, reason, status, createdAt'],
    requires: ['Signed-in session'],
    related_endpoints: ['GET /api/admin/flags'],
    tags: ['flag', 'report', 'moderation'],
  },
  listFlags: {
    name: 'List Open Flags',
    purpose: 'See every open moderation flag, admin/HR only',
    use_when: ['Reviewing what has been reported'],
    do_not_use_when: ['Caller is not admin/hr — forbidden'],
    inputs: [],
    outputs: ['flags[]: { flag, review }'],
    requires: ['Signed-in session', 'role is admin or hr'],
    related_endpoints: ['PATCH /api/admin/flags/{id}'],
    tags: ['admin', 'moderation', 'flags'],
  },
  employeeWall: {
    name: 'Employee Wall',
    purpose: 'See every employee with the reviews they gave and received, author always shown',
    use_when: ['Getting a full picture of feedback activity across the company'],
    do_not_use_when: ['Caller is not admin/hr — forbidden'],
    inputs: [],
    outputs: ['employees[]: { id, email, name, role, avgRating, reviewCount, reviewsGiven[], reviewsReceived[] }'],
    requires: ['Signed-in session', 'role is admin or hr'],
    related_endpoints: ['GET /api/employees/{id}/reviews'],
    tags: ['admin', 'overview', 'wall', 'reporting'],
  },
  resolveFlag: {
    name: 'Resolve Flag',
    purpose: 'Close a moderation flag, optionally deleting the flagged review',
    use_when: ['A flag has been reviewed and a decision made'],
    do_not_use_when: ['Caller is not admin/hr — forbidden'],
    inputs: ['flagId (path)', 'deleteReview'],
    outputs: [],
    requires: ['Signed-in session', 'role is admin or hr'],
    related_endpoints: ['GET /api/admin/flags'],
    tags: ['admin', 'moderation', 'resolve'],
  },
  notifications: {
    name: 'List Notifications',
    purpose: 'See your own in-app notifications',
    use_when: ['Checking for new reviews, replies, or flag resolutions'],
    do_not_use_when: [],
    inputs: [],
    outputs: ['notifications[]: id, userId, type, message, read, createdAt'],
    requires: ['Signed-in session'],
    related_endpoints: [],
    tags: ['notifications', 'inbox'],
  },
};

// SS-3/SS-23/SS-27 — built once at module load, not rebuilt per request
// (MICROAPP_PERFORMANCE.md §4). Every field the developer hub, the
// catalog, and an AI acting on someone's behalf read comes from here.
export const openapi = {
  openapi: '3.0.3',
  info: {
    title: 'Rizurf Feedback',
    description: 'Peer feedback between employees — public or anonymous ratings and reviews, with admin moderation.',
    version: VERSION,
    'x-rizurf': {
      domain: 'Operations',
      owner: 'rizurf-feedback-team',
      app_url: '/',
      category: 'Operations',
      industries: ['Human Resources', 'Operations'],
      use_cases: [
        'Leaving feedback on a coworker after working together',
        'Checking the reviews you have received',
        'Replying to feedback you received',
        "Moderating flagged or inappropriate reviews (admin/HR)",
        "Searching for a coworker's profile and rating",
      ],
      capabilities: [
        {
          name: 'Search & Profiles',
          icon: '🔍',
          description: 'Find a coworker and view their reviews and rating.',
          does: ['Search employees by name or email', "View an employee's eligible reviews"],
          best_for: 'Anyone looking up a coworker before leaving or reading feedback.',
          endpoints: ['GET /api/employees', 'GET /api/employees/{id}/reviews'],
        },
        {
          name: 'Give Feedback',
          icon: '⭐',
          description: 'Leave, edit, or delete a rating and review for a coworker.',
          does: ['Post a public or anonymous review', 'Edit your own review', 'Delete your own review'],
          best_for: 'Employees giving peer feedback, publicly or anonymously.',
          endpoints: ['POST /api/reviews', 'PATCH /api/reviews/{id}', 'DELETE /api/reviews/{id}'],
        },
        {
          name: 'Reply & Flag',
          icon: '💬',
          description: 'Respond to feedback you received, or report a review for moderation.',
          does: ['Reply to a review you received', 'Flag a review'],
          best_for: 'Recipients responding to feedback, or anyone reporting a problem review.',
          endpoints: ['POST /api/reviews/{id}/replies', 'POST /api/reviews/{id}/flags'],
        },
        {
          name: 'Moderation',
          icon: '🚩',
          description: 'Review and resolve flagged reviews.',
          does: ['List open flags', 'Resolve a flag, optionally deleting the review'],
          best_for: 'Admin/HR moderating reported reviews.',
          endpoints: ['GET /api/admin/flags', 'PATCH /api/admin/flags/{id}'],
        },
        {
          name: 'Employee Wall',
          icon: '📊',
          description: 'A full overview of every employee and the feedback they gave and received.',
          does: ['See every employee with all reviews they gave', 'See every employee with all reviews they received'],
          best_for: 'Admin/HR getting a company-wide view of feedback activity.',
          endpoints: ['GET /api/admin/wall'],
        },
        {
          name: 'Notifications',
          icon: '🔔',
          description: 'See your own in-app notifications.',
          does: ['List your notifications'],
          best_for: 'Employees checking for new reviews, replies, or flag resolutions.',
          endpoints: ['GET /api/notifications'],
        },
      ],
      workflows: [
        {
          name: 'Leave feedback on a coworker',
          steps: ['GET /api/employees', 'GET /api/employees/{id}/reviews', 'POST /api/reviews'],
        },
        {
          name: 'Reply to feedback you received',
          steps: ['GET /api/employees/{id}/reviews', 'POST /api/reviews/{id}/replies'],
        },
        {
          name: 'Moderate a flagged review',
          steps: ['GET /api/admin/flags', 'PATCH /api/admin/flags/{id}'],
        },
      ],
      related_services: [],
    },
  },
  components: {
    securitySchemes: {
      // Cookie-session, not Bearer: this service's own endpoints are called
      // by its own signed-in browser frontend (MICROAPP_AUTH.md §4/§24),
      // not by other services via client_credentials. Documented honestly
      // rather than declaring a Bearer scheme these routes don't accept.
      sessionCookie: { type: 'apiKey', in: 'cookie', name: 'rizurf_feedback_session' },
    },
  },
  paths: {
    '/health': { get: { summary: 'Liveness and dependency checks' } },
    '/openapi.json': { get: { summary: 'This document' } },
    '/api/auth/login': { get: { summary: 'Redirect to the Rizurf gateway to sign in' } },
    '/api/auth/callback': { post: { summary: 'Exchange a gateway sign-in code for this app session (called by our own frontend, not the browser-to-gateway leg)' } },
    '/api/auth/session': { get: { summary: 'Return the current signed-in user, or 401' } },
    '/api/employees': {
      get: {
        summary: 'Search employees by name or email',
        security: [{ sessionCookie: [] }],
        'x-rizurf': REVIEW_ENDPOINT_META.employeeSearch,
      },
    },
    '/api/employees/{id}/reviews': {
      get: {
        summary: 'List the reviews about one employee, filtered by visibility',
        security: [{ sessionCookie: [] }],
        'x-rizurf': REVIEW_ENDPOINT_META.employeeReviews,
      },
    },
    '/api/reviews': {
      post: {
        summary: 'Post a public or anonymous review for a coworker',
        security: [{ sessionCookie: [] }],
        'x-rizurf': REVIEW_ENDPOINT_META.postReview,
      },
    },
    '/api/reviews/{id}': {
      patch: {
        summary: 'Edit a review you authored',
        security: [{ sessionCookie: [] }],
        'x-rizurf': REVIEW_ENDPOINT_META.editReview,
      },
      delete: {
        summary: 'Delete a review you authored',
        security: [{ sessionCookie: [] }],
        'x-rizurf': REVIEW_ENDPOINT_META.deleteReview,
      },
    },
    '/api/reviews/{id}/replies': {
      post: {
        summary: 'Reply to a review you received (once)',
        security: [{ sessionCookie: [] }],
        'x-rizurf': REVIEW_ENDPOINT_META.replyToReview,
      },
    },
    '/api/reviews/{id}/flags': {
      post: {
        summary: 'Flag a review for moderation',
        security: [{ sessionCookie: [] }],
        'x-rizurf': REVIEW_ENDPOINT_META.flagReview,
      },
    },
    '/api/admin/flags': {
      get: {
        summary: 'List open moderation flags (admin/hr only)',
        security: [{ sessionCookie: [] }],
        'x-rizurf': REVIEW_ENDPOINT_META.listFlags,
      },
    },
    '/api/admin/flags/{id}': {
      patch: {
        summary: 'Resolve a flag, optionally deleting the review (admin/hr only)',
        security: [{ sessionCookie: [] }],
        'x-rizurf': REVIEW_ENDPOINT_META.resolveFlag,
      },
    },
    '/api/admin/wall': {
      get: {
        summary: 'Every employee with the reviews they gave and received (admin/hr only)',
        security: [{ sessionCookie: [] }],
        'x-rizurf': REVIEW_ENDPOINT_META.employeeWall,
      },
    },
    '/api/notifications': {
      get: {
        summary: 'List your own in-app notifications',
        security: [{ sessionCookie: [] }],
        'x-rizurf': REVIEW_ENDPOINT_META.notifications,
      },
    },
  },
};

export const OPENAPI_JSON = JSON.stringify(openapi);
