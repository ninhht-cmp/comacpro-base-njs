'use server';

import { getLocale, getTranslations } from 'next-intl/server';
import { ApiError, withAuthRetry } from '@/core/session/server';
import { redirect } from '@/i18n/navigation';
import { logger } from '@/lib/observability/logger';
import { markNotificationRead } from './service';

export interface NotificationActionState {
  /** Ready-to-display (translated) message — the shared action contract. */
  error?: string;
}

/**
 * Mark a notification as read. Called imperatively from the client button; the
 * caller refreshes the route on success and toasts `error` on failure. Runs
 * through `withAuthRetry` so an expired access token gets one refresh-and-retry.
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
    // 401 after the refresh-retry means the session is genuinely dead —
    // re-auth beats toasting an error the user can't act on.
    if (error instanceof ApiError && error.status === 401) {
      redirect({ href: '/signin', locale });
    }
    logger.error('notifications', 'mark-as-read failed', error);
    const t = await getTranslations({ locale, namespace: 'Notifications' });
    return { error: t('markReadError') };
  }
  return {};
}
