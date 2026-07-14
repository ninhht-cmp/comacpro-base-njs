import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    // Unit/integration tests only. Playwright owns `e2e/`; Storybook runs
    // standalone (`pnpm storybook` / `build-storybook`), not through Vitest.
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['e2e/**', 'node_modules/**', '.next/**'],
    // Provide the env the app reads at import time (t3-env). `SKIP_ENV_VALIDATION`
    // lets `@/config/env` pass process.env through without zod validation; the
    // base URL feeds the `fetch`-based services (intercepted by MSW), and the
    // Google client id makes <GoogleSigninButton/> render under test.
    env: {
      SKIP_ENV_VALIDATION: 'true',
      // Exercise the development-mode branches (readable logger output, the
      // verbose serverFetch cURL repro) — the observable paths a dev debugs.
      NODE_ENV: 'development',
      API_BASE_URL: 'http://test.local',
      NEXT_PUBLIC_API_BASE_URL: 'http://test.local',
      // Hashed into the AES-256 session key (core/session) — needed by the
      // session seal/open + middleware refresh tests.
      AUTH_SECRET: 'test-only-secret-at-least-32-characters-long',
    },
    coverage: {
      provider: 'v8',
      // `text` for local runs, `lcov` for editor/tooling integrations,
      // `json-summary` feeds the threshold ratchet below.
      reporter: ['text', 'lcov', 'json-summary'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{ts,tsx}'],
      // Fail-safe floors, not targets: set ~5 points below the current totals
      // (lines ~9.8%, statements ~9.7%, functions ~11.2%, branches ~11.7% at
      // the time of writing) so coverage can never silently regress. Ratchet
      // these up as the suite fills in — never down.
      thresholds: {
        lines: 5,
        statements: 5,
        functions: 6,
        branches: 6,
      },
      // Exclude generated code, mocks, type-only and barrel/boilerplate files —
      // they'd dilute the signal.
      exclude: [
        'src/lib/api/generated/**',
        'src/mocks/**',
        'src/**/*.d.ts',
        'src/**/index.ts',
        'src/**/*.stories.*',
        'src/instrumentation.ts',
      ],
    },
  },
});
