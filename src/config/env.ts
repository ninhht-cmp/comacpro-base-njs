import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const env = createEnv({
  server: {
    NODE_ENV: z
      .enum(['development', 'test', 'production'])
      .default('development'),
    API_BASE_URL: z.url().optional(),
    AUTH_SECRET: z.string().min(1).optional(),
    REVALIDATE_SECRET: z.string().min(16).optional(),
    // Observability (server). Consumed once the Sentry SDK is wired into
    // `instrumentation.ts`; optional so unconfigured environments are a no-op.
    SENTRY_DSN: z.url().optional(),
  },

  client: {
    NEXT_PUBLIC_APP_URL: z.url().optional(),
    NEXT_PUBLIC_API_BASE_URL: z.url().optional(),
    NEXT_PUBLIC_API_MOCKING: z.enum(['enabled', 'disabled']).optional(),
    // Google Sign-In client id (public). When unset, the Google button hides.
    NEXT_PUBLIC_GOOGLE_CLIENT_ID: z.string().optional(),
    // Observability (client). RUM/Web-Vitals beacon target (e.g. a Route
    // Handler forwarding to Datadog RUM). Unset → the reporter no-ops.
    NEXT_PUBLIC_VITALS_ENDPOINT: z.url().optional(),
    NEXT_PUBLIC_SENTRY_DSN: z.url().optional(),
    // Feature flags forced ON (comma-separated keys). See src/config/flags.ts.
    NEXT_PUBLIC_FEATURE_FLAGS: z.string().optional(),
  },

  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    API_BASE_URL: process.env.API_BASE_URL,
    AUTH_SECRET: process.env.AUTH_SECRET,
    REVALIDATE_SECRET: process.env.REVALIDATE_SECRET,
    SENTRY_DSN: process.env.SENTRY_DSN,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
    NEXT_PUBLIC_API_MOCKING: process.env.NEXT_PUBLIC_API_MOCKING,
    NEXT_PUBLIC_GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    NEXT_PUBLIC_VITALS_ENDPOINT: process.env.NEXT_PUBLIC_VITALS_ENDPOINT,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
    NEXT_PUBLIC_FEATURE_FLAGS: process.env.NEXT_PUBLIC_FEATURE_FLAGS,
  },

  emptyStringAsUndefined: true,
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});
