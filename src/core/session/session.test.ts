// @vitest-environment node
// Edge/server module (jose JWE, Web Crypto) — needs Node globals, not jsdom's
// (cross-realm Uint8Array/DOMException mismatches otherwise).
import { describe, expect, it } from 'vitest';
import {
  isAccessTokenExpiring,
  openSession,
  REFRESH_THRESHOLD_MS,
  sealSession,
  SESSION_COOKIE,
  sessionCookieOptions,
  type SessionData,
} from './session';

const sample: SessionData = {
  user: { id: 'u1', username: '0912345678', role: 'sm-saler' },
  accessToken: 'access',
  refreshToken: 'refresh',
  expiresAt: 1_700_000_000_000,
};

describe('sealSession / openSession', () => {
  it('round-trips a session through seal → open', async () => {
    const token = await sealSession(sample);
    expect(typeof token).toBe('string');
    await expect(openSession(token)).resolves.toEqual(sample);
  });

  it('returns null for a missing, malformed or tampered token', async () => {
    await expect(openSession(undefined)).resolves.toBeNull();
    await expect(openSession('not-a-jwe')).resolves.toBeNull();
    const token = await sealSession(sample);
    // Corrupt the auth tag — decryption must fail closed.
    await expect(openSession(`${token.slice(0, -4)}zzzz`)).resolves.toBeNull();
  });
});

describe('isAccessTokenExpiring', () => {
  it('is true within the refresh threshold and false outside it', () => {
    const now = 10_000_000;
    expect(
      isAccessTokenExpiring(
        { ...sample, expiresAt: now + REFRESH_THRESHOLD_MS - 1 },
        now,
      ),
    ).toBe(true);
    expect(
      isAccessTokenExpiring(
        { ...sample, expiresAt: now + REFRESH_THRESHOLD_MS + 1 },
        now,
      ),
    ).toBe(false);
  });
});

describe('session cookie definition', () => {
  it('uses the bare name + non-secure options outside production', () => {
    expect(SESSION_COOKIE).toBe('sn_session');
    expect(sessionCookieOptions).toMatchObject({
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      path: '/',
    });
  });
});
