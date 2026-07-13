import { env } from '@/config/env';

/**
 * The single server-side transport for the SaleNet (BE SM Service) API. Every
 * server module (RSC services, Server Actions, the middleware's token refresh)
 * goes through {@link serverFetch} so base-URL resolution, auth/locale headers,
 * timeouts and envelope handling exist exactly once.
 *
 * Deliberately edge-safe: no `next/headers`, no Node-only imports — the same
 * convention as `core/session/session.ts` — so `src/proxy.ts` can use it. The
 * caller passes the bearer token explicitly (read from the session cookie by
 * `core/session/cookies.ts` in Server Component/Action contexts).
 *
 * Every SaleNet response is wrapped in the `BaseResDto` envelope
 * `{ success, data, messages, statusCode }` — verified against the live API
 * (both success and error paths). {@link serverFetch} unwraps it and returns
 * `data`; failures (`!response.ok` or `success: false`) throw {@link ApiError}
 * with the envelope's messages. See docs/adr/0003-salenet-backend.md.
 */

const API_PREFIX = '/v1';

/** A hung backend must fail the request, not hang the RSC render. */
const DEFAULT_TIMEOUT_MS = 10_000;

export class ApiError extends Error {
  override readonly name = 'ApiError';
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
  }
}

function apiBaseUrl(): string {
  const base = env.API_BASE_URL ?? env.NEXT_PUBLIC_API_BASE_URL;
  if (!base) throw new ApiError('API base URL is not configured.');
  return base.replace(/\/+$/, '');
}

/**
 * Extract a human message from the backend error envelope. The API returns
 * `{ statusCode, messages, data }`; we also fall back to the older
 * `{ errors: [{ messages }] }` and NestJS's default `{ message, error }`.
 */
export function errorMessageFrom(body: unknown): string {
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

export interface ServerFetchOptions extends Omit<RequestInit, 'body'> {
  /** Session bearer token; sent as `Authorization: Bearer <token>`. */
  accessToken?: string;
  /**
   * Active locale for endpoints whose payloads the backend localizes (today:
   * notifications). ⚠️ UNVERIFIED CONTRACT: the SaleNet spec declares no
   * localization header at all, so we send BOTH conventions — the standard
   * `Accept-Language` and the previous backend's `Content-Language` — until
   * the backend team confirms which (if either) is honored. Harmless when
   * ignored. See docs/adr/0003-salenet-backend.md.
   */
  locale?: string;
  /** JSON convenience: serialized as the body with the right Content-Type. */
  json?: unknown;
  body?: BodyInit | null;
  timeoutMs?: number;
}

interface Envelope {
  success: boolean;
  data: unknown;
  messages?: unknown;
  statusCode?: number;
  pagination?: unknown;
}

/** SaleNet list-envelope pagination (`PaginationResDto`). */
export interface ApiPagination {
  currentPage?: number;
  perPage?: number;
  pageItems?: number;
  totalPage?: number;
  totalItem: number;
}

function isEnvelope(body: unknown): body is Envelope {
  return (
    typeof body === 'object' &&
    body !== null &&
    'success' in body &&
    'data' in body &&
    typeof (body as { success: unknown }).success === 'boolean'
  );
}

/**
 * Shared tail of both fetch variants: perform the request, parse the body,
 * throw {@link ApiError} on HTTP or envelope-level failure, and return the
 * (validated) envelope — or the raw body for non-enveloped responses.
 */
async function fetchEnvelope(
  path: string,
  options: ServerFetchOptions,
): Promise<{ body: unknown; envelope: Envelope | null }> {
  const {
    accessToken,
    locale,
    json,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    headers,
    ...init
  } = options;

  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl()}${API_PREFIX}${path}`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(timeoutMs),
      ...init,
      ...(json !== undefined ? { body: JSON.stringify(json) } : {}),
      headers: {
        ...(json !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...(locale
          ? { 'Accept-Language': locale, 'Content-Language': locale }
          : {}),
        ...headers,
      },
    });
  } catch (error) {
    // Normalize the timeout abort so callers can treat it like any upstream
    // failure (a DOMException would otherwise leak through catch blocks that
    // only understand ApiError).
    if (error instanceof DOMException && error.name === 'TimeoutError') {
      throw new ApiError('Upstream API timed out', 504);
    }
    throw error;
  }

  const text = await response.text();
  let body: unknown;
  try {
    body = text ? JSON.parse(text) : undefined;
  } catch {
    body = text;
  }

  if (!response.ok) {
    throw new ApiError(errorMessageFrom(body), response.status);
  }

  if (isEnvelope(body)) {
    // `success: false` with HTTP 200 hasn't been observed on the live API but
    // the field exists for a reason — treat it as an error rather than
    // handing the UI an envelope-shaped payload.
    if (body.success === false) {
      throw new ApiError(
        errorMessageFrom(body),
        typeof body.statusCode === 'number' ? body.statusCode : response.status,
      );
    }
    return { body, envelope: body };
  }
  return { body, envelope: null };
}

/** Request + unwrap: returns the envelope's `data` (or the raw body). */
export async function serverFetch<T>(
  path: string,
  options: ServerFetchOptions = {},
): Promise<T> {
  const { body, envelope } = await fetchEnvelope(path, options);
  return (envelope ? envelope.data : body) as T;
}

/**
 * List variant of {@link serverFetch}: SaleNet list endpoints carry a
 * `pagination` object BESIDE `data` in the envelope, which the plain unwrap
 * would discard. Returns both.
 */
export async function serverFetchPage<T>(
  path: string,
  options: ServerFetchOptions = {},
): Promise<{ data: T; pagination?: ApiPagination }> {
  const { envelope } = await fetchEnvelope(path, options);
  if (!envelope) {
    throw new ApiError(
      `Expected a paginated envelope from ${path} but got a bare payload.`,
    );
  }
  return {
    data: envelope.data as T,
    pagination: envelope.pagination as ApiPagination | undefined,
  };
}
