import 'server-only';
import { cookies } from 'next/headers';
import { ApiError } from '@/lib/api/server-fetch';
import { logger } from '@/lib/observability/logger';
import { refreshSession } from './identity';
import {
  openSession,
  sealSession,
  SESSION_COOKIE,
  type SessionData,
  sessionCookieOptions,
} from './session';

/**
 * Session cookie helpers for Server Components, Server Actions and Route
 * Handlers (anywhere `next/headers` is available). Proxy uses `./session`
 * directly against the request/response cookies instead.
 */

export async function getSession(): Promise<SessionData | null> {
  const store = await cookies();
  return openSession(store.get(SESSION_COOKIE)?.value);
}

export async function setSession(data: SessionData): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, await sealSession(data), sessionCookieOptions);
}

export async function clearSession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

/**
 * Refresh the session's tokens (+ user snapshot) and persist the resealed
 * cookie. Only callable where cookies are writable — Server Actions and Route
 * Handlers; Server Components can read but not write cookies. Returns the
 * refreshed session, or null (clearing the cookie) when the backend rejects
 * the refresh token.
 */
export async function refreshSessionAndPersist(): Promise<SessionData | null> {
  const session = await getSession();
  if (!session?.refreshToken) return null;
  try {
    const refreshed = await refreshSession(session);
    await setSession(refreshed);
    return refreshed;
  } catch (error) {
    if (
      error instanceof ApiError &&
      (error.status === 400 || error.status === 401 || error.status === 403)
    ) {
      await clearSession();
      return null;
    }
    // Transient failure (network/5xx/timeout): keep the cookie — the token may
    // still be valid and the next request can retry.
    logger.error('session', 'refresh failed transiently', error);
    return session;
  }
}

/**
 * Run an authenticated API call from a Server Action, retrying ONCE after a
 * token refresh when the backend answers 401 — covers the tab that sat open
 * past the token TTL without a middleware pass to refresh it. Throws ApiError
 * (including the original 401 when no recovery is possible) for the action's
 * own error mapping.
 */
export async function withAuthRetry<T>(
  run: (accessToken: string) => Promise<T>,
): Promise<T> {
  const session = await getSession();
  if (!session) throw new ApiError('Not authenticated', 401);
  try {
    return await run(session.accessToken);
  } catch (error) {
    if (
      !(error instanceof ApiError) ||
      error.status !== 401 ||
      !session.refreshToken
    ) {
      throw error;
    }
    const refreshed = await refreshSessionAndPersist();
    if (!refreshed || refreshed.accessToken === session.accessToken) {
      throw error;
    }
    return run(refreshed.accessToken);
  }
}
