import type {
  ChangePasswordDto,
  UpdateProfileDto,
} from '@/lib/api/generated/model';
import { env } from '@/config/env';

/**
 * Talks to the NestJS `users` endpoints with a plain `fetch` — same rationale
 * as the auth service: the live API returns payloads at the top level, not in
 * the generated `BaseResDto` envelope, so the orval client is skipped here.
 * Each call takes the caller's session bearer `accessToken` explicitly (the
 * shared mutator stays free of `next/headers`).
 *
 * Endpoints (see the generated client in `src/lib/api/generated/users`):
 *   PATCH  /api/v1/users/me              — update profile
 *   PATCH  /api/v1/users/change-password — change password
 *   DELETE /api/v1/users/me              — cancel (delete) account
 */

const API_PREFIX = '/api/v1';

export class UserApiError extends Error {
  override readonly name = 'UserApiError';
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
  }
}

function apiBaseUrl(): string {
  const base = env.API_BASE_URL ?? env.NEXT_PUBLIC_API_BASE_URL;
  if (!base) throw new UserApiError('API base URL is not configured.');
  return base.replace(/\/+$/, '');
}

/** Extract a human message from the backend error envelope (see auth service). */
function errorMessageFrom(body: unknown): string {
  if (typeof body === 'string' && body) return body;
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

/** Authenticated request that returns nothing useful (mutations); throws on !ok. */
async function authedRequest(
  path: string,
  accessToken: string,
  init: RequestInit,
): Promise<void> {
  const response = await fetch(`${apiBaseUrl()}${API_PREFIX}${path}`, {
    cache: 'no-store',
    ...init,
    headers: { Authorization: `Bearer ${accessToken}`, ...init.headers },
  });

  if (!response.ok) {
    const text = await response.text();
    let body: unknown;
    try {
      body = text ? JSON.parse(text) : undefined;
    } catch {
      body = text;
    }
    throw new UserApiError(errorMessageFrom(body), response.status);
  }
}

function jsonBody(
  method: 'PATCH' | 'POST' | 'PUT',
  body: unknown,
): RequestInit {
  return {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}

/** PATCH /api/v1/users/me — update the signed-in user's profile. */
export async function updateProfile(
  accessToken: string,
  dto: UpdateProfileDto,
): Promise<void> {
  await authedRequest('/users/me', accessToken, jsonBody('PATCH', dto));
}

/** PATCH /api/v1/users/change-password — change the signed-in user's password. */
export async function changePassword(
  accessToken: string,
  dto: ChangePasswordDto,
): Promise<void> {
  await authedRequest(
    '/users/change-password',
    accessToken,
    jsonBody('PATCH', dto),
  );
}

/** DELETE /api/v1/users/me — cancel (delete) the signed-in user's account. */
export async function cancelAccount(accessToken: string): Promise<void> {
  await authedRequest('/users/me', accessToken, { method: 'DELETE' });
}
