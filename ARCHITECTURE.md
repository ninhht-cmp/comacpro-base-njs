# Architecture — where code goes and why

One page. If you're about to add a file and aren't sure where it belongs,
answer the questions below in order. The layout is a **modular monolith**:
vertical slices per business domain (`modules/`), a pure kernel (`core/`),
shared neutral code (`components/`, `lib/`), and thin routes (`app/`). The
boundaries are ESLint-enforced, so the compiler — not code review — catches
violations.

## The decision tree

```
Is it tied to ONE business domain (auth, users, deals, …)?
│
├─ YES → modules/<name>/          ← the unit of growth; copy the shape of auth/
│         ├─ server/service.ts     calls the NestJS API (via serverFetch)
│         ├─ server/actions.ts     form mutations (Server Actions, zod boundary)
│         ├─ api/mapper.ts         wire DTO → domain type (+ test)
│         ├─ schema/               zod input schemas (isomorphic)
│         ├─ components/           UI owned by this domain
│         └─ index.ts / server/index.ts   the ONLY public entrypoints
│
└─ NO → is it app-agnostic policy/infra (session, authz, route guard)?
    │
    ├─ YES → core/                ← pure, tested, no feature imports
    │
    └─ NO → is it UI?
        │
        ├─ YES → components/      ← domain-free, reusable
        │         ui/        shadcn primitives (generated, tweak-in-place)
        │         form/      Field, PasswordField, FormError
        │         layout/    header, footer, nav, logo
        │         marketing/ landing-page building blocks
        │
        └─ NO → lib/              ← pure functions/utilities, domain-free
                 (api/ transport, forms/, observability/, misc)

app/    = routes only: resolve params → guard → fetch via modules/*/server
          → compose modules/*/components. Pages stay THIN — if a page grows
          logic or big markup, extract it into the owning module.
config/ = runtime configuration (env validation, constants like app-links).
i18n/   = ALL user-facing strings (messages/vi/*.json) + routing registry.
```

Two litmus tests when the tree feels ambiguous:

- **Used by more than one module (or by the middleware)?** Then it does not
  belong in a module — push it down to `core/` (domain infra), `components/`
  (UI) or `lib/` (pure util). Example: `lib/full-name.ts` is in `lib/` because
  both signup and (future) profile editing validate names; if only auth ever
  used it, it would live in `modules/auth/`.
- **Would this file still make sense if the SaleNet domain vanished?**
  YES → `lib/`/`components/`/`core/`. NO → it encodes domain knowledge and
  belongs in a module.

## Hard rules (ESLint enforces these — don't fight them)

1. **Barrel-only module imports.** Outside code imports `@/modules/<name>`
   (client surface) or `@/modules/<name>/server` (server surface). Deep paths
   are a lint error. Inside a module, use relative paths.
2. **No cross-module reach-ins.** Modules talk to siblings only via their
   barrels; anything two modules share moves DOWN a layer, never sideways.
3. **Locale-aware navigation only.** `Link`/`redirect`/`useRouter` come from
   `@/i18n/navigation`, never `next/link`/`next/navigation`.
4. **Generated code is read-only.** `src/lib/api/generated/model` is the only
   importable generated path; regen with `pnpm gen:api` (scope via
   `pnpm gen:api:pick`). Never hand-edit.
5. **Every user-facing string lives in `src/i18n/messages/vi/*.json`.**
   Components never hardcode copy; Server Actions return already-translated
   messages.

## Data-flow conventions (see ADR 0002/0003)

- **Reads**: session cookie → RSC → `serverFetch` (unwraps the SaleNet
  envelope) → `modules/*/api/mapper.ts` → typed props to client components.
  No client-side query cache, by decision.
- **Writes**: client form → Server Action (`modules/*/server/actions.ts`,
  zod at the boundary) → returns `{ error, fieldErrors, values }` →
  `router.refresh()` / redirect (PRG).
- **The mapper is an anti-corruption layer**: the only module file allowed to
  import generated DTOs. App code sees domain types (`User`), never the wire
  shape.

## Smells that mean "wrong place"

- A page in `app/` longer than ~150 lines or containing business logic →
  extract into the owning module.
- `lib/` code importing from `modules/` or mentioning a domain concept →
  it's domain code; move it into the module (or `core/` if it's policy).
- Two modules importing each other → the shared piece wants to live in
  `core/`/`lib/`; extract it.
- A module subfolder exported outside the barrel → widen the barrel instead.
- An empty `api/`/`schema/`/`hooks/` folder created "for later" → delete it;
  subfolders are created on demand (`src/modules/README.md`).

## Adding a new domain (checklist)

1. `pnpm gen:api:pick` — select the operations, then `pnpm gen:api`.
2. Create `src/modules/<name>/` copying `auth/`'s shape (only the subfolders
   you need). Write the mapper first, with a test.
3. Register routes in `src/i18n/routing.ts` (typed route registry) and add
   messages in `src/i18n/messages/vi/`.
4. Guard policy (public/protected) in `src/core/guard/policy.ts` if needed.
5. Barrels last: export exactly what pages need, nothing more.

Decisions with rationale live in `docs/adr/`; per-layer rules in
`src/modules/README.md` and `src/core/README.md`.
