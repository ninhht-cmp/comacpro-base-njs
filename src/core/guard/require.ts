import 'server-only';
import { getLocale } from 'next-intl/server';
import type { SessionData } from '@/core/session';
import { getSession } from '@/core/session/server';
import { redirect } from '@/i18n/navigation';

/**
 * Server-side guard helpers for Server Components and Server Actions —
 * defense-in-depth behind the middleware, and the single place the redirect
 * contract lives (so pages don't hand-roll `getSession()` + redirect).
 */

/** Return the session, or redirect to sign-in if there isn't one. */
export async function requireSession(): Promise<SessionData> {
  const session = await getSession();
  if (session) return session;

  const locale = await getLocale();
  redirect({ href: '/signin', locale });
  // `redirect()` throws (NEXT_REDIRECT); this satisfies the non-null return type.
  throw new Error('requireSession: redirect did not halt execution');
}
