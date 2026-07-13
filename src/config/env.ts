import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

// Secrets the app cannot run without. Optional in dev/test so local setups and
// unit tests boot without a full .env, but REQUIRED in production so a
// misconfigured deploy fails at build/boot-time env validation instead of
// 500-ing on the first request that lazily touches the missing value.
const isProd = process.env.NODE_ENV === 'production';

export const env = createEnv({
  server: {
    NODE_ENV: z
      .enum(['development', 'test', 'production'])
      .default('development'),
    API_BASE_URL: isProd ? z.url() : z.url().optional(),
    // ≥32 chars: it is hashed into the AES-256 session key (see core/session).
    AUTH_SECRET: isProd ? z.string().min(32) : z.string().min(1).optional(),
    REVALIDATE_SECRET: z.string().min(16).optional(),
    // Observability (server). Consumed once the Sentry SDK is wired into
    // `instrumentation.ts`; optional so unconfigured environments are a no-op.
    SENTRY_DSN: z.url().optional(),
  },

  client: {
    NEXT_PUBLIC_APP_URL: z.url().optional(),
    NEXT_PUBLIC_API_BASE_URL: z.url().optional(),
    // `paid-only` mocks just the money-costing endpoints (ZaloOA/SMS sends)
    // and lets everything else hit the live API — see src/instrumentation.ts.
    NEXT_PUBLIC_API_MOCKING: z
      .enum(['enabled', 'paid-only', 'disabled'])
      .optional(),
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
    NEXT_PUBLIC_VITALS_ENDPOINT: process.env.NEXT_PUBLIC_VITALS_ENDPOINT,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
    NEXT_PUBLIC_FEATURE_FLAGS: process.env.NEXT_PUBLIC_FEATURE_FLAGS,
  },

  emptyStringAsUndefined: true,
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});
