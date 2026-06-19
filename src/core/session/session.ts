import { createHash } from 'node:crypto';
import { EncryptJWT, jwtDecrypt } from 'jose';
import { env } from '@/config/env';

/**
 * Encrypted (JWE) session payload stored in an httpOnly cookie. The backend
 * (NestJS) is the token issuer; we just hold its tokens securely, forward them
 * to the API and refresh them. Encrypting (not just signing) keeps the refresh
 * token unreadable even if the cookie leaks.
 *
 * This module is transport-agnostic (no `next/headers`) so it can be used both
 * in Server Components/Actions (via `./cookies`) and in `proxy.ts`.
 */

export const SESSION_COOKIE = 'cmp_session';

/** Refresh the access token once it is within this window of expiring. */
export const REFRESH_THRESHOLD_MS = 60_000;

export interface SessionUser {
  id: number;
  username?: string;
  email?: string;
  fullName?: string;
  avatar?: string;
  /** Numeric account type from the API (`UserResDto.type`). */
  userType?: number;
}

export interface SessionData {
  user: SessionUser;
  accessToken: string;
  refreshToken?: string;
  /** Unix epoch (ms) at which the access token expires. */
  expiresAt: number;
}

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

function getKey(): Uint8Array {
  const secret = env.AUTH_SECRET;
  if (!secret) {
    throw new Error(
      'AUTH_SECRET is not set — required to encrypt the session cookie. ' +
        'Generate one with `npx auth secret` or `openssl rand -hex 32`.',
    );
  }
  // Derive a fixed 32-byte key for A256GCM regardless of the secret's length.
  return createHash('sha256').update(secret).digest();
}

export async function sealSession(data: SessionData): Promise<string> {
  return new EncryptJWT({ session: data })
    .setProtectedHeader({ alg: 'dir', enc: 'A256GCM' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .encrypt(getKey());
}

export async function openSession(
  token: string | undefined,
): Promise<SessionData | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtDecrypt<{ session: SessionData }>(
      token,
      getKey(),
    );
    const session = payload.session;
    if (!session || typeof session.accessToken !== 'string' || !session.user) {
      return null;
    }
    return session;
  } catch {
    // Tampered, expired (JWE exp) or signed with an old secret → no session.
    return null;
  }
}

export function isAccessTokenExpiring(
  session: SessionData,
  now: number,
): boolean {
  return session.expiresAt - now <= REFRESH_THRESHOLD_MS;
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: env.NODE_ENV === 'production',
  path: '/',
  maxAge: SESSION_MAX_AGE_SECONDS,
};
