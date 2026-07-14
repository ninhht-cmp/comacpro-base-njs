import { env } from '@/config/env';

/**
 * Minimal server/edge logger — the single place log formatting lives (every
 * module previously hand-rolled a `console.*` with its own `[scope]` prefix,
 * drifting in shape).
 *
 * NOT client-safe: it reads the server-only `NODE_ENV`. Use it in RSC, Server
 * Actions, Route Handlers, services and the middleware — never in a client
 * component (client telemetry goes through `report-web-vitals`).
 *
 * - development → readable `[scope] message` lines (+ any extra payload), so
 *   the `pnpm dev` terminal is legible while debugging.
 * - otherwise   → one structured JSON line per call, so a log pipeline
 *   (Datadog / Sentry) can parse and alert — the same shape `onRequestError`
 *   already emits.
 */
type Level = 'debug' | 'info' | 'warn' | 'error';

const isDev = env.NODE_ENV === 'development';

/** Errors don't JSON-serialize usefully (message/stack are non-enumerable). */
function normalize(data: unknown): unknown {
  if (data instanceof Error) return { error: data.message, stack: data.stack };
  return data;
}

function emit(
  level: Level,
  scope: string,
  message: string,
  data?: unknown,
): void {
  const sink =
    level === 'error'
      ? console.error
      : level === 'warn'
        ? console.warn
        : level === 'debug'
          ? console.debug
          : console.info;

  if (isDev) {
    const line = `[${scope}] ${message}`;
    if (data === undefined) sink(line);
    else sink(line, normalize(data));
    return;
  }

  const norm = normalize(data);
  const payload: Record<string, unknown> = { level, scope, message };
  if (norm !== undefined) {
    if (norm && typeof norm === 'object') Object.assign(payload, norm);
    else payload.data = norm;
  }
  (level === 'error' ? console.error : console.log)(JSON.stringify(payload));
}

export const logger = {
  debug: (scope: string, message: string, data?: unknown) =>
    emit('debug', scope, message, data),
  info: (scope: string, message: string, data?: unknown) =>
    emit('info', scope, message, data),
  warn: (scope: string, message: string, data?: unknown) =>
    emit('warn', scope, message, data),
  error: (scope: string, message: string, data?: unknown) =>
    emit('error', scope, message, data),
};
