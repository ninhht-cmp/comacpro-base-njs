import { http, HttpResponse, type RequestHandler } from 'msw';

/**
 * MSW request handlers mirroring the SaleNet API: `/v1` prefix and every
 * response wrapped in the `BaseResDto` envelope (list endpoints add a
 * `pagination` sibling) — keep the mocks envelope-accurate or they'll pass
 * where the real API fails. See docs/adr/0003-salenet-backend.md.
 *
 * This set covers the vertical slice (signin → profile → notifications →
 * referral) so `NEXT_PUBLIC_API_MOCKING=enabled` gives a working app with no
 * backend. Tests override per-case with `server.use(...)`.
 *
 * Use a leading `*` wildcard so a handler matches regardless of API origin.
 */

function envelope(data: unknown, statusCode = 200) {
  return { success: true, data, messages: 'Success', statusCode };
}

const mockProfile = {
  id: 'mock-user-1',
  fullName: 'Demo User',
  phoneNumber: '0912345678',
  email: 'demo@example.com',
  role: 'sm-saler',
  referralCode: 'DEMO123',
};

const mockTokens = {
  accessToken: 'mock-access-token',
  refreshToken: 'mock-refresh-token',
  expiresIn: 3600,
};

const mockNotifications = [
  {
    id: 'mock-notification-1',
    isRead: false,
    event: 'WELCOME_TO_NEW_MEMBER',
    pageUrl: '/',
    description: 'This notification comes from the MSW mock API.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'mock-notification-2',
    isRead: true,
    event: 'USER_REFERRAL_SIGNUP_SUCCESS',
    pageUrl: '/',
    description: 'Set NEXT_PUBLIC_API_MOCKING=disabled to hit the real API.',
    createdAt: new Date(Date.now() - 86_400_000).toISOString(),
  },
];

export const handlers: RequestHandler[] = [
  http.post('*/v1/auth/signin', () => HttpResponse.json(envelope(mockTokens))),
  http.post('*/v1/auth/refresh', () => HttpResponse.json(envelope(mockTokens))),
  http.post('*/v1/auth/signup', () => HttpResponse.json(envelope(null))),
  http.get('*/v1/users/me', () => HttpResponse.json(envelope(mockProfile))),
  http.patch('*/v1/users/me', () => HttpResponse.json(envelope(mockProfile))),
  http.get('*/v1/users/referral/:code', ({ params }) =>
    HttpResponse.json(
      envelope({
        id: 'mock-referrer-1',
        username: '0987654321',
        role: 'sm-leader',
        status: 'active',
        code: params.code,
        profile: {
          id: 'mock-referrer-profile-1',
          fullName: 'Người Giới Thiệu',
          phoneNumber: '0987654321',
        },
      }),
    ),
  ),
  http.get('*/v1/notifications/unread-count', () =>
    HttpResponse.json(
      envelope({
        count: mockNotifications.filter((n) => !n.isRead).length,
      }),
    ),
  ),
  http.get('*/v1/notifications', () =>
    HttpResponse.json({
      ...envelope(mockNotifications),
      pagination: {
        currentPage: 1,
        perPage: 50,
        pageItems: mockNotifications.length,
        totalPage: 1,
        totalItem: mockNotifications.length,
      },
    }),
  ),
  http.put('*/v1/notifications/read-all', () =>
    HttpResponse.json(envelope(true)),
  ),
  http.put('*/v1/notifications/:id', () => HttpResponse.json(envelope(true))),
];
