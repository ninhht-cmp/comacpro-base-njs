import type {
  LoginResponseDto,
  RegistrationDto,
  ResetPasswordDto,
  ResetTokenResDto,
  TokenResponseDto,
  UserResDto,
  VerifyOtpDto,
} from '@/lib/api/generated/model';
import { env } from '@/config/env';
import type { SessionData, SessionUser } from './session';

/**
 * Talks to the NestJS auth endpoints with a plain `fetch` — NOT the orval
 * mutator. Auth bootstrapping must not depend on the (session-reading) mutator,
 * and these calls run in contexts without `next/headers` (proxy). Generated DTO
 * types keep it type-safe against the spec.
 *
 * Endpoints live under `/api/v1` — see the generated client in
 * `src/lib/api/generated/auth-xác-thực`.
 */

const API_PREFIX = '/api/v1';

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
 * `{ statusCode, messages, data }`; we also fall back to the older
 * `{ errors: [{ messages }] }` and NestJS's default `{ message, error }`.
 */
function errorMessageFrom(body: unknown): string {
  if (body && typeof body === 'object') {
    const b = body as {
      errors?: Array<{ messages?: string[] }>;
      messages?: string | string[];
      message?: string | string[];
      error?: string;
    };
    const fromErrors = b.errors
      ?.flatMap((entry) => entry.messages ?? [])
      .filter(Boolean);
    if (fromErrors && fromErrors.length > 0) return fromErrors.join(', ');
    if (b.messages) {
      return Array.isArray(b.messages) ? b.messages.join(', ') : b.messages;
    }
    if (b.message) {
      return Array.isArray(b.message) ? b.message.join(', ') : b.message;
    }
    if (b.error) return b.error;
  }
  return 'Request failed';
}

async function apiRequest<T>(path: string, init: RequestInit): Promise<T> {
  const response = await fetch(`${apiBaseUrl()}${API_PREFIX}${path}`, {
    cache: 'no-store',
    ...init,
  });
  const text = await response.text();
  const body: unknown = text ? JSON.parse(text) : undefined;

  if (!response.ok) {
    throw new AuthError(errorMessageFrom(body), response.status);
  }
  // NOTE: the OpenAPI spec declares a `BaseResDto` envelope (`{ data, ... }`),
  // but the live auth endpoints return the payload at the top level (verified
  // against the running backend — e.g. signin → `{ accessToken, ... }`). So we
  // return the parsed body as-is rather than unwrapping a non-existent `.data`.
  return body as T;
}

function jsonPost(body: unknown): RequestInit {
  return {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}

function toExpiresAt(expiresIn: number): number {
  return Date.now() + expiresIn * 1000;
}

function toSessionUser(profile: UserResDto): SessionUser {
  return {
    id: profile.id,
    username: profile.username,
    email: profile.email,
    fullName: profile.fullName,
    avatar: profile.avatar,
    userType: profile.type,
  };
}

/** Exchange a token response for a full session (fetches the profile for /me). */
async function sessionFromTokens(
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

/** POST /api/v1/auth/signin then GET /me → a full session payload. */
export async function signIn(
  username: string,
  password: string,
): Promise<SessionData> {
  const tokens = await apiRequest<LoginResponseDto>(
    '/auth/signin',
    jsonPost({ username, password }),
  );
  return sessionFromTokens(tokens);
}

/**
 * POST /api/v1/auth/google then GET /me → a full session payload.
 * `idToken` is the Google ID token obtained client-side via Google Sign-In.
 */
export async function googleSignIn(idToken: string): Promise<SessionData> {
  const tokens = await apiRequest<LoginResponseDto>(
    '/auth/google',
    jsonPost({ idToken }),
  );
  return sessionFromTokens(tokens);
}

/** POST /api/v1/auth/refresh → new tokens (keeps the old refresh if none returned). */
export async function refreshTokens(
  refreshToken: string,
): Promise<Pick<SessionData, 'accessToken' | 'refreshToken' | 'expiresAt'>> {
  const tokens = await apiRequest<TokenResponseDto>(
    '/auth/refresh',
    jsonPost({ refreshToken }),
  );
  return {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken ?? refreshToken,
    expiresAt: toExpiresAt(tokens.expiresIn),
  };
}

/** GET /api/v1/users/me with a bearer token. */
export async function fetchProfile(accessToken: string): Promise<UserResDto> {
  return apiRequest<UserResDto>('/users/me', {
    method: 'GET',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

/** POST /api/v1/auth/signup — creates an account; an OTP is emailed to verify. */
export async function signUp(dto: RegistrationDto): Promise<void> {
  await apiRequest('/auth/signup', jsonPost(dto));
}

/** POST /api/v1/auth/verify-otp — confirms the email after signup. */
export async function verifyOtp(dto: VerifyOtpDto): Promise<void> {
  await apiRequest('/auth/verify-otp', jsonPost(dto));
}

/** POST /api/v1/auth/forgot-password — emails an OTP to reset the password. */
export async function forgotPassword(email: string): Promise<void> {
  await apiRequest('/auth/forgot-password', jsonPost({ email }));
}

/** POST /api/v1/auth/verify-forgot-otp → a short-lived reset token. */
export async function verifyForgotOtp(
  dto: VerifyOtpDto,
): Promise<ResetTokenResDto> {
  return apiRequest<ResetTokenResDto>('/auth/verify-forgot-otp', jsonPost(dto));
}

/** POST /api/v1/auth/reset-password — sets a new password using the reset token. */
export async function resetPassword(dto: ResetPasswordDto): Promise<void> {
  await apiRequest('/auth/reset-password', jsonPost(dto));
}
