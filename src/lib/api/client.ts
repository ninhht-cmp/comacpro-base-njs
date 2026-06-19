import ky, { HTTPError, type KyInstance, type Options } from 'ky';
import { env } from '@/config/env';

/**
 * Custom HTTP transport for the `orval`-generated API client.
 *
 * `orval` generates query/mutation hooks that call {@link customInstance} with
 * an axios-style request config; here we adapt that to `ky`. This is the single
 * place where base URL, retries, locale and (later) auth headers are wired in.
 *
 * @see orval.config.ts — `override.mutator` points at this file.
 */

type HttpMethod =
  | 'get'
  | 'post'
  | 'put'
  | 'patch'
  | 'delete'
  | 'head'
  | 'options';

type QueryParamValue = string | number | boolean | null | undefined;

/** Shape orval passes as the first argument to the mutator. */
export interface RequestConfig {
  url: string;
  method: Uppercase<HttpMethod> | HttpMethod;
  params?: Record<string, QueryParamValue | QueryParamValue[]>;
  data?: unknown;
  headers?: HeadersInit;
  responseType?: 'json' | 'text' | 'blob' | 'arraybuffer';
  signal?: AbortSignal;
}

/** Per-call `ky` overrides (exposed to hooks via orval's `request` option). */
export type RequestOptions = Omit<
  Options,
  'method' | 'json' | 'searchParams' | 'signal' | 'baseUrl' | 'prefix'
>;

/** Normalised error thrown for every non-2xx response. */
export class ApiError<TData = unknown> extends Error {
  override readonly name = 'ApiError';

  constructor(
    message: string,
    readonly status: number,
    readonly data: TData,
  ) {
    super(message);
  }
}

// Error/body type aliases consumed by the generated hooks (orval convention).
export type ErrorType<TData = unknown> = ApiError<TData>;
export type BodyType<TBody> = TBody;

/**
 * Server code may use the secret server base URL; the browser bundle must only
 * ever see the public one (reading a server-only `env` key throws in t3-env).
 */
function resolveBaseUrl(): string {
  if (typeof window === 'undefined') {
    return env.API_BASE_URL ?? env.NEXT_PUBLIC_API_BASE_URL ?? '';
  }
  return env.NEXT_PUBLIC_API_BASE_URL ?? '';
}

/**
 * `ky`'s `baseUrl` resolves the input via URL semantics, so a trailing slash is
 * required for base URLs that carry a path (e.g. `…/api/v1`) to be preserved.
 */
function withTrailingSlash(url: string): string {
  return url.endsWith('/') ? url : `${url}/`;
}

function toSearchParams(
  params: RequestConfig['params'],
): URLSearchParams | undefined {
  if (!params) return undefined;
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item !== undefined && item !== null)
          search.append(key, String(item));
      }
    } else {
      search.append(key, String(value));
    }
  }
  return [...search.keys()].length > 0 ? search : undefined;
}

let cachedClient: KyInstance | undefined;

function getClient(): KyInstance {
  if (cachedClient) return cachedClient;
  const baseUrl = resolveBaseUrl();
  cachedClient = ky.create({
    ...(baseUrl ? { baseUrl: withTrailingSlash(baseUrl) } : {}),
    // Retry idempotent reads only; mutations must not auto-retry.
    retry: { limit: 2, methods: ['get'] },
    hooks: {
      beforeRequest: [
        ({ request }) => {
          // Browser: forward the active locale so the API can localise.
          // This mutator is shared with client bundles, so it must stay free of
          // server-only imports (`next/headers`). Server-side auth is attached
          // explicitly by the caller via the per-request `headers` option — see
          // `authorizedRequest()` in `@/core/session/server`.
          if (
            typeof window !== 'undefined' &&
            !request.headers.has('accept-language')
          ) {
            const lang = document.documentElement.lang;
            if (lang) request.headers.set('Accept-Language', lang);
          }
        },
      ],
    },
  });
  return cachedClient;
}

export async function customInstance<T>(
  { url, method, params, data, headers, responseType, signal }: RequestConfig,
  options?: RequestOptions,
): Promise<T> {
  // Strip the leading slash so the path stays relative to `baseUrl` (an
  // origin-relative `/path` would otherwise drop any base path segment).
  const input = url.replace(/^\/+/, '');

  try {
    const response = await getClient()(input, {
      ...options,
      method: method.toUpperCase(),
      searchParams: toSearchParams(params),
      ...(data === undefined ? {} : { json: data }),
      headers,
      signal,
    });

    if (response.status === 204 || responseType === 'blob') {
      return (responseType === 'blob' ? await response.blob() : undefined) as T;
    }
    if (responseType === 'text') return (await response.text()) as T;

    const body = await response.text();
    return (body ? JSON.parse(body) : undefined) as T;
  } catch (error) {
    if (error instanceof HTTPError) {
      let payload: unknown;
      try {
        payload = await error.response.clone().json();
      } catch {
        payload = undefined;
      }
      throw new ApiError(error.message, error.response.status, payload);
    }
    throw error;
  }
}

export default customInstance;
