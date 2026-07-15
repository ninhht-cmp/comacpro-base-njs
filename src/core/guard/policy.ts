import { routing } from '@/i18n/routing';

/**
 * Access-control policy — pure and **edge-safe** (no `next/headers`, no I/O), so
 * the middleware can call it and unit tests can exercise it in isolation.
 *
 * Defines which logical routes require a session vs. which a signed-in user
 * shouldn't see, and reduces a (locale-stripped) path + auth state to a
 * decision. URL building / redirects stay with the caller (`src/proxy.ts` for
 * the edge, `./require` for Server Components).
 */

export type PathKey = keyof typeof routing.pathnames;

// Localized variants are derived from `routing.pathnames`, so renaming a path in
// one place keeps the guards correct in every locale.
export const PROTECTED_HREFS = [
  '/account',
  '/notifications',
  '/referrals',
] as const satisfies PathKey[];

export const AUTH_HREFS = ['/signin', '/signup'] as const satisfies PathKey[];

/** The localized path for a logical href in a given locale (e.g. `/account`). */
export function localizedFor(href: PathKey, locale: string): string {
  const entry = routing.pathnames[href];
  if (typeof entry === 'string') return entry;
  return (entry as Record<string, string>)[locale] ?? href;
}

/** Every localized path variant of the given hrefs, across all locales. */
function localizedPaths(hrefs: readonly PathKey[]): string[] {
  const out: string[] = [];
  for (const href of hrefs) {
    const entry = routing.pathnames[href];
    if (typeof entry === 'string') out.push(entry);
    else for (const value of Object.values(entry)) out.push(value as string);
  }
  return out;
}

export const PROTECTED_PATHS = localizedPaths(PROTECTED_HREFS);
export const AUTH_PATHS = localizedPaths(AUTH_HREFS);

function matchesBase(path: string, bases: string[]): boolean {
  return bases.some((base) => path === base || path.startsWith(`${base}/`));
}

export type GuardDecision =
  | { type: 'allow' }
  | { type: 'redirect'; to: '/signin' | '/account' };

/**
 * Decide what to do for a request, given the **locale-stripped** path and
 * whether a valid session exists. Pure: the caller resolves `to` into a
 * localized URL and performs the redirect.
 */
export function evaluateGuard(
  path: string,
  hasSession: boolean,
): GuardDecision {
  // Not signed in → keep out of protected routes.
  if (matchesBase(path, PROTECTED_PATHS) && !hasSession) {
    return { type: 'redirect', to: '/signin' };
  }
  // Already signed in → keep out of the auth routes.
  if (matchesBase(path, AUTH_PATHS) && hasSession) {
    return { type: 'redirect', to: '/account' };
  }
  return { type: 'allow' };
}
