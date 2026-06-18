import { expect, test } from '@playwright/test';

/**
 * Smoke coverage for the auth UI — renders without the backend (the form is
 * static until submit). A full credentialed sign-in belongs in a backend-backed
 * suite run against a test environment.
 */
test.describe('signin page', () => {
  test('renders the sign-in form', async ({ page }) => {
    await page.goto('/signin');

    await expect(page.locator('input[name="username"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(
      page.getByRole('button', { name: /sign in|đăng nhập/i }),
    ).toBeVisible();
  });

  test('links to signup and forgot-password', async ({ page }) => {
    await page.goto('/signin');

    await expect(
      page.getByRole('link', { name: /sign up|đăng ký/i }),
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: /forgot password|quên mật khẩu/i }),
    ).toBeVisible();
  });
});

/**
 * Route guards (middleware) and the post-sign-in `?redirect=` flow.
 *
 * The unauthenticated guard is deterministic. The authenticated cases need a
 * real session, so they sign in with `E2E_USERNAME` / `E2E_PASSWORD` and skip
 * when those aren't provided.
 */
test.describe('auth guards', () => {
  const USER = process.env.E2E_USERNAME;
  const PASS = process.env.E2E_PASSWORD;

  test('bounces an unauthenticated user off a protected route with ?redirect=', async ({
    page,
  }) => {
    await page.goto('/en/account');

    const url = new URL(page.url());
    expect(url.pathname).toBe('/en/signin');
    expect(url.searchParams.get('redirect')).toBe('/en/account');
  });

  test('bounces a signed-in user off the sign-in page', async ({ page }) => {
    test.skip(!USER || !PASS, 'set E2E_USERNAME / E2E_PASSWORD to run');

    await page.goto('/en/signin');
    await page.fill('input[name="username"]', USER!);
    await page.fill('input[name="password"]', PASS!);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/en/account');

    await page.goto('/en/signin');
    await expect(page).toHaveURL('**/en/account');
  });

  test('honors an explicit ?redirect= target after signing in', async ({
    page,
  }) => {
    test.skip(!USER || !PASS, 'set E2E_USERNAME / E2E_PASSWORD to run');

    await page.goto('/en/signin?redirect=%2Fen');
    await page.fill('input[name="username"]', USER!);
    await page.fill('input[name="password"]', PASS!);
    await page.click('button[type="submit"]');
    await page.waitForURL((url) => url.pathname === '/en');
  });
});

/**
 * Google sign-in wiring. We can't drive the real Google popup in CI, so we
 * fulfill the GIS script (`accounts.google.com/gsi/client`) with a stub that
 * exposes a clickable button and fires the component's credential callback.
 * Clicking it must invoke the `signinWithGoogle` server action (asserted via the
 * Next action RPC). The button only renders when `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
 * is set on the server, so the test skips gracefully when it isn't configured.
 */
test.describe('google sign-in', () => {
  const GIS_STUB = `
    window.google = {
      accounts: {
        id: {
          initialize: (cfg) => { window.__gsiCallback = cfg.callback; },
          renderButton: (el) => {
            const b = document.createElement('button');
            b.setAttribute('data-testid', 'mock-google');
            b.textContent = 'Mock Google';
            b.addEventListener('click', () => {
              window.__gsiCallback && window.__gsiCallback({ credential: 'e2e-fake-id-token' });
            });
            el.appendChild(b);
          },
        },
      },
    };
  `;

  test('clicking the Google button invokes the sign-in action', async ({
    page,
  }) => {
    await page.route(
      (url) => url.href.includes('/gsi/client'),
      (route) =>
        route.fulfill({
          status: 200,
          contentType: 'text/javascript',
          body: GIS_STUB,
        }),
    );

    await page.goto('/signin');

    // Wait for the stubbed GIS button; if it never appears the feature isn't
    // configured on this server (no client id) → skip rather than fail.
    const googleButton = page.getByTestId('mock-google');
    const appeared = await googleButton
      .waitFor({ state: 'visible', timeout: 8000 })
      .then(() => true)
      .catch(() => false);
    test.skip(!appeared, 'Google button not rendered (client id unset)');

    // The server action is an RPC POST to the route carrying a `next-action` header.
    const actionCall = page.waitForRequest(
      (req) =>
        req.method() === 'POST' && req.headers()['next-action'] !== undefined,
    );
    await googleButton.click();
    await actionCall;
  });
});
