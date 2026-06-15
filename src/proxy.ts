import createMiddleware from 'next-intl/middleware';
import { type NextRequest, NextResponse } from 'next/server';
import { routing } from '@/i18n/routing';
import { refreshTokens } from '@/lib/auth/service';
import {
  isAccessTokenExpiring,
  openSession,
  sealSession,
  SESSION_COOKIE,
  sessionCookieOptions,
} from '@/lib/auth/session';

const intlMiddleware = createMiddleware(routing);

// Localized segments that require a session (see i18n/routing `pathnames`):
// account → /account | /tai-khoan, checkout → /checkout | /thanh-toan.
const PROTECTED_PATTERN =
  /(?:^|\/)(account|tai-khoan|checkout|thanh-toan)(?:\/|$)/;

function loginUrl(request: NextRequest): URL {
  const { pathname } = request.nextUrl;
  const matched = pathname.match(/^\/([a-z]{2})(?:\/|$)/);
  const locale =
    matched && routing.locales.includes(matched[1] as never)
      ? matched[1]
      : routing.defaultLocale;
  // `localePrefix: 'as-needed'` → the default locale has no prefix.
  const prefix = locale === routing.defaultLocale ? '' : `/${locale}`;
  const url = new URL(`${prefix}/login`, request.url);
  url.searchParams.set('redirect', pathname);
  return url;
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

  if (PROTECTED_PATTERN.test(request.nextUrl.pathname) && !session) {
    return NextResponse.redirect(loginUrl(request));
  }

  // Locale routing owns the response.
  const response = intlMiddleware(request);

  if (refreshedCookie) {
    response.cookies.set(SESSION_COOKIE, refreshedCookie, sessionCookieOptions);
  } else if (!session && cookieValue) {
    response.cookies.delete(SESSION_COOKIE);
  }

  return response;
}

export const config = {
  // Match all paths except Next internals, API routes, and static files.
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
