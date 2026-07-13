import { env } from '@/config/env';

/**
 * Anonymous visitor session id — a random UUID in a first-party cookie.
 *
 * SaleNet's referral lookup (`GET /v1/users/referral/{code}`) declares a
 * REQUIRED `sessionId` query param: the mobile app sends its device session
 * so the backend can attribute/deduplicate invite-link opens. The web
 * equivalent is this cookie: minted by `src/proxy.ts` when a visitor lands on
 * the signup path (Server Components can't set cookies), read by the signup
 * page and forwarded to the lookup. It is NOT an auth artifact — just a
 * stable random id, scoped to the signup flow.
 *
 * Edge-safe: no Node-only imports (`crypto.randomUUID` is Web Crypto).
 */

export const VISITOR_COOKIE =
  env.NODE_ENV === 'production' ? '__Host-cmp_visitor' : 'cmp_visitor';

/** Attribution window; refreshed on each mint, never rotated once set. */
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
