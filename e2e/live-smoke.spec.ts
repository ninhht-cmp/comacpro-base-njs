import { expect, type Page, test } from '@playwright/test';

/**
 * Backend-backed smoke of the signed-in surface — the suite auth.spec's
 * header promises ("a full credentialed sign-in belongs in a backend-backed
 * suite"). Runs only when E2E_USERNAME/E2E_PASSWORD point at a real test
 * account (never in the default CI gate). Read-only: no mutations beyond
 * the sign-in itself.
 *
 * With response validation in dev-throw mode, a page rendering at all is
 * itself a contract assertion: any live-API drift on these calls would 502.
 */

// Next's route announcer also carries role="alert" after client-side
// navigation — assert only on the app's destructive error banners.
function errorAlerts(page: Page) {
  return page.locator('[role="alert"][class*="destructive"]');
}

const USER = process.env.E2E_USERNAME;
const PASS = process.env.E2E_PASSWORD;

test.describe('live smoke (real backend)', () => {
  test.skip(!USER || !PASS, 'set E2E_USERNAME / E2E_PASSWORD to run');

  test.beforeEach(async ({ page }) => {
    await page.goto('/signin');
    await page.fill('input[name="username"]', USER!);
    await page.fill('input[name="password"]', PASS!);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/account');
  });

  test('account page renders the live profile', async ({ page }) => {
    await expect(
      page.getByRole('heading', { level: 1, name: /tài khoản/i }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: /đăng xuất/i }),
    ).toBeVisible();
    await expect(errorAlerts(page)).toHaveCount(0);
  });

  test('referrals page renders invite link and list from live data', async ({
    page,
  }) => {
    await page.goto('/referrals');
    await expect(
      page.getByRole('heading', { level: 1, name: /giới thiệu thành viên/i }),
    ).toBeVisible();
    // Live accounts may or may not carry a referralUrl — either the card or
    // the guidance must show, never a broken half-render.
    await expect(
      page
        .locator('input[readonly]')
        .or(page.getByText(/chưa có link mời/i))
        .first(),
    ).toBeVisible();
    await expect(errorAlerts(page)).toHaveCount(0);
  });

  test('notifications page renders the live feed', async ({ page }) => {
    await page.goto('/notifications');
    await expect(
      page.getByRole('heading', { level: 1, name: /thông báo/i }),
    ).toBeVisible();
    await expect(errorAlerts(page)).toHaveCount(0);
  });
});
