import type {
  NotificationControllerGetMyNotifications200,
  NotificationResDto,
} from '@/lib/api/generated/model';
import { env } from '@/config/env';
import { type NotificationPage, toNotification } from '../api';

/**
 * NestJS `notifications` endpoints via plain `fetch` (same rationale as the auth
 * service: runs server-side with the session bearer token).
 *
 * Notifications are the **only** endpoints that send `Content-Language`: their
 * `title`/`content` are localized by the backend per that header. Every call
 * here forwards the active locale; no other feature does.
 */

const API_PREFIX = '/api/v1';

export class NotificationApiError extends Error {
  override readonly name = 'NotificationApiError';
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
  }
}

function apiBaseUrl(): string {
  const base = env.API_BASE_URL ?? env.NEXT_PUBLIC_API_BASE_URL;
  if (!base) throw new NotificationApiError('API base URL is not configured.');
  return base.replace(/\/+$/, '');
}

async function notificationRequest<T>(
  path: string,
  accessToken: string,
  locale: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${apiBaseUrl()}${API_PREFIX}${path}`, {
    cache: 'no-store',
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      // i18n: backend localizes notification title/content by this header.
      'Content-Language': locale,
      ...init.headers,
    },
  });

  const text = await response.text();
  let body: unknown;
  try {
    body = text ? JSON.parse(text) : undefined;
  } catch {
    body = text;
  }
  if (!response.ok) {
    const message =
      body && typeof body === 'object' && 'message' in body
        ? String((body as { message: unknown }).message)
        : 'Request failed';
    throw new NotificationApiError(message, response.status);
  }
  return body as T;
}

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

/** GET /notifications — the signed-in user's notifications (localized). */
export async function fetchMyNotifications(
  accessToken: string,
  locale: string,
  query: NotificationQuery = {},
): Promise<NotificationPage> {
  const body =
    await notificationRequest<NotificationControllerGetMyNotifications200>(
      `/notifications${searchParams(query)}`,
      accessToken,
      locale,
      { method: 'GET' },
    );
  const items = (body.data ?? []).map(toNotification);
  return { items, meta: body.meta };
}

/** GET /notifications/count — unread count for the badge. */
export async function fetchUnreadCount(
  accessToken: string,
  locale: string,
): Promise<number> {
  const body = await notificationRequest<unknown>(
    `/notifications/count${searchParams({ isRead: false })}`,
    accessToken,
    locale,
    { method: 'GET' },
  );
  // The live endpoint may return the count bare or wrapped in `{ data }`.
  const value =
    typeof body === 'number'
      ? body
      : ((body as { data?: unknown } | undefined)?.data ?? 0);
  return typeof value === 'number' ? value : 0;
}

/** PATCH /notifications/:id/read — mark one notification as read. */
export async function markNotificationRead(
  accessToken: string,
  locale: string,
  id: number,
): Promise<void> {
  await notificationRequest<NotificationResDto>(
    `/notifications/${id}/read`,
    accessToken,
    locale,
    { method: 'PATCH' },
  );
}
