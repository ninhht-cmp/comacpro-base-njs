import { defineConfig } from 'orval';

/**
 * Codegen from the NestJS OpenAPI spec → typed client, TanStack Query hooks
 * and zod schemas, written in-repo under `src/lib/api/generated`.
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
  // TanStack Query hooks + TS types, transported via the ky mutator.
  api: {
    input: {
      target: OPENAPI_SPEC,
    },
    output: {
      mode: 'tags-split',
      target: './src/lib/api/generated',
      schemas: './src/lib/api/generated/model',
      client: 'react-query',
      // Axios-style request config (`{ url, method, params, data, signal }`)
      // so the ky mutator returns the payload directly — `query.data` is the
      // response body, not a `{ status, data, headers }` envelope. No axios is
      // imported; the custom mutator fully replaces the transport.
      httpClient: 'axios',
      clean: true,
      // MSW mock generation is intentionally OFF: the backend wraps responses in
      // `BaseResDto<T>` / `BaseResPaginationDto`, which orval's faker mocks can't
      // satisfy (they emit `data: undefined` where the DTO requires it → invalid
      // types). Hand-write the handlers you need in `src/mocks/handlers.ts`.
      override: {
        mutator: {
          path: './src/lib/api/client.ts',
          name: 'customInstance',
        },
        query: {
          useQuery: true,
          signal: true,
        },
      },
    },
  },
  // Runtime zod schemas for the same operations (form / boundary validation).
  zod: {
    input: {
      target: OPENAPI_SPEC,
    },
    output: {
      mode: 'tags-split',
      target: './src/lib/api/generated',
      fileExtension: '.zod.ts',
      client: 'zod',
    },
  },
});
