import { expect, test } from '@playwright/test';

/**
 * Smoke coverage for the public marketing surface — every page renders its
 * key content and the shared chrome (header nav, footer legal identity)
 * without a backend. Copy-level assertions use stable substrings, not full
 * sentences, so wording tweaks don't break the suite.
 */

test.describe('home', () => {
  test('hero funnels to the app download', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    // Both hero CTAs exist; primary goes to /download (never /signup —
    // signup is invite-only).
    const main = page.getByRole('main');
    await expect(
      main.getByRole('link', { name: /tải ứng dụng/i }).first(),
    ).toHaveAttribute('href', /\/download$/);
    await expect(
      main.getByRole('link', { name: /tìm hiểu thêm/i }),
    ).toHaveAttribute('href', /\/about-us$/);
  });
});

test.describe('shared chrome', () => {
  test('header nav marks the active section', async ({ page }) => {
    await page.goto('/about-us');
    await expect(
      page
        .getByRole('navigation')
        .first()
        .getByRole('link', { name: /về chúng tôi/i }),
    ).toHaveAttribute('aria-current', 'page');
  });

  test('footer carries the registered legal identity', async ({ page }) => {
    await page.goto('/');
    const footer = page.getByRole('contentinfo');
    await expect(footer.getByText(/0111539358/)).toBeVisible();
    await expect(footer.getByText(/SALENET JSC/)).toBeVisible();
  });
});

test.describe('download', () => {
  test('offers both store badges', async ({ page }) => {
    await page.goto('/download');
    await expect(
      page.getByRole('link', { name: /google play/i }),
    ).toHaveAttribute('href', /play\.google\.com/);
    await expect(
      page.getByRole('link', { name: /app store/i }),
    ).toHaveAttribute('href', /apps\.apple\.com/);
  });
});

test.describe('legal pages', () => {
  for (const path of ['/terms', '/privacy'] as const) {
    test(`${path} renders its article`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await expect(page.getByText(/cập nhật lần cuối/i)).toBeVisible();
    });
  }
});
