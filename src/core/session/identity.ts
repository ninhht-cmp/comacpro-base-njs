import type {
  LoginResponseDto,
  ProfileMeResDto,
  TokenResponseDto,
} from '@/lib/api/generated/model';
import { ApiError, serverFetch } from '@/lib/api/server-fetch';
import type { SessionData, SessionUser } from './session';

/**
 * Identity flows — token refresh and session building on top of the shared
 * `serverFetch` transport. Edge-safe (no `next/headers`) so both the auth
 * feature (sign-in flows) and `proxy.ts` (token refresh) share one
 * implementation.
 *
 * Endpoints live under `/api/v1` — see the generated model types in
 * `src/lib/api/generated/model`.
 */

function toExpiresAt(expiresIn: number): number {
  return Date.now() + expiresIn * 1000;
}

function toSessionUser(profile: ProfileMeResDto): SessionUser {
  return {
    id: profile.id,
    // SaleNet usernames are phone numbers; the profile exposes `phoneNumber`.
    username: profile.phoneNumber,
    email: profile.email,
    fullName: profile.fullName,
    avatar: profile.avatarUrl,
    role: profile.role,
  };
}

/** Exchange a token response for a full session (fetches the profile for /me). */
export async function sessionFromTokens(
  tokens: LoginResponseDto,
): Promise<SessionData> {
  const profile = await fetchProfile(tokens.accessToken);
  return {
    user: toSessionUser(profile),
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    expiresAt: toExpiresAt(tokens.expiresIn),
  };
}

/** POST /api/v1/auth/refresh → new tokens (keeps the old refresh if none returned). */
export async function refreshTokens(
  refreshToken: string,
): Promise<Pick<SessionData, 'accessToken' | 'refreshToken' | 'expiresAt'>> {
  const tokens = await serverFetch<TokenResponseDto>('/auth/refresh', {
    method: 'POST',
    json: { refreshToken },
  });
  return {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken ?? refreshToken,
    expiresAt: toExpiresAt(tokens.expiresIn),
  };
}

/** GET /v1/users/me with a bearer token. */
export async function fetchProfile(
  accessToken: string,
): Promise<ProfileMeResDto> {
  return serverFetch<ProfileMeResDto>('/users/me', {
    method: 'GET',
    accessToken,
  });
}

/**
 * In-flight refreshes keyed by the refresh token, so concurrent requests that
 * all hit the refresh window (page + parallel RSC/prefetch requests) share ONE
 * backend call instead of racing. Without this, a backend that rotates and
 * invalidates refresh tokens on use would reject every call after the first
 * and log the user out mid-navigation. Module state is per server instance —
 * exactly the scope on which the concurrent requests contend.
 */
const inflightRefreshes = new Map<string, Promise<SessionData>>();

/**
 * Refresh a session's tokens AND its user snapshot. Re-fetching `/users/me`
 * on every refresh is what propagates backend-side role/identity changes
 * (demotion, profile edits) into the sealed cookie — without it the snapshot
 * would live as long as the cookie. A transient profile failure keeps the
 * stale snapshot (tokens still rotate); an auth rejection bubbles so the
 * caller drops the session.
 */
export function refreshSession(session: SessionData): Promise<SessionData> {
  const { refreshToken } = session;
  if (!refreshToken) {
    return Promise.reject(new ApiError('No refresh token in session.', 401));
  }

  const existing = inflightRefreshes.get(refreshToken);
  if (existing) return existing;

  const promise = (async (): Promise<SessionData> => {
    const tokens = await refreshTokens(refreshToken);
    let user = session.user;
    try {
      user = toSessionUser(await fetchProfile(tokens.accessToken));
    } catch (error) {
      if (
        error instanceof ApiError &&
        (error.status === 401 || error.status === 403)
      ) {
        throw error; // fresh token rejected → the session is genuinely dead
      }
      console.error(
        '[session] profile refresh failed; keeping stale snapshot',
        error,
      );
    }
    return { ...session, ...tokens, user };
  })().finally(() => {
    inflightRefreshes.delete(refreshToken);
  });

  inflightRefreshes.set(refreshToken, promise);
  return promise;
}
