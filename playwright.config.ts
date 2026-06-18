import { defineConfig, devices } from '@playwright/test';

/**
 * E2E tests live in `e2e/` (kept out of Vitest's `include`). Locally Playwright
 * boots the dev server; set `PLAYWRIGHT_BASE_URL` to point at an already-running
 * instance. Credentialed flows that need the real backend should be tagged and
 * run against a dedicated test environment, not in the default CI gate.
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
        command: 'pnpm dev',
        url: 'http://localhost:3000',
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        // A dummy client id so <GoogleSigninButton/> renders for the GIS-stubbed
        // e2e (the real verification is faked via a fulfilled GIS script).
        env: { NEXT_PUBLIC_GOOGLE_CLIENT_ID: 'e2e-test-client-id' },
      },
});
