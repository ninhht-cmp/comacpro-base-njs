# ADR 0002 — RSC-first data layer (retire the client-side query stack)

- **Status:** Accepted
- **Date:** 2026-07-13
- **Relates to:** ADR 0001 (architecture & platform); superseded in part by
  ADR 0003 (the SaleNet backend honors its spec envelope)

## Context

The template originally shipped two parallel data layers:

1. A generated client: orval → TanStack Query hooks + zod schemas, transported
   through a ky mutator, with SSR hydration helpers (`HydrateQuery`,
   per-request `QueryClient`).
2. Hand-rolled server services (`features/*/server/service.ts`) called from
   RSCs and Server Actions, passing results to client components as props.

Only layer 2 was ever used. The generated client was blocked by a real
problem: **the live NestJS API deviates from its own OpenAPI spec** — the spec
declares a `BaseResDto<T>` envelope, but live endpoints return payloads at the
top level (documented and reported upstream at the time). Meanwhile layer 2 grew three duplicated
copies of base-URL resolution and error-envelope parsing, with behavioral
drift between them, and the unused layer confused every decision about "the
blessed way" to fetch data.

## Decision

**Commit to the RSC-first architecture and delete the client-query stack.**

- Data flows: session cookie → RSC → `serverFetch` → mapper → props.
  Mutations: client → Server Action → `serverFetch` → `router.refresh()`.
- One shared transport, `src/lib/api/server-fetch.ts`, owns base-URL
  resolution, bearer/locale headers, timeouts (10s default — a hung backend
  must not hang an RSC render) and error-envelope parsing (`ApiError`).
  All feature services and the middleware's token refresh use it.
- Removed: `@tanstack/react-query` (+devtools), `ky`, the orval react-query
  and zod projects, `QueryProvider`/`HydrateQuery`/`query-client`, and the
  generated hook/zod files.
- Kept: orval **model generation** (`src/lib/api/generated/model`) — the
  typed wire contract that powers the anti-corruption mappers
  (`features/*/api/mapper.ts`) and their compile-time enum-drift detection.
  Orval cannot emit models without a client, so a minimal `fetch` client is
  quarantined in `generated/.reference/` (never imported).
- MSW stays, with hand-written handlers covering the vertical slice.

## Consequences

- One obvious pattern for contributors; the duplicated transports are gone.
- No client-side cache: every mutation re-renders via `router.refresh()`.
  Acceptable at this app's interaction density.
- **Re-introduce TanStack Query only when a feature actually needs
  client-side data behavior** (polling, infinite scroll, optimistic updates).
  When that happens, prefer fixing the spec first and generating the client
  from it, so hooks and models share one source of truth.
- Runtime response validation is still deliberate debt: services cast
  `body as T`. The mappers contain enum drift at compile time, but a shape
  change in the live API surfaces at runtime. Revisit once the spec is
  trustworthy (generate zod from it and parse in `serverFetch`).
- No backend `/auth/logout` endpoint exists; logout only clears the cookie
  and the refresh token stays valid until TTL. Tracked as a backend ask.
