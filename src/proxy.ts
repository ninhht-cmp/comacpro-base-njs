import createMiddleware from 'next-intl/middleware';
import { type NextRequest, NextResponse } from 'next/server';
import { evaluateGuard, localizedFor } from '@/core/guard';
import { refreshSession } from '@/core/session/identity';
import { ApiError } from '@/lib/api/server-fetch';
import {
  isAccessTokenExpiring,
  openSession,
  sealSession,
  SESSION_COOKIE,
  sessionCookieOptions,
} from '@/core/session/session';
import {
  newVisitorId,
  VISITOR_COOKIE,
  visitorCookieOptions,
} from '@/lib/visitor';
import { routing } from '@/i18n/routing';

const intlMiddleware = createMiddleware(routing);

// Localized variants of the signup path — the only flow that needs the
// anonymous visitor id (referral attribution, see src/lib/visitor.ts).
const SIGNUP_PATHS = [
  ...new Set(routing.locales.map((locale) => localizedFor('/signup', locale))),
];

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
  // is persisted on the response for subsequent requests). `refreshSession`
  // deduplicates concurrent refreshes for the same token and re-fetches the
  // user snapshot so backend-side role/identity changes reach the cookie.
  if (session?.refreshToken && isAccessTokenExpiring(session, Date.now())) {
    try {
      session = await refreshSession(session);
      refreshedCookie = await sealSession(session);
      request.cookies.set(SESSION_COOKIE, refreshedCookie);
    } catch (error) {
      if (
        error instanceof ApiError &&
        (error.status === 400 || error.status === 401 || error.status === 403)
      ) {
        // The backend rejected the refresh token → genuinely logged out.
        session = null;
        request.cookies.delete(SESSION_COOKIE);
      } else {
        // Transient failure (network blip, 5xx, timeout — e.g. mid-deploy):
        // keep the session. We refresh ahead of expiry, so the current access
        // token is usually still valid and the next request retries. Logging
        // users out on backend hiccups is worse than one stale-token request.
        console.error('[proxy] token refresh failed transiently', error);
      }
    }
  }

  // Mint the anonymous visitor id on the signup flow only (Server Components
  // can't set cookies). Mutating the request cookie makes it visible to THIS
  // request's RSC render; applyCookies persists it for subsequent ones.
  let mintedVisitorId: string | undefined;
  if (
    SIGNUP_PATHS.includes(withoutLocale(request.nextUrl.pathname)) &&
    !request.cookies.get(VISITOR_COOKIE)?.value
  ) {
    mintedVisitorId = newVisitorId();
    request.cookies.set(VISITOR_COOKIE, mintedVisitorId);
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
    if (mintedVisitorId) {
      response.cookies.set(
        VISITOR_COOKIE,
        mintedVisitorId,
        visitorCookieOptions,
      );
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
