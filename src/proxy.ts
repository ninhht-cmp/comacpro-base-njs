import createMiddleware from 'next-intl/middleware';
import { type NextRequest, NextResponse } from 'next/server';
import { routing } from '@/i18n/routing';
import { refreshTokens } from '@/features/auth/server/service';
import {
  isAccessTokenExpiring,
  openSession,
  sealSession,
  SESSION_COOKIE,
  sessionCookieOptions,
} from '@/features/auth/server/session';

const intlMiddleware = createMiddleware(routing);

type PathKey = keyof typeof routing.pathnames;

// Logical routes that require a session vs. routes a signed-in user shouldn't
// see. Localized variants are derived from `routing.pathnames`, so renaming a
// path in one place keeps the guards correct in every locale.
const PROTECTED_HREFS = ['/account', '/checkout'] as const satisfies PathKey[];
const AUTH_HREFS = [
  '/signin',
  '/signup',
  '/verify-otp',
  '/forgot-password',
  '/verify-forgot-otp',
  '/reset-password',
] as const satisfies PathKey[];

/** The localized path for a logical href in a given locale (e.g. `/tai-khoan`). */
function localizedFor(href: PathKey, locale: string): string {
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

const PROTECTED_PATHS = localizedPaths(PROTECTED_HREFS);
const AUTH_PATHS = localizedPaths(AUTH_HREFS);

function localeOf(request: NextRequest): string {
  const code = request.nextUrl.pathname.match(/^\/([a-z]{2})(?:\/|$)/)?.[1];
  return code && routing.locales.includes(code as never)
    ? code
    : routing.defaultLocale;
}

/** Prefix a path with the locale (default locale has no prefix — `as-needed`). */
function withLocale(locale: string, path: string): string {
  return locale === routing.defaultLocale ? path : `/${locale}${path}`;
}

/** Strip a leading `/<locale>` so the path can be matched against logical bases. */
function withoutLocale(pathname: string): string {
  const code = pathname.match(/^\/([a-z]{2})(?:\/|$)/)?.[1];
  if (code && routing.locales.includes(code as never)) {
    const rest = pathname.slice(code.length + 1);
    return rest === '' ? '/' : rest;
  }
  return pathname;
}

function matchesBase(path: string, bases: string[]): boolean {
  return bases.some((base) => path === base || path.startsWith(`${base}/`));
}

function signinUrl(request: NextRequest): URL {
  const locale = localeOf(request);
  const url = new URL(
    withLocale(locale, localizedFor('/signin', locale)),
    request.url,
  );
  // Remember where they were headed so sign-in can send them back.
  url.searchParams.set('redirect', request.nextUrl.pathname);
  return url;
}

function accountUrl(request: NextRequest): URL {
  const locale = localeOf(request);
  return new URL(
    withLocale(locale, localizedFor('/account', locale)),
    request.url,
  );
}

export async function proxy(request: NextRequest) {
  const cookieValue = request.cookies.get(SESSION_COOKIE)?.value;
  let session = await openSession(cookieValue);
  let refreshedCookie: string | undefined;

  // Proactively refresh while the current access token is still valid (the
  // threshold gives this request's downstream calls a valid token; the new one
  // is persisted on the response for subsequent requests).
  if (session?.refreshToken && isAccessTokenExpiring(session, Date.now())) {
    try {
      const tokens = await refreshTokens(session.refreshToken);
      session = { ...session, ...tokens };
      refreshedCookie = await sealSession(session);
      request.cookies.set(SESSION_COOKIE, refreshedCookie);
    } catch {
      session = null; // refresh failed → treat as logged out
      request.cookies.delete(SESSION_COOKIE);
    }
  }

  // Persist a refreshed cookie / clear a dead one on whatever response we send.
  const applyCookies = (response: NextResponse): NextResponse => {
    if (refreshedCookie) {
      response.cookies.set(
        SESSION_COOKIE,
        refreshedCookie,
        sessionCookieOptions,
      );
    } else if (!session && cookieValue) {
      response.cookies.delete(SESSION_COOKIE);
    }
    return response;
  };

  const path = withoutLocale(request.nextUrl.pathname);

  // Not signed in → keep out of protected routes (remember the intended path).
  if (matchesBase(path, PROTECTED_PATHS) && !session) {
    return applyCookies(NextResponse.redirect(signinUrl(request)));
  }

  // Already signed in → keep out of the auth routes.
  if (matchesBase(path, AUTH_PATHS) && session) {
    return applyCookies(NextResponse.redirect(accountUrl(request)));
  }

  // Locale routing owns the normal response.
  return applyCookies(intlMiddleware(request));
}

export const config = {
  // Match all paths except Next internals, API routes, and static files.
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
