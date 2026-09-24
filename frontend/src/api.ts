import type { Employee, NotificationItem, OpenFlagEntry, ReviewFlag, ReviewReply, ReviewView, Visibility } from './types';

const API_BASE = '/api';

export class ApiError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

interface Review {
  id: string;
  authorId: string;
  receiverId: string;
  rating: number;
  body: string;
  visibility: Visibility;
  createdAt: string;
  updatedAt: string;
}

// Session-cookie auth (MICROAPP_AUTH.md) — same-origin fetch sends it
// automatically, nothing to attach by hand. A 401 here means the gateway
// session ended since the page loaded; lock immediately, no error page.
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  });

  if (res.status === 401) {
    window.location.href = '/api/auth/login';
    return new Promise<T>(() => {}); // navigation is underway; never resolve
  }

  if (res.status === 204) return null as T;

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(data?.error?.code ?? 'UNKNOWN', data?.error?.message ?? 'Request failed.');
  }
  return data as T;
}

export async function getSession(): Promise<Employee> {
  const data = await request<{ user: Employee }>('/auth/session');
  return data.user;
}

export async function exchangeCode(code: string): Promise<Employee> {
  const data = await request<{ user: Employee }>('/auth/callback', {
    method: 'POST',
    body: JSON.stringify({ code }),
  });
  return data.user;
}

export async function searchEmployees(query: string): Promise<Employee[]> {
  const data = await request<{ employees: Employee[] }>(`/employees?q=${encodeURIComponent(query)}`);
  return data.employees;
}

export async function getEmployeeReviews(employeeId: string): Promise<ReviewView[]> {
  const data = await request<{ reviews: ReviewView[] }>(`/employees/${employeeId}/reviews`);
  return data.reviews;
}

export async function postReview(input: {
  receiverId: string;
  rating: number;
  body: string;
  visibility: Visibility;
}): Promise<Review> {
  const data = await request<{ review: Review }>('/reviews', { method: 'POST', body: JSON.stringify(input) });
  return data.review;
}

export async function editReview(
  reviewId: string,
  input: { rating: number; body: string; visibility: Visibility },
): Promise<Review> {
  const data = await request<{ review: Review }>(`/reviews/${reviewId}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
  return data.review;
}

export function deleteReview(reviewId: string): Promise<null> {
  return request<null>(`/reviews/${reviewId}`, { method: 'DELETE' });
}

export async function replyToReview(reviewId: string, body: string): Promise<ReviewReply> {
  const data = await request<{ reply: ReviewReply }>(`/reviews/${reviewId}/replies`, {
    method: 'POST',
    body: JSON.stringify({ body }),
  });
  return data.reply;
}

export async function flagReview(reviewId: string, reason: string): Promise<ReviewFlag> {
  const data = await request<{ flag: ReviewFlag }>(`/reviews/${reviewId}/flags`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
  return data.flag;
}

export async function listOpenFlags(): Promise<OpenFlagEntry[]> {
  const data = await request<{ flags: OpenFlagEntry[] }>('/admin/flags');
  return data.flags;
}

export function resolveFlag(flagId: string, deleteReview: boolean): Promise<null> {
  return request<null>(`/admin/flags/${flagId}`, {
    method: 'PATCH',
    body: JSON.stringify({ deleteReview }),
  });
}

export async function getNotifications(): Promise<NotificationItem[]> {
  const data = await request<{ notifications: NotificationItem[] }>('/notifications');
  return data.notifications;
}
