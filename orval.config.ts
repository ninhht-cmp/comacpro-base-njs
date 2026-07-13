import { defineConfig } from 'orval';

/**
 * Codegen from the NestJS OpenAPI spec → TypeScript model types under
 * `src/lib/api/generated/model`. Models are the ONLY generated artifact: the
 * app is RSC-first and talks to the backend through the hand-rolled
 * `serverFetch` transport (`src/lib/api/server-fetch.ts`), because the live
 * API's response envelopes deviate from the spec — see
 * docs/adr/0002-rsc-first-data-layer.md and docs/api-spec-issue.md. Client
 * generation (hooks/fetchers/zod) can come back once the spec is trustworthy.
 *
 * Run with `pnpm gen:api`. Override the spec source (URL or path) for the real
 * backend: `OPENAPI_SPEC=https://api.example.com/v1/openapi.json pnpm gen:api`.
 *
 * Generated output is committed (so CI can typecheck/build without reaching the
 * backend) but lint- and prettier-ignored — orval owns its formatting, and the
 * spec stays the single source of truth.
 */
const OPENAPI_SPEC = process.env.OPENAPI_SPEC ?? './openapi/openapi.json';

export default defineConfig({
  api: {
    input: {
      target: OPENAPI_SPEC,
      // Deliberate scope: only the tags the app consumes today (auth flows,
      // users/referral, notifications). Widen the list as features are
      // migrated — an unfiltered run generates all 244 paths.
      filters: {
        mode: 'include',
        tags: ['Auth', 'Users', 'Notifications'],
      },
      // Sanitize known spec defects (empty enums) before validation.
      override: {
        transformer: './scripts/openapi-input-transformer.mjs',
      },
    },
    output: {
      // `fetch` is the smallest self-contained client orval can emit (orval
      // cannot generate models alone); the client file is quarantined in
      // `.reference/` — see the README generated alongside it. Only `model/`
      // is a supported import (enforced by ESLint).
      client: 'fetch',
      mode: 'single',
      target: './src/lib/api/generated/.reference/client.ts',
      schemas: './src/lib/api/generated/model',
      // NO `clean`: orval wipes the output folder BEFORE resolving the input,
      // so an unreachable spec URL would destroy the committed models. Stale
      // files are caught by `pnpm check:api-fresh` in CI instead.
      clean: false,
    },
  },
});
