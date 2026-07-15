import type { ZodType } from 'zod';
import { env } from '@/config/env';
import { logger } from '@/lib/observability/logger';
import { buildCurl } from './debug';

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

/**
 * Verbose API logging (every call + a token-redacted cURL repro) is a dev-only
 * debugging aid — failures are always logged, but the success chatter and the
 * cURL stay off in production to keep log volume (and cost) sane. Backend calls
 * are server-side (RSC-first), so this console output is the only place they're
 * observable; watch the `pnpm dev` terminal, not the browser Network tab.
 */
function verboseApi(): boolean {
  return env.NODE_ENV === 'development';
}

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
 * Extract a human message from the error envelope, falling back to NestJS's
 * default `{ message, error }` shapes.
 */
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

export interface ServerFetchOptions<T = unknown> extends Omit<
  RequestInit,
  'body'
> {
  /**
   * Runtime validator for the (unwrapped) response — pass the generated zod
   * schema (`@/lib/api/generated/schemas`). Without it the payload is trusted
   * as `T` unchecked. Mismatches fail fast outside production and shadow-log
   * in production — see {@link validateResponse}.
   */
  schema?: ZodType<T>;
  /** Session bearer token; sent as `Authorization: Bearer <token>`. */
  accessToken?: string;
  /**
   * Active locale for backend-localized payloads (today: notifications).
   * The spec declares no localization header, so both `Accept-Language` and
   * `Content-Language` are sent until the backend confirms one (ADR 0003).
   */
  locale?: string;
  /** JSON convenience: serialized as the body with the right Content-Type. */
  json?: unknown;
  body?: BodyInit | null;
  timeoutMs?: number;
  /**
   * Short label for the observability log (e.g. `users:me`) — tags which
   * feature/call this is, so the server console shows what each page hit.
   */
  label?: string;
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
    label,
    // Consumed by serverFetch/serverFetchPage; must not leak into fetch init.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    schema: _schema,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    headers,
    ...init
  } = options;

  const method = (init.method ?? 'GET').toUpperCase();
  const url = `${apiBaseUrl()}${API_PREFIX}${path}`;
  // Built once so the same header set feeds both the request and the cURL repro.
  const outgoingHeaders: Record<string, string> = {
    ...(json !== undefined ? { 'Content-Type': 'application/json' } : {}),
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    ...(locale
      ? { 'Accept-Language': locale, 'Content-Language': locale }
      : {}),
    ...(headers as Record<string, string> | undefined),
  };
  const tag = label ? `${method} ${path} [${label}]` : `${method} ${path}`;
  const startedAt = Date.now();
  const elapsed = () => Date.now() - startedAt;

  // Errors are always logged (structured JSON in prod); the paste-ready,
  // token-redacted cURL repro is dev-only — see `verboseApi`.
  const logFailure = (status: number | undefined, message: string): void => {
    logger.error(
      'api',
      `✗ ${status ?? 'ERR'} ${tag} · ${elapsed()}ms — ${message}`,
    );
    if (verboseApi()) {
      logger.error(
        'api',
        `↳ repro:\n  ${buildCurl(method, url, outgoingHeaders, json)}`,
      );
    }
  };

  let response: Response;
  try {
    response = await fetch(url, {
      cache: 'no-store',
      signal: AbortSignal.timeout(timeoutMs),
      ...init,
      ...(json !== undefined ? { body: JSON.stringify(json) } : {}),
      headers: outgoingHeaders,
    });
  } catch (error) {
    // Normalize the timeout abort so callers can treat it like any upstream
    // failure (a DOMException would otherwise leak through catch blocks that
    // only understand ApiError).
    if (error instanceof DOMException && error.name === 'TimeoutError') {
      logFailure(504, `upstream timed out after ${timeoutMs}ms`);
      throw new ApiError('Upstream API timed out', 504);
    }
    logFailure(
      undefined,
      error instanceof Error ? error.message : String(error),
    );
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
    const message = errorMessageFrom(body);
    logFailure(response.status, message);
    throw new ApiError(message, response.status);
  }

  const envelope = isEnvelope(body) ? body : null;
  // `success: false` with HTTP 200 hasn't been observed on the live API but
  // the field exists for a reason — treat it as an error rather than handing
  // the UI an envelope-shaped payload.
  if (envelope?.success === false) {
    const status =
      typeof envelope.statusCode === 'number'
        ? envelope.statusCode
        : response.status;
    const message = errorMessageFrom(body);
    logFailure(status, message);
    throw new ApiError(message, status);
  }

  if (verboseApi()) {
    logger.debug('api', `✓ ${response.status} ${tag} · ${elapsed()}ms`);
  }
  return { body, envelope };
}

/**
 * Validate an unwrapped payload against the caller's schema. Two-phase
 * rollout on purpose (ADR 0002's runtime-validation debt):
 * - dev/test: THROW — contract drift fails fast, in front of the developer
 *   and CI (whose MSW mocks must therefore stay spec-accurate).
 * - production: shadow mode — log loudly (Sentry-able) but return the raw
 *   payload, because the spec's field-level accuracy against the live API is
 *   not yet proven end-to-end; breaking a page over a mislabeled optional
 *   field is worse than one structured error line. Flip to always-throw once
 *   prod logs show zero mismatches.
 */
function validateResponse<T>(
  data: T,
  options: ServerFetchOptions<T>,
  path: string,
): T {
  const { schema, label } = options;
  if (!schema) return data;
  const parsed = schema.safeParse(data);
  if (parsed.success) return parsed.data;

  const method = (options.method ?? 'GET').toUpperCase();
  const tag = label ? `${method} ${path} [${label}]` : `${method} ${path}`;
  logger.error('api', `✗ response shape mismatch ${tag}`, {
    issues: parsed.error.issues,
  });
  if (env.NODE_ENV === 'production') return data;
  throw new ApiError(`Upstream response shape mismatch on ${tag}`, 502);
}

/** Request + unwrap: returns the envelope's `data` (or the raw body). */
export async function serverFetch<T>(
  path: string,
  options: ServerFetchOptions<T> = {},
): Promise<T> {
  const { body, envelope } = await fetchEnvelope(path, options);
  return validateResponse(
    (envelope ? envelope.data : body) as T,
    options,
    path,
  );
}

/**
 * List variant of {@link serverFetch}: SaleNet list endpoints carry a
 * `pagination` object BESIDE `data` in the envelope, which the plain unwrap
 * would discard. Returns both.
 */
export async function serverFetchPage<T>(
  path: string,
  options: ServerFetchOptions<T> = {},
): Promise<{ data: T; pagination?: ApiPagination }> {
  const { envelope } = await fetchEnvelope(path, options);
  if (!envelope) {
    throw new ApiError(
      `Expected a paginated envelope from ${path} but got a bare payload.`,
    );
  }
  return {
    data: validateResponse(envelope.data as T, options, path),
    pagination: envelope.pagination as ApiPagination | undefined,
  };
}
