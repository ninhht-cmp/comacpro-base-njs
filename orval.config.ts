import { defineConfig } from 'orval';

/**
 * Codegen from the SaleNet OpenAPI spec → TypeScript model types under
 * `src/lib/api/generated/model`. Models are the ONLY generated artifact: the
 * app is RSC-first and talks to the backend through the shared `serverFetch`
 * transport — see docs/adr/0002-rsc-first-data-layer.md (why no generated
 * client) and docs/adr/0003-salenet-backend.md (re-entry conditions).
 *
 * Run with `pnpm gen:api`. `OPENAPI_SPEC` (URL or path) overrides the
 * committed snapshot in ./openapi/openapi.json.
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
      // Scope is operation-level and lives in `openapi/selection.json` (managed
      // by `pnpm gen:api:pick`): the transformer prunes the spec to the
      // selected operations before orval resolves it, so orval emits only the
      // schemas they reference. This replaces orval's coarser tag `filters`
      // with per-endpoint control while staying deterministic for CI.
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
