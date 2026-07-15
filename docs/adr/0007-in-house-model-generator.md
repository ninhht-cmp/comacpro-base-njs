# ADR 0007 — In-house OpenAPI model generator (retire orval)

- **Status:** Accepted
- **Date:** 2026-07-15
- **Relates to:** ADR 0002 (RSC-first data layer), ADR 0003 (SaleNet backend)

## Context

After ADR 0002 narrowed codegen to model types only, orval remained the
generator — and fought that narrow use the whole way:

- **It cannot emit models alone.** A 356-line fetch client had to ride along,
  quarantined in `generated/.reference/` with lint rules so nobody imports it.
- **Inline enums were duplicated per DTO.** NestJS declares enums inline per
  property, and orval names each occurrence `<Dto><Prop>`: the same 13-value
  role set existed as `ProfileMeResDtoRole`, `UserMinimalResDtoRole` AND
  `UserRefResDtoRole` (status likewise ×3).
- **Dead operation wrappers.** Eight `<Controller><Op>200` envelope types were
  generated that nothing imported (`serverFetch` unwraps the envelope).
- **Fragmentation.** 44 files for 21 schemas — 20 of them under 4 meaningful
  lines — plus a custom input transformer just to scope generation to
  `openapi/selection.json`.

The spec uses a narrow OpenAPI subset (`$ref`, `allOf`, `oneOf`, `nullable`,
inline enums), so a purpose-built generator is small and fully controllable.

## Decision

Replace orval with `scripts/gen-api/` (~450 lines, Node + TypeScript, zero new
dependencies; pure core + thin I/O entry, unit-tested):

- **Selection-driven**: emits only schemas transitively `$ref`ed by the
  operations in `openapi/selection.json` (absorbs the old transformer,
  including its empty-`enum` sanitation). A selected operation missing from
  the spec is an error, not a silent skip.
- **Enums deduplicated by value-set** and given domain names via
  `openapi/codegen.json` (`enumNames`, keyed by property name; default is the
  PascalCase property name). Naming ambiguity or collision is a build error —
  never a guess. `UserRole`/`UserStatus`/`NotificationEvent` are now defined
  once, and `core/identity` simply re-exports them.
- **One output file** (`model/index.ts`), alphabetically sorted; the generator
  owns the directory and rewrites it wholesale, so deselected schemas can
  never linger. `check:api-fresh` and the freshness workflow are unchanged.
- **No clients, no operation types, no quarantine.** Unsupported constructs
  (`anyOf`, non-schema `$ref`s, …) fail the build loudly.
- Portable by design: copy `scripts/gen-api/` + the `gen:api` script entry to
  reuse in another repo (`openapi/codegen.json` carries per-project naming).

`pnpm gen:api:pick` (operation picker) is unchanged. `gen:api:watch` was
dropped with orval — regeneration is a deliberate, spec-driven act.

## Consequences

- Generated surface: 47 files → 1 file (~226 lines); orval + its config and
  the input transformer are gone from the toolchain.
- The generator is code we own: new OpenAPI constructs in future specs need a
  small extension here (they fail loudly until added) — accepted in exchange
  for exact control over naming, dedup and output shape.
- The emitted names (`UserRole` etc.) ARE the domain names, defined in
  `openapi/codegen.json`; renaming a domain enum is config, not a refactor.
- Response envelope types are deliberately not generated; `serverFetch` owns
  the envelope (ADR 0003). Runtime response validation remains the deliberate
  debt tracked in ADR 0002.
- **Amended 2026-07-15**: the spec snapshot is now a LOCAL, gitignored cache
  (`pnpm gen:api:sync` recreates it) — committing it published the backend's
  entire API surface (admin/wallet operations included) alongside the app.
  The committed inputs are `selection.json` + `codegen.json` (non-sensitive:
  they name only the operations the app visibly calls); the committed
  generated models keep CI building offline. The snapshot remains in git
  HISTORY — scrub with a history rewrite before the repo is ever made public.
