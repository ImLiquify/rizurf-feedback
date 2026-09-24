export type Role = 'employee' | 'admin' | 'hr' | 'supervisor';

export interface Employee {
  id: string;
  email: string;
  name: string;
  role: Role;
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

export type NotificationType = 'review_received' | 'reply_received' | 'flag_resolved';

export interface NotificationItem {
  id: string;
  userId: string;
  type: NotificationType;
  message: string;
  read: boolean;
  createdAt: string;
}
