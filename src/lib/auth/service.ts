import type {
  LoginResponseDto,
  ProfileResDto,
} from '@/lib/api/generated/model';
import { env } from '@/config/env';
import type { SessionData, SessionUser } from './session';

/**
 * Talks to the NestJS external-auth endpoints with a plain `fetch` — NOT the
 * orval mutator. Auth bootstrapping must not depend on the (session-reading)
 * mutator, and these calls run in contexts without `next/headers` (proxy).
 * Generated DTO types keep it type-safe against the spec.
 */

export class AuthError extends Error {
  override readonly name = 'AuthError';
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
  }
}

function apiBaseUrl(): string {
  const base = env.API_BASE_URL ?? env.NEXT_PUBLIC_API_BASE_URL;
  if (!base) throw new AuthError('API base URL is not configured.');
  return base.replace(/\/+$/, '');
}

/**
 * Extract a human message from the backend error envelope. The API returns
 * `{ statusCode, errors: [{ messages: string[] }], data: null }`; we also fall
 * back to NestJS's default `{ message, error }` shape.
 */
function errorMessageFrom(body: unknown): string {
  if (body && typeof body === 'object') {
    const b = body as {
      errors?: Array<{ messages?: string[] }>;
      message?: string | string[];
      error?: string;
    };
    const fromErrors = b.errors
      ?.flatMap((entry) => entry.messages ?? [])
      .filter(Boolean);
    if (fromErrors && fromErrors.length > 0) return fromErrors.join(', ');
    if (b.message) {
      return Array.isArray(b.message) ? b.message.join(', ') : b.message;
    }
    if (b.error) return b.error;
  }
  return 'Request failed';
}

async function apiRequest<T>(path: string, init: RequestInit): Promise<T> {
  const response = await fetch(`${apiBaseUrl()}${path}`, {
    cache: 'no-store',
    ...init,
  });
  const text = await response.text();
  const body: unknown = text ? JSON.parse(text) : undefined;

  if (!response.ok) {
    throw new AuthError(errorMessageFrom(body), response.status);
  }
  // Backend wraps payloads in `{ data, statusCode, timestamp }`.
  return (body as { data?: T } | undefined)?.data as T;
}

function toExpiresAt(expiresIn: number): number {
  return Date.now() + expiresIn * 1000;
}

function toSessionUser(profile: ProfileResDto): SessionUser {
  // `role` is declared required by the spec but absent in some real responses.
  const role = (profile as { role?: ProfileResDto['role'] }).role;
  return {
    id: profile.id,
    email: profile.email,
    fullName: profile.fullName,
    avatar: profile.avatar,
    role: role ? String(role) : undefined,
    userType: String(profile.userType),
  };
}

/** POST /v1/auth/external/signin then GET /me → a full session payload. */
export async function signIn(
  email: string,
  password: string,
): Promise<SessionData> {
  const tokens = await apiRequest<LoginResponseDto>(
    '/v1/auth/external/signin',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    },
  );
  const profile = await fetchProfile(tokens.accessToken);
  return {
    user: toSessionUser(profile),
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    expiresAt: toExpiresAt(tokens.expiresIn),
  };
}

/** POST /v1/auth/external/refresh → new tokens (keeps the old refresh if none returned). */
export async function refreshTokens(
  refreshToken: string,
): Promise<Pick<SessionData, 'accessToken' | 'refreshToken' | 'expiresAt'>> {
  const tokens = await apiRequest<LoginResponseDto>(
    '/v1/auth/external/refresh',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    },
  );
  return {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken ?? refreshToken,
    expiresAt: toExpiresAt(tokens.expiresIn),
  };
}

/** GET /v1/identities/external/users/me with a bearer token. */
export async function fetchProfile(
  accessToken: string,
): Promise<ProfileResDto> {
  return apiRequest<ProfileResDto>('/v1/identities/external/users/me', {
    method: 'GET',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}
