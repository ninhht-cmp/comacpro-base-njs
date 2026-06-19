/**
 * Curated domain model for notifications — readable enums + a flat shape the UI
 * consumes, decoupled from the generated `NotificationResDto` (numeric enums).
 * The DTO → domain mapping lives in `./mapper`.
 */

export const NotificationType = {
  All: 'all',
  User: 'user',
} as const;
export type NotificationType =
  (typeof NotificationType)[keyof typeof NotificationType];

export const NotificationStatus = {
  Active: 'active',
  Inactive: 'inactive',
} as const;
export type NotificationStatus =
  (typeof NotificationStatus)[keyof typeof NotificationStatus];

export interface Notification {
  id: number;
  title?: string;
  /** Localized by the backend via the `Content-Language` request header. */
  content?: string;
  sendDate?: string;
  createdAt?: string;
  type?: NotificationType;
  status?: NotificationStatus;
  isRead: boolean;
}

export interface NotificationPageMeta {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

export interface NotificationPage {
  items: Notification[];
  meta?: NotificationPageMeta;
}
