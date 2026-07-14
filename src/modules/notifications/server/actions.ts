'use server';

import { getLocale } from 'next-intl/server';
import { ApiError, withAuthRetry } from '@/core/session/server';
import { markNotificationRead } from './service';

export interface NotificationActionState {
  error?: string;
}

/**
 * Mark a notification as read. Called imperatively from the client button; the
 * caller refreshes the route on success and toasts on failure. Runs through
 * `withAuthRetry` so an expired access token gets one refresh-and-retry.
 */
export async function markNotificationAsRead(
  id: string,
): Promise<NotificationActionState> {
  const locale = await getLocale();
  try {
    await withAuthRetry((accessToken) =>
      markNotificationRead(accessToken, locale, id),
    );
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      return { error: 'unauthenticated' };
    }
    console.error('[notifications] mark-as-read failed', error);
    return { error: 'failed' };
  }
  return {};
}
