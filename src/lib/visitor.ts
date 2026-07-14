import { defineCookie } from '@/lib/cookies';

/**
 * Anonymous visitor id (random UUID, first-party cookie) — the web equivalent
 * of the app's device session for the referral lookup's required `sessionId`
 * (invite-open attribution). Minted by `src/proxy.ts` on the signup path only
 * (Server Components can't set cookies); not an auth artifact. Edge-safe.
 */

/** Attribution window. */
const VISITOR_MAX_AGE_SECONDS = 60 * 60 * 24 * 180; // 180 days

const visitor = defineCookie('sn_visitor', VISITOR_MAX_AGE_SECONDS);
export const VISITOR_COOKIE = visitor.name;
export const visitorCookieOptions = visitor.options;

export function newVisitorId(): string {
  return crypto.randomUUID();
}
