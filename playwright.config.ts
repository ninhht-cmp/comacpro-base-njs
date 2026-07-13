import { defineConfig, devices } from '@playwright/test';

/**
 * E2E tests live in `e2e/` (kept out of Vitest's `include`). Locally Playwright
 * boots the dev server (fast iteration); in CI it builds and serves the
 * production server so e2e validates what actually ships. Set
 * `PLAYWRIGHT_BASE_URL` to point at an already-running instance instead.
 * Credentialed flows that need the real backend should be tagged and run
 * against a dedicated test environment, not in the default CI gate.
 */
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        // CI exercises the production build (same `pnpm start` pattern as the
        // Lighthouse job); locally the dev server keeps the loop fast.
        command: process.env.CI ? 'pnpm build && pnpm start' : 'pnpm dev',
        url: 'http://localhost:3000',
        reuseExistingServer: !process.env.CI,
        // Generous in CI: the timeout has to cover `next build`, not just boot.
        timeout: process.env.CI ? 300_000 : 120_000,
        // A dummy client id so <GoogleSigninButton/> renders for the GIS-stubbed
        // e2e (the real verification is faked via a fulfilled GIS script).
        env: { NEXT_PUBLIC_GOOGLE_CLIENT_ID: 'e2e-test-client-id' },
      },
});
