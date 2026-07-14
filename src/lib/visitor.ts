import { env } from '@/config/env';

/**
 * Anonymous visitor id (random UUID, first-party cookie) — the web equivalent
 * of the app's device session for the referral lookup's required `sessionId`
 * (invite-open attribution). Minted by `src/proxy.ts` on the signup path only
 * (Server Components can't set cookies); not an auth artifact. Edge-safe.
 */

export const VISITOR_COOKIE =
  env.NODE_ENV === 'production' ? '__Host-sn_visitor' : 'sn_visitor';

/** Attribution window. */
const VISITOR_MAX_AGE_SECONDS = 60 * 60 * 24 * 180; // 180 days

export const visitorCookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: env.NODE_ENV === 'production',
  path: '/',
  maxAge: VISITOR_MAX_AGE_SECONDS,
};

export function newVisitorId(): string {
  return crypto.randomUUID();
}
