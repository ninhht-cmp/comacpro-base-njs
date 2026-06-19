'use server';

import { getLocale } from 'next-intl/server';
import { getSession } from '@/core/session/server';
import { markNotificationRead } from './service';

export interface NotificationActionState {
  error?: string;
}

/**
 * Mark a notification as read. Called imperatively from the client button; the
 * caller refreshes the route on success. Returns `{ error }` on failure.
 */
export async function markNotificationAsRead(
  id: number,
): Promise<NotificationActionState> {
  const session = await getSession();
  if (!session) return { error: 'unauthenticated' };

  const locale = await getLocale();
  try {
    await markNotificationRead(session.accessToken, locale, id);
  } catch {
    return { error: 'failed' };
  }
  return {};
}
