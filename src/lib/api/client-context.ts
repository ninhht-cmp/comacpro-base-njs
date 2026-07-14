import { headers } from 'next/headers';

/**
 * End-user context forwarded to SaleNet on the anonymous, abuse-prone calls
 * (signup, referral lookup). Every request reaches the backend from THIS
 * app's server IP, so without these headers its throttling and fraud rules
 * would key on the web app itself — one hot visitor could exhaust the quota
 * for everyone, and investigations would have no client IP to pivot on.
 *
 * Header names mirror `cmp-sm-fe` (the production referral app), which the
 * backend already consumes:
 *   - `X-Client-IP` is the authoritative one — the ingress proxy in front of
 *     the backend overwrites `X-Forwarded-For`/`X-Real-IP` with this pod's
 *     IP, so the real IP must travel in a custom header it doesn't touch.
 *   - `X-Forwarded-For`/`X-Real-IP` are still forwarded for infra that reads
 *     the standard names; `User-Agent` uses its standard name likewise.
 *   - Cloudflare's `CF-*` names are read for IP precedence but NEVER
 *     forwarded: when the backend sits behind Cloudflare, CF reserves them
 *     and blocks/strips inbound requests that carry them.
 *
 * Deliberately a separate module from `serverFetch` (which stays free of
 * `next/headers` so the middleware can share it) — callers build the context
 * where a request context exists and pass plain headers down.
 *
 * The backend must only trust these headers on requests from this app
 * (private network / shared secret) — they are client-supplied data.
 */

export interface ClientContext {
  /** Real client IP (CF-Connecting-IP → True-Client-IP → X-Real-IP → XFF[0]). */
  ip?: string;
  /** Full X-Forwarded-For chain as received, for infra that wants the hops. */
  forwardedFor?: string;
  userAgent?: string;
  /** Anonymous visitor id (src/lib/visitor.ts) — ties lookups to signups. */
  sessionId?: string;
}

/** Read the calling user's context from the current request's headers. */
export async function clientContext(
  sessionId?: string,
): Promise<ClientContext> {
  const requestHeaders = await headers();
  const forwardedFor = requestHeaders.get('x-forwarded-for') ?? undefined;
  // NOTE: Vietnamese carriers CGNAT heavily — treat the IP as an
  // investigation signal, never an identity.
  const ip =
    requestHeaders.get('cf-connecting-ip') ??
    requestHeaders.get('true-client-ip') ?? // CF Enterprise
    requestHeaders.get('x-real-ip') ??
    forwardedFor?.split(',')[0]?.trim() ??
    undefined;
  return {
    ip,
    forwardedFor,
    userAgent: requestHeaders.get('user-agent') ?? undefined,
    sessionId,
  };
}

/** The context as outbound headers for `serverFetch`. */
export function clientContextHeaders(
  context: ClientContext | undefined,
): Record<string, string> {
  if (!context) return {};
  const out: Record<string, string> = {};
  if (context.ip) {
    const ip = headerSafe(context.ip);
    // The custom name survives the backend's ingress; the standard one is a
    // courtesy for anything reading conventional headers along the way.
    out['X-Client-IP'] = ip;
    out['X-Real-IP'] = ip;
  }
  if (context.forwardedFor) {
    out['X-Forwarded-For'] = headerSafe(context.forwardedFor);
  }
  if (context.userAgent) out['User-Agent'] = headerSafe(context.userAgent);
  if (context.sessionId) {
    out['X-Client-Session'] = headerSafe(context.sessionId);
  }
  return out;
}

/**
 * Header values must be ISO-8859-1 and these come from the client (emoji
 * user-agents exist): strip anything outside printable ASCII and cap the
 * length so a hostile client can't bloat or break the outbound request.
 */
function headerSafe(value: string): string {
  return value.replace(/[^\x20-\x7E]/g, '').slice(0, 512);
}
