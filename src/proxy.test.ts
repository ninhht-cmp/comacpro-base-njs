import { NextRequest, NextResponse } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/lib/api/server-fetch';
import { refreshSession } from '@/core/session/identity';
import {
  openSession,
  sealSession,
  SESSION_COOKIE,
} from '@/core/session/session';
import { VISITOR_COOKIE } from '@/lib/visitor';
import { proxy } from './proxy';

/**
 * proxy() orchestrates guard + proactive token refresh. We stub the session
 * transport (jose JWE is realm-hostile under jsdom) and the identity refresh
 * so each branch is deterministic; the guard policy + next-intl middleware
 * stay REAL. A cookie value here is just a JSON session (openSession parses).
 */
// next-intl's ESM middleware imports a bare `next/server` that vitest can't
// resolve; stub it — it owns locale routing (its own tested concern), while
// this suite exercises proxy's guard + refresh orchestration around it.
vi.mock('next-intl/middleware', () => ({
  default: () => () => NextResponse.next(),
}));
vi.mock('@/core/session/identity', () => ({ refreshSession: vi.fn() }));
vi.mock('@/core/session/session', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@/core/session/session')>();
  return { ...actual, openSession: vi.fn(), sealSession: vi.fn() };
});

const openSessionMock = vi.mocked(openSession);
const sealSessionMock = vi.mocked(sealSession);
const refreshSessionMock = vi.mocked(refreshSession);

beforeEach(() => {
  vi.clearAllMocks();
  openSessionMock.mockImplementation(async (v?: string) =>
    v ? JSON.parse(v) : null,
  );
  sealSessionMock.mockResolvedValue('sealed-cookie-value');
});

function request(path: string, cookie?: string): NextRequest {
  const req = new NextRequest(new URL(`http://localhost${path}`));
  if (cookie) req.cookies.set(SESSION_COOKIE, cookie);
  return req;
}

function session(overrides: Record<string, unknown> = {}): string {
  return JSON.stringify({
    user: { id: 'u1', role: 'sm-saler' },
    accessToken: 'at',
    refreshToken: 'rt',
    expiresAt: Date.now() + 5 * 60_000, // comfortably valid unless overridden
    ...overrides,
  });
}
const EXPIRING = { expiresAt: Date.now() + 30_000 }; // within the 60s threshold

describe('proxy middleware', () => {
  it('redirects an anonymous user off a protected route to /signin (remembering the target)', async () => {
    const res = await proxy(request('/account'));
    expect(res.status).toBe(307);
    const location = res.headers.get('location') ?? '';
    expect(location).toContain('/signin');
    expect(location).toContain('redirect=%2Faccount');
    expect(refreshSessionMock).not.toHaveBeenCalled();
  });

  it('redirects a signed-in user away from an auth route to /account', async () => {
    const res = await proxy(request('/signin', session()));
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('/account');
  });

  it('lets a valid, non-expiring session through without refreshing or rewriting the cookie', async () => {
    const res = await proxy(request('/account', session()));
    expect(res.status).not.toBe(307);
    expect(refreshSessionMock).not.toHaveBeenCalled();
    expect(res.cookies.get(SESSION_COOKIE)).toBeUndefined();
  });

  it('proactively refreshes an expiring token and persists the resealed cookie', async () => {
    refreshSessionMock.mockResolvedValue({
      user: { id: 'u1', role: 'sm-saler' },
      accessToken: 'new',
      refreshToken: 'new-rt',
      expiresAt: Date.now() + 3_600_000,
    });
    const res = await proxy(request('/account', session(EXPIRING)));
    expect(refreshSessionMock).toHaveBeenCalledOnce();
    expect(res.cookies.get(SESSION_COOKIE)?.value).toBe('sealed-cookie-value');
  });

  it('keeps the session on a transient (5xx) refresh failure instead of logging out', async () => {
    refreshSessionMock.mockRejectedValue(new ApiError('down', 503));
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const res = await proxy(request('/account', session(EXPIRING)));
    expect(res.status).not.toBe(307); // still allowed through
    expect(res.cookies.get(SESSION_COOKIE)).toBeUndefined(); // neither rewritten nor cleared
    expect(errSpy).toHaveBeenCalled();
  });

  it('clears the session and redirects when the refresh token is rejected (4xx)', async () => {
    refreshSessionMock.mockRejectedValue(new ApiError('gone', 401));
    const res = await proxy(request('/account', session(EXPIRING)));
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('/signin');
    const cleared = res.cookies.get(SESSION_COOKIE);
    expect(cleared?.value === '' || cleared?.maxAge === 0).toBe(true);
  });

  it('mints an anonymous visitor id on the signup path', async () => {
    const res = await proxy(request('/signup'));
    expect(res.cookies.get(VISITOR_COOKIE)?.value).toBeTruthy();
  });
});
