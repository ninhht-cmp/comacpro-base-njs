import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { server } from '@/mocks/server';
import { ApiError, signIn } from './service';

/** SaleNet wraps every response in the BaseResDto envelope. */
function envelope(data: unknown, statusCode = 200) {
  return { success: true, data, messages: 'Success', statusCode };
}

describe('signIn', () => {
  it('posts credentials, unwraps the envelope and builds a session from /users/me', async () => {
    let receivedBody: unknown;
    server.use(
      http.post('*/v1/auth/signin', async ({ request }) => {
        receivedBody = await request.json();
        return HttpResponse.json(
          envelope({
            accessToken: 'access-123',
            refreshToken: 'refresh-456',
            expiresIn: 3600,
          }),
        );
      }),
      http.get('*/v1/users/me', () =>
        HttpResponse.json(
          envelope({
            id: 'u-7',
            fullName: 'Gigi G',
            phoneNumber: '0912345678',
            email: 'gigi@example.com',
            role: 'sm-saler',
          }),
        ),
      ),
    );

    const before = Date.now();
    const session = await signIn('0912345678', 'secret');

    expect(receivedBody).toEqual({
      username: '0912345678',
      password: 'secret',
    });
    expect(session.accessToken).toBe('access-123');
    expect(session.refreshToken).toBe('refresh-456');
    expect(session.user).toMatchObject({
      id: 'u-7',
      username: '0912345678',
      email: 'gigi@example.com',
      role: 'sm-saler',
    });
    // expiresAt ≈ now + expiresIn*1000
    expect(session.expiresAt).toBeGreaterThanOrEqual(before + 3600 * 1000);
  });

  it('throws ApiError with the envelope messages on rejection', async () => {
    server.use(
      http.post('*/v1/auth/signin', () =>
        HttpResponse.json(
          {
            success: false,
            data: null,
            messages: ['Invalid credentials'],
            statusCode: 401,
          },
          { status: 401 },
        ),
      ),
    );

    await expect(signIn('0912345678', 'wrong')).rejects.toMatchObject({
      name: 'ApiError',
      status: 401,
      message: 'Invalid credentials',
    });
    await expect(signIn('0912345678', 'wrong')).rejects.toBeInstanceOf(
      ApiError,
    );
  });
});
