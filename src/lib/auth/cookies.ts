import { cookies } from 'next/headers';
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
 * Access token for outgoing API calls, or null. Does not refresh — `proxy.ts`
 * keeps the token fresh across requests.
 */
export async function getAccessToken(): Promise<string | null> {
  const session = await getSession();
  return session?.accessToken ?? null;
}

/**
 * Per-request option for the orval client that attaches the session bearer
 * token. Use it for server-side authenticated calls — keeps the shared mutator
 * free of server-only imports:
 *
 * ```ts
 * const profile = (await externalUserControllerGetMyProfileV1(
 *   await authorizedRequest(),
 * )).data;
 * ```
 */
export async function authorizedRequest(): Promise<{
  headers?: Record<string, string>;
}> {
  const token = await getAccessToken();
  return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
}
