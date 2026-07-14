/**
 * Open-redirect guard for the post-sign-in `?redirect=` target.
 *
 * The value comes from a query param (set by `proxy.ts` when bouncing an
 * unauthenticated user off a protected route), so it is untrusted. We only
 * allow internal, absolute paths — never protocol-relative (`//host`) or
 * absolute URLs (`https://…`) that could redirect off-site.
 *
 * The returned value is an already-localized path (e.g. `/account`), so
 * callers navigate to it verbatim.
 */
export function safeRedirect(value: unknown): string | null {
  if (typeof value !== 'string' || value.length === 0) return null;
  // Must be an internal absolute path…
  if (!value.startsWith('/')) return null;
  // …with nothing a browser could reinterpret: control chars and whitespace
  // are stripped by URL parsers (`/\t/evil.com` → `//evil.com`), and `\` is
  // treated as `/` in URLs, so any occurrence anywhere is rejected outright.
  if (/[\u0000-\u001f\u007f\s\\]/.test(value)) return null;
  // Prefix checks alone are bypassable; the authority on how a browser will
  // resolve the value is the URL parser itself. Resolve against a fixed dummy
  // origin and require the result to stay on it — anything that escapes
  // (protocol-relative forms, absolute URLs, exotic schemes) changes origin.
  let resolved: URL;
  try {
    resolved = new URL(value, 'https://redirect-guard.invalid');
  } catch {
    return null;
  }
  if (resolved.origin !== 'https://redirect-guard.invalid') return null;
  return value;
}
