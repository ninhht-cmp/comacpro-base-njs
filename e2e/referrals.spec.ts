import { expect, test } from '@playwright/test';

/**
 * The referral hub for signed-in members (invite link + referred-member
 * list). The guard check runs anywhere; the signed-in flow needs the mocked
 * backend (`NEXT_PUBLIC_API_MOCKING=enabled`, as CI sets) — MSW accepts any
 * well-formed credentials, so the test signs in through the real form.
 */

const mocked = process.env.NEXT_PUBLIC_API_MOCKING === 'enabled';

test('bounces an unauthenticated user to sign-in with ?redirect=', async ({
  page,
}) => {
  await page.goto('/referrals');

  const url = new URL(page.url());
  expect(url.pathname).toBe('/signin');
  expect(url.searchParams.get('redirect')).toBe('/referrals');
});

test.describe('signed in (mocked backend)', () => {
  test.skip(!mocked, 'needs NEXT_PUBLIC_API_MOCKING=enabled (as in CI)');

  test.beforeEach(async ({ page }) => {
    await page.goto('/signin');
    await page.fill('input[name="username"]', '0912345678');
    await page.fill('input[name="password"]', 'mock-pass');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/account');
  });

  test('shows the invite link with copy/share and the referred members', async ({
    page,
  }) => {
    await page.goto('/referrals');

    // Invite link comes from the mocked profile's referralUrl.
    await expect(page.locator('input[readonly]')).toHaveValue(
      /signup\?referral=0912345678/,
    );
    await expect(page.getByRole('button', { name: /sao chép/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /chia sẻ/i })).toBeVisible();

    // The mocked referral list renders with masked phones.
    await expect(page.getByText('Thành Viên Một')).toBeVisible();
    await expect(page.getByText('Thành Viên Hai')).toBeVisible();
    await expect(page.getByText(/09•••••001/)).toBeVisible();
    await expect(page.getByText(/3 đơn/)).toBeVisible();
  });

  test('is reachable from the user menu', async ({ page }) => {
    await page.goto('/account');
    // The avatar button is labeled with the user's name (mock profile).
    await page.getByRole('button', { name: 'Demo User' }).click();
    await page
      .getByRole('menuitem', { name: /giới thiệu thành viên/i })
      .click();
    await page.waitForURL('**/referrals');
    await expect(page.getByText(/link mời của bạn/i)).toBeVisible();
  });
});
