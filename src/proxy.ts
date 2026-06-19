import createMiddleware from 'next-intl/middleware';
import { type NextRequest, NextResponse } from 'next/server';
import { evaluateGuard, localizedFor } from '@/core/guard';
import { refreshTokens } from '@/core/session/identity';
import {
  isAccessTokenExpiring,
  openSession,
  sealSession,
  SESSION_COOKIE,
  sessionCookieOptions,
} from '@/core/session/session';
import { routing } from '@/i18n/routing';

const intlMiddleware = createMiddleware(routing);

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

  // Access-control decision is owned by the (pure, edge-safe) guard policy;
  // this tier just resolves the target URL and carries the cookie.
  const decision = evaluateGuard(
    withoutLocale(request.nextUrl.pathname),
    !!session,
  );
  if (decision.type === 'redirect') {
    const url =
      decision.to === '/signin' ? signinUrl(request) : accountUrl(request);
    return applyCookies(NextResponse.redirect(url));
  }

  // Locale routing owns the normal response.
  return applyCookies(intlMiddleware(request));
}

export const config = {
  // Match all paths except Next internals, API routes, and static files.
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
