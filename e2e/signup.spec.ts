import { expect, test } from '@playwright/test';

/**
 * The invite-only signup funnel — the product's reason to exist on the web.
 *
 * The blocked (invite-less) state is static and runs anywhere. The resolved
 * referrer and the full submit→success path need the server-side MSW mocks
 * (`NEXT_PUBLIC_API_MOCKING=enabled`, as CI sets) — against a live backend
 * they would depend on real referral data and a PAID ZaloOA send, so they
 * self-skip, same pattern as the credentialed sign-in flows.
 */

const mocked = process.env.NEXT_PUBLIC_API_MOCKING === 'enabled';

test.describe('signup without an invite', () => {
  test('blocks with guidance and funnels to the app download', async ({
    page,
  }) => {
    await page.goto('/signup');

    // AuthCard's title is a styled div (shadcn CardTitle), not a heading.
    await expect(page.getByText(/cần link mời/i)).toBeVisible();
    // No form without a referral — the page must not tease a dead end.
    await expect(page.locator('input[name="fullName"]')).toHaveCount(0);
    await expect(
      page.getByRole('main').getByRole('link', { name: /tải ứng dụng/i }),
    ).toHaveAttribute('href', /\/download$/);
  });

  test('is noindex (invite URLs carry the referrer phone number)', async ({
    page,
  }) => {
    await page.goto('/signup');
    await expect(page.locator('meta[name="robots"]').first()).toHaveAttribute(
      'content',
      /noindex/,
    );
  });
});

test.describe('signup with an invite (mocked backend)', () => {
  test.skip(!mocked, 'needs NEXT_PUBLIC_API_MOCKING=enabled (as in CI)');

  test('shows the referrer as trust anchor plus the form', async ({ page }) => {
    await page.goto('/signup?referral=0987654321');

    // The referrer block is the funnel's trust anchor (MSW's mock referrer).
    await expect(
      page.getByRole('heading', { name: 'Người Giới Thiệu' }),
    ).toBeVisible();

    await expect(page.locator('input[name="fullName"]')).toBeVisible();
    await expect(page.locator('input[name="username"]')).toBeVisible();
    // The referral code travels hidden — invite-only, never a visible field.
    await expect(page.locator('input[name="referralCode"]')).toBeHidden();
    await expect(page.locator('input[name="referralCode"]')).toHaveValue(
      '0987654321',
    );
  });

  test('submits and lands on the success state (PRG) with the masked phone', async ({
    page,
  }) => {
    await page.goto('/signup?referral=0987654321');

    await page.locator('input[name="fullName"]').fill('Nguyễn Văn Tèo');
    await page.locator('input[name="username"]').fill('0912345678');
    await page.getByRole('button', { name: /^đăng ký$/i }).click();

    // PRG: the action redirects back with ?status=success + a proof cookie.
    await page.waitForURL(/status=success/);
    await expect(
      page.getByRole('heading', { name: /đăng ký thành công/i }),
    ).toBeVisible();
    // Credentials went to Zalo — the masked phone confirms where.
    await expect(page.getByText('09•••••678')).toBeVisible();
    // Conversion target: the store badges.
    await expect(
      page.getByRole('link', { name: /google play|app store/i }).first(),
    ).toBeVisible();

    // Refresh must NOT resubmit (that's the point of PRG) — the success
    // state survives via the short-lived cookie.
    await page.reload();
    await expect(
      page.getByRole('heading', { name: /đăng ký thành công/i }),
    ).toBeVisible();
  });

  test('client-side validation rejects junk before the network', async ({
    page,
  }) => {
    await page.goto('/signup?referral=0987654321');

    await page.locator('input[name="fullName"]').fill('aaaa');
    await page.locator('input[name="username"]').fill('12345');
    await page.getByRole('button', { name: /^đăng ký$/i }).click();

    // Still on the form (no PRG redirect), with field-level errors shown.
    await expect(page).not.toHaveURL(/status=success/);
    await expect(page.locator('[aria-invalid="true"]')).toHaveCount(2);
  });
});
