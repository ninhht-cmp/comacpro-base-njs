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
    // Unit/integration tests only. Playwright owns `e2e/`.
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['e2e/**', 'node_modules/**', '.next/**'],
    // Provide the env the app reads at import time (t3-env). `SKIP_ENV_VALIDATION`
    // lets `@/config/env` pass process.env through without zod validation; the
    // base URL feeds the `fetch`-based services (intercepted by MSW), and the
    // Google client id makes <GoogleSigninButton/> render under test.
    env: {
      SKIP_ENV_VALIDATION: 'true',
      API_BASE_URL: 'http://test.local',
      NEXT_PUBLIC_API_BASE_URL: 'http://test.local',
      NEXT_PUBLIC_GOOGLE_CLIENT_ID: 'test-client-id',
    },
  },
});
