// @vitest-environment node
// Edge/server identity flows (share the transport with the middleware).
import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/lib/api/server-fetch';
import { server } from '@/mocks/server';
import { refreshSession } from './identity';
import type { SessionData } from './session';

function envelope(data: unknown) {
  return { success: true, data, messages: 'OK', statusCode: 200 };
}

function sessionWith(refreshToken: string): SessionData {
  return {
    user: { id: 'old', role: 'sm-member', fullName: 'Old Name' },
    accessToken: 'old-access',
    refreshToken,
    expiresAt: 0,
  };
}

afterEach(() => vi.restoreAllMocks());

describe('refreshSession', () => {
  it('deduplicates concurrent refreshes for the same token (single-flight)', async () => {
    let refreshCalls = 0;
    server.use(
      http.post('*/v1/auth/refresh', () => {
        refreshCalls++;
        return HttpResponse.json(
          envelope({
            accessToken: 'new-access',
            refreshToken: 'new-refresh',
            expiresIn: 3600,
          }),
        );
      }),
      http.get('*/v1/users/me', () =>
        HttpResponse.json(
          envelope({
            id: 'new',
            fullName: 'New Name',
            phoneNumber: '0900000000',
            role: 'sm-leader',
          }),
        ),
      ),
    );

    const session = sessionWith('shared-rt');
    const [a, b] = await Promise.all([
      refreshSession(session),
      refreshSession(session),
    ]);

    // The whole point: rotate-and-invalidate tokens would reject the 2nd racer.
    expect(refreshCalls).toBe(1);
    expect(a).toBe(b);
    expect(a.accessToken).toBe('new-access');
    expect(a.user).toMatchObject({ id: 'new', role: 'sm-leader' });
  });

  it('fails fast (outside production) when the refresh response violates the contract', async () => {
    // The spec marks TokenResponseDto.refreshToken required; a response
    // without it is drift, surfaced at the transport boundary. In production
    // the same mismatch shadow-logs and the `?? refreshToken` fallback in
    // refreshTokens keeps the session usable.
    server.use(
      http.post('*/v1/auth/refresh', () =>
        HttpResponse.json(
          envelope({ accessToken: 'new-access', expiresIn: 3600 }),
        ),
      ),
    );
    await expect(refreshSession(sessionWith('keep-me'))).rejects.toMatchObject({
      name: 'ApiError',
      status: 502,
    });
  });

  it('keeps the stale user snapshot when the profile refresh fails transiently (5xx)', async () => {
    server.use(
      http.post('*/v1/auth/refresh', () =>
        HttpResponse.json(
          envelope({
            accessToken: 'new-access',
            refreshToken: 'new-refresh',
            expiresIn: 3600,
          }),
        ),
      ),
      http.get('*/v1/users/me', () =>
        HttpResponse.json({ message: 'boom' }, { status: 500 }),
      ),
    );
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const refreshed = await refreshSession(sessionWith('transient-5xx'));

    expect(refreshed.accessToken).toBe('new-access'); // tokens still rotate
    expect(refreshed.user).toMatchObject({ id: 'old' }); // snapshot preserved
    expect(errSpy).toHaveBeenCalled();
  });

  it('throws when the fresh token is rejected by /users/me (session genuinely dead)', async () => {
    server.use(
      http.post('*/v1/auth/refresh', () =>
        HttpResponse.json(
          envelope({
            accessToken: 'new-access',
            refreshToken: 'new-refresh',
            expiresIn: 3600,
          }),
        ),
      ),
      http.get('*/v1/users/me', () =>
        HttpResponse.json({ message: 'nope' }, { status: 401 }),
      ),
    );
    await expect(
      refreshSession(sessionWith('rejected-401')),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it('rejects when the session carries no refresh token', async () => {
    const noToken: SessionData = {
      ...sessionWith('rt'),
      refreshToken: undefined,
    };
    await expect(refreshSession(noToken)).rejects.toMatchObject({
      name: 'ApiError',
      status: 401,
    });
  });
});
