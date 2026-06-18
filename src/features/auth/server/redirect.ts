/**
 * Open-redirect guard for the post-sign-in `?redirect=` target.
 *
 * The value comes from a query param (set by `proxy.ts` when bouncing an
 * unauthenticated user off a protected route), so it is untrusted. We only
 * allow internal, absolute paths — never protocol-relative (`//host`) or
 * absolute URLs (`https://…`) that could redirect off-site.
 *
 * The returned value is an already-localized path (e.g. `/tai-khoan`,
 * `/en/account`), so callers navigate to it verbatim.
 */
export function safeRedirect(value: unknown): string | null {
  if (typeof value !== 'string' || value.length === 0) return null;
  // Must be an internal absolute path…
  if (!value.startsWith('/')) return null;
  // …but not protocol-relative (`//evil.com`) or a backslash trick (`/\evil`).
  if (value.startsWith('//') || value.startsWith('/\\')) return null;
  return value;
}
