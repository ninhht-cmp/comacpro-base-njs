# Modules

Vertical slices, one per business domain (mirrors the NestJS backend's module
layout). Each module is self-contained and exposes its public surface through
**barrels** — never deep paths. `auth/` is the reference implementation.

## Rules (enforced by ESLint)

- Code **outside** a module MUST import only through a module's public barrels:
  - `@/modules/<name>` — client-safe surface (components, isomorphic schemas).
  - `@/modules/<name>/server` — server-only surface (server actions). Carries the
    `'use server'` boundary; importing it from a Client Component is a build error.
- Deep paths (`@/modules/<name>/components/...`, `.../server/actions`, …) are
  forbidden.
- Code **inside** a module MAY import its own subfolders freely — use **relative**
  paths (`../server/actions`, `../schema`).
- Modules MUST NOT reach into each other's internals. Cross-module
  collaboration goes through a **lower layer**, not the sibling — cross-cutting
  domain infra lives in `@/core/*` (e.g. `@/core/session`), shared UI in
  `@/components/*`, generic utilities in `@/lib/*`.
- Shared primitives belong in `@/components/ui` (shadcn), `@/components/form`
  (Field/FormError), `@/core/*` or `@/lib/*` — not inside a module.

### Client ↔ server boundary

Client components import their server **actions** directly (the action file
carries its own `'use server'` boundary), e.g. `import { login } from '../server/actions'`.
They must NOT import `../server` (the barrel) when it re-exports `next/headers`
code. Session/identity infra is **not** in the module: it lives in the session
core — `@/core/session` (types), `@/core/session/server` (cookies + identity,
server-only), and the edge-safe `@/core/session/{session,identity}` that the
middleware (`src/proxy.ts`) imports directly.

## Layout

```
modules/<name>/
├─ components/      # React components owned by this module (client)
├─ server/          # server actions + services (this module's flows)
│  └─ index.ts      #   server barrel → @/modules/<name>/server
├─ api/             # wire DTO → domain mappers (+ domain types, + tests)
├─ schema/          # zod schemas (isomorphic)
├─ hooks/           # module-specific hooks
└─ index.ts         # client barrel → @/modules/<name>
```

Create subfolders on demand. A module that only needs `components/` and
`index.ts` shouldn't ship empty `api/` and `schema/` folders. Anything used by
**more than one** module (or by the middleware) is a sign it belongs in
`@/core/*`, not in a module — see `src/core/README.md`.
