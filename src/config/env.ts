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
    // Sentry error reporting (server/edge). Unset → the SDK never initializes
    // (see src/instrumentation.ts) — dev/test stay silent.
    SENTRY_DSN: z.url().optional(),
    // Cloudflare Turnstile (anti-bot on signup). Optional even in prod: the
    // check is opt-in — unset (either key) disables widget + verification.
    TURNSTILE_SECRET_KEY: z.string().min(1).optional(),
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
    // Sentry error reporting (browser). Unset → no client init.
    NEXT_PUBLIC_SENTRY_DSN: z.url().optional(),
    // Turnstile widget site key (pairs with TURNSTILE_SECRET_KEY above).
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().min(1).optional(),
  },

  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    API_BASE_URL: process.env.API_BASE_URL,
    AUTH_SECRET: process.env.AUTH_SECRET,
    REVALIDATE_SECRET: process.env.REVALIDATE_SECRET,
    SENTRY_DSN: process.env.SENTRY_DSN,
    TURNSTILE_SECRET_KEY: process.env.TURNSTILE_SECRET_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
    NEXT_PUBLIC_API_MOCKING: process.env.NEXT_PUBLIC_API_MOCKING,
    NEXT_PUBLIC_VITALS_ENDPOINT: process.env.NEXT_PUBLIC_VITALS_ENDPOINT,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
  },

  emptyStringAsUndefined: true,
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});
