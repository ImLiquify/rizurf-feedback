import type { Employee, NotificationItem, OpenFlagEntry, ReviewFlag, ReviewReply, ReviewView, Visibility } from './types';

const API_BASE = 'http://127.0.0.1:4000/api';

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

async function request<T>(path: string, userId: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Mock-User-Id': userId,
      ...(options.headers ?? {}),
    },
  });

  if (res.status === 204) return null as T;

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(data?.error?.code ?? 'UNKNOWN', data?.error?.message ?? 'Request failed.');
  }
  return data as T;
}

export async function searchEmployees(userId: string, query: string): Promise<Employee[]> {
  const data = await request<{ employees: Employee[] }>(`/employees?q=${encodeURIComponent(query)}`, userId);
  return data.employees;
}

export async function getEmployeeReviews(userId: string, employeeId: string): Promise<ReviewView[]> {
  const data = await request<{ reviews: ReviewView[] }>(`/employees/${employeeId}/reviews`, userId);
  return data.reviews;
}

export async function postReview(
  userId: string,
  input: { receiverId: string; rating: number; body: string; visibility: Visibility },
): Promise<Review> {
  const data = await request<{ review: Review }>('/reviews', userId, { method: 'POST', body: JSON.stringify(input) });
  return data.review;
}

export async function editReview(
  userId: string,
  reviewId: string,
  input: { rating: number; body: string; visibility: Visibility },
): Promise<Review> {
  const data = await request<{ review: Review }>(`/reviews/${reviewId}`, userId, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
  return data.review;
}

export function deleteReview(userId: string, reviewId: string): Promise<null> {
  return request<null>(`/reviews/${reviewId}`, userId, { method: 'DELETE' });
}

export async function replyToReview(userId: string, reviewId: string, body: string): Promise<ReviewReply> {
  const data = await request<{ reply: ReviewReply }>(`/reviews/${reviewId}/replies`, userId, {
    method: 'POST',
    body: JSON.stringify({ body }),
  });
  return data.reply;
}

export async function flagReview(userId: string, reviewId: string, reason: string): Promise<ReviewFlag> {
  const data = await request<{ flag: ReviewFlag }>(`/reviews/${reviewId}/flags`, userId, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
  return data.flag;
}

export async function listOpenFlags(userId: string): Promise<OpenFlagEntry[]> {
  const data = await request<{ flags: OpenFlagEntry[] }>('/admin/flags', userId);
  return data.flags;
}

export function resolveFlag(userId: string, flagId: string, deleteReview: boolean): Promise<null> {
  return request<null>(`/admin/flags/${flagId}`, userId, {
    method: 'PATCH',
    body: JSON.stringify({ deleteReview }),
  });
}

export async function getNotifications(userId: string): Promise<NotificationItem[]> {
  const data = await request<{ notifications: NotificationItem[] }>('/notifications', userId);
  return data.notifications;
}
