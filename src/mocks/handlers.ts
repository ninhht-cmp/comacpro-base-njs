import { http, HttpResponse, type RequestHandler } from 'msw';

/**
 * MSW request handlers mirroring the SaleNet API: `/v1` prefix and every
 * response wrapped in the `BaseResDto` envelope (list endpoints add a
 * `pagination` sibling) — keep the mocks envelope-accurate or they'll pass
 * where the real API fails. See docs/adr/0003-salenet-backend.md.
 *
 * Interception is SERVER-SIDE ONLY (node server via `instrumentation.ts`):
 * the app is RSC-first, so every API call originates on the server — there is
 * no browser worker. This set covers the vertical slice (signin → profile →
 * notifications → referral) so `NEXT_PUBLIC_API_MOCKING=enabled` gives a
 * working app with no backend; tests override per-case with `server.use(...)`.
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
  referralUrl: 'https://salenet.example/signup?referral=0912345678',
};

const mockReferrals = [
  {
    role: 'sm-member',
    dealCount: 3,
    profile: {
      id: 'mock-referral-1',
      fullName: 'Thành Viên Một',
      phoneNumber: '0900000001',
      createdAt: '2026-07-01T00:00:00.000Z',
      isEKYCVerified: true,
    },
  },
  {
    role: 'sm-member',
    profile: {
      id: 'mock-referral-2',
      fullName: 'Thành Viên Hai',
      createdAt: '2026-07-10T00:00:00.000Z',
    },
  },
];

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

/**
 * Endpoints whose REAL invocation costs money: signup triggers a ZaloOA send
 * on the backend. Kept as a separate set so `NEXT_PUBLIC_API_MOCKING=paid-only`
 * can intercept just these while everything else (referral lookup, signin,
 * profile…) hits the live API — realistic UI testing with a zero-đồng submit.
 */
export const paidEndpointHandlers: RequestHandler[] = [
  http.post('*/v1/auth/signup', () => HttpResponse.json(envelope(null))),
];

export const handlers: RequestHandler[] = [
  ...paidEndpointHandlers,
  http.post('*/v1/auth/signin', () => HttpResponse.json(envelope(mockTokens))),
  http.post('*/v1/auth/refresh', () => HttpResponse.json(envelope(mockTokens))),
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
  http.get('*/v1/users/referrals', () =>
    HttpResponse.json({
      ...envelope(mockReferrals),
      pagination: {
        currentPage: 1,
        perPage: 20,
        pageItems: mockReferrals.length,
        totalPage: 1,
        totalItem: mockReferrals.length,
      },
    }),
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
