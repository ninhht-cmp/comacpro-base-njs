/**
 * Curated domain model for notifications — a flat shape the UI consumes,
 * decoupled from the generated `NotificationResDto`. The DTO → domain mapping
 * lives in `./mapper`.
 */

import type { NotificationEvent } from '@/lib/api/generated/model';

/** SaleNet notification event kinds (re-exported generated union). */
export type { NotificationEvent };

export interface Notification {
  /** SaleNet notification id (UUID string). */
  id: string;
  /** Localized by the backend via the `Content-Language` request header. */
  description: string;
  /** In-app destination the notification points at. */
  pageUrl?: string;
  event?: NotificationEvent;
  createdAt?: string;
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
