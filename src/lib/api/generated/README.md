# Generated API artifacts

Output of `pnpm gen:api` (orval, config in `orval.config.ts`). Committed so CI
can typecheck/build without reaching the backend; freshness is gated by
`pnpm check:api-fresh`.

- **`model/` — the supported import surface.** TypeScript types for every DTO
  and enum in the OpenAPI spec. Import them anywhere server-side code or
  mappers need the wire shape: `import type { UserResDto } from
  '@/lib/api/generated/model'`.
- **`.reference/` — do not import.** Orval cannot emit models without a
  client, so the smallest self-contained one (`fetch`) is quarantined here.
  It reflects the *spec's* envelopes, which the live API deviates from — the
  real transport is `src/lib/api/server-fetch.ts`. See
  docs/adr/0002-rsc-first-data-layer.md.
