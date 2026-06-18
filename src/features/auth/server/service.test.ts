import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { server } from '@/mocks/server';
import { AuthError, googleSignIn } from './service';

describe('googleSignIn', () => {
  it('posts the idToken and builds a session from the profile', async () => {
    let receivedBody: unknown;
    server.use(
      http.post('*/api/v1/auth/google', async ({ request }) => {
        receivedBody = await request.json();
        return HttpResponse.json({
          accessToken: 'access-123',
          refreshToken: 'refresh-456',
          expiresIn: 3600,
        });
      }),
      http.get('*/api/v1/users/me', () =>
        HttpResponse.json({
          id: 7,
          username: 'gigi',
          email: 'gigi@example.com',
          fullName: 'Gigi G',
          type: 2,
        }),
      ),
    );

    const before = Date.now();
    const session = await googleSignIn('google-id-token');

    expect(receivedBody).toEqual({ idToken: 'google-id-token' });
    expect(session.accessToken).toBe('access-123');
    expect(session.refreshToken).toBe('refresh-456');
    expect(session.user).toMatchObject({
      id: 7,
      email: 'gigi@example.com',
      userType: 2,
    });
    // expiresAt ≈ now + expiresIn*1000
    expect(session.expiresAt).toBeGreaterThanOrEqual(before + 3600 * 1000);
  });

  it('throws AuthError with the backend message on rejection', async () => {
    server.use(
      http.post('*/api/v1/auth/google', () =>
        HttpResponse.json(
          { message: 'Token Google không hợp lệ', statusCode: 401 },
          { status: 401 },
        ),
      ),
    );

    await expect(googleSignIn('bad-token')).rejects.toMatchObject({
      name: 'AuthError',
      status: 401,
      message: 'Token Google không hợp lệ',
    });
    await expect(googleSignIn('bad-token')).rejects.toBeInstanceOf(AuthError);
  });
});
