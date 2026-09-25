// Exactly the Rizurf gateway's own four roles (MICROAPP_AUTH.md) — never
// add a fifth value here; a local role need would layer on top instead.
export type Role = 'user' | 'admin' | 'hr' | 'supervisor';

export interface Employee {
  id: string;
  email: string;
  name: string;
  role: Role;
  // Present on directory/search results; absent on the signed-in session
  // user (GET /api/auth/session doesn't compute an aggregate).
  avgRating?: number | null;
  reviewCount?: number;
}

export type Visibility = 'public' | 'anonymous';

export interface ReviewReply {
  id: string;
  reviewId: string;
  authorId: string;
  body: string;
  createdAt: string;
}

// What the current viewer is allowed to see: authorId is null when the
// review is anonymous and the viewer is neither the receiver, the author,
// nor an admin/hr. `reply` is embedded by the API's reviews endpoint.
export interface ReviewView {
  id: string;
  authorId: string | null;
  receiverId: string;
  rating: number;
  body: string;
  visibility: Visibility;
  createdAt: string;
  updatedAt: string;
  reply: ReviewReply | null;
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

export interface OpenFlagEntry {
  flag: ReviewFlag;
  review: {
    id: string;
    authorId: string;
    receiverId: string;
    rating: number;
    body: string;
    visibility: Visibility;
    createdAt: string;
    updatedAt: string;
  };
}

// A review as shown on the admin-only employee wall: the author is always
// present (never stripped) since only admin/hr can reach this endpoint.
export interface WallReview {
  id: string;
  authorId: string;
  authorName: string;
  receiverId: string;
  receiverName: string;
  rating: number;
  body: string;
  visibility: Visibility;
  createdAt: string;
  updatedAt: string;
}

export interface WallEmployee extends Employee {
  reviewsGiven: WallReview[];
  reviewsReceived: WallReview[];
}

export type NotificationType = 'review_received' | 'reply_received' | 'flag_resolved';

export interface NotificationItem {
  id: string;
  userId: string;
  type: NotificationType;
  message: string;
  read: boolean;
  createdAt: string;
}
