import type {
  NotificationResDto,
  NotificationUnreadCountDto,
} from '@/lib/api/generated/model';
import { serverFetch, serverFetchPage } from '@/lib/api/server-fetch';
import { type NotificationPage, toNotification } from '../api';

/**
 * SaleNet `notifications` endpoints via the shared `serverFetch` transport.
 *
 * Notifications are the **only** endpoints that get a locale. ⚠️ The SaleNet
 * spec declares no localization header; `serverFetch` sends both
 * `Accept-Language` and `Content-Language` as a best effort (see its docs) —
 * whether `description` is actually localized per-request is unconfirmed
 * with the backend team.
 */

// Re-exported so the feature's actions keep importing it from `./service`.
export { ApiError } from '@/lib/api/server-fetch';

export interface NotificationQuery {
  page?: number;
  perPage?: number;
  isRead?: boolean;
}

function searchParams(query: NotificationQuery): string {
  const sp = new URLSearchParams();
  if (query.page) sp.set('page', String(query.page));
  if (query.perPage) sp.set('perPage', String(query.perPage));
  if (query.isRead !== undefined) sp.set('isRead', String(query.isRead));
  const s = sp.toString();
  return s ? `?${s}` : '';
}

/** GET /v1/notifications — the signed-in user's notifications (localized). */
export async function fetchMyNotifications(
  accessToken: string,
  locale: string,
  query: NotificationQuery = {},
): Promise<NotificationPage> {
  const { data, pagination } = await serverFetchPage<NotificationResDto[]>(
    `/notifications${searchParams(query)}`,
    { method: 'GET', accessToken, locale },
  );
  return {
    items: (data ?? []).map(toNotification),
    meta: pagination && {
      page: pagination.currentPage ?? 1,
      perPage: pagination.perPage ?? (data ?? []).length,
      total: pagination.totalItem,
      totalPages: pagination.totalPage ?? 1,
    },
  };
}

/** GET /v1/notifications/unread-count — unread count for the badge. */
export async function fetchUnreadCount(
  accessToken: string,
  locale: string,
): Promise<number> {
  const body = await serverFetch<NotificationUnreadCountDto>(
    '/notifications/unread-count',
    { method: 'GET', accessToken, locale },
  );
  return body?.count ?? 0;
}

/** PUT /v1/notifications/:id — mark one notification as read. */
export async function markNotificationRead(
  accessToken: string,
  locale: string,
  id: string,
): Promise<void> {
  await serverFetch<boolean>(`/notifications/${encodeURIComponent(id)}`, {
    method: 'PUT',
    accessToken,
    locale,
  });
}
