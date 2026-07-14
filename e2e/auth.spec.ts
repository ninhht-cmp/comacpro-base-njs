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

  test('links to signup and hints in-app password reset', async ({ page }) => {
    await page.goto('/signin');

    await expect(
      page.getByRole('link', { name: /sign up|đăng ký/i }),
    ).toBeVisible();
    // Recovery lives in the mobile app — a hint, deliberately NOT a link.
    await expect(page.getByText(/quên mật khẩu/i)).toBeVisible();
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
    await page.goto('/account');

    const url = new URL(page.url());
    expect(url.pathname).toBe('/signin');
    expect(url.searchParams.get('redirect')).toBe('/account');
  });

  test('bounces a signed-in user off the sign-in page', async ({ page }) => {
    test.skip(!USER || !PASS, 'set E2E_USERNAME / E2E_PASSWORD to run');

    await page.goto('/signin');
    await page.fill('input[name="username"]', USER!);
    await page.fill('input[name="password"]', PASS!);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/account');

    await page.goto('/signin');
    await expect(page).toHaveURL('**/account');
  });

  test('honors an explicit ?redirect= target after signing in', async ({
    page,
  }) => {
    test.skip(!USER || !PASS, 'set E2E_USERNAME / E2E_PASSWORD to run');

    await page.goto('/signin?redirect=%2F');
    await page.fill('input[name="username"]', USER!);
    await page.fill('input[name="password"]', PASS!);
    await page.click('button[type="submit"]');
    await page.waitForURL((url) => url.pathname === '/');
  });
});
