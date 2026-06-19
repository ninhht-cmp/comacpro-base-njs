# Features

Domain modules. Each feature is self-contained and exposes its public surface
through **barrels** — never deep paths. `auth/` is the reference implementation.

## Rules (enforced by ESLint)

- Code **outside** a feature MUST import only through a feature's public barrels:
  - `@/features/<name>` — client-safe surface (components, isomorphic schemas).
  - `@/features/<name>/server` — server-only surface (server actions). Carries the
    `'use server'` boundary; importing it from a Client Component is a build error.
- Deep paths (`@/features/<name>/components/...`, `.../server/actions`, …) are
  forbidden.
- Code **inside** a feature MAY import its own subfolders freely — use **relative**
  paths (`../server/actions`, `../schema`).
- Features MUST NOT reach into each other's internals. Cross-feature
  collaboration goes through a **lower layer**, not the sibling — cross-cutting
  domain infra lives in `@/core/*` (e.g. `@/core/session`), shared UI in
  `@/components/*`, generic utilities in `@/lib/*`.
- Shared primitives belong in `@/components/ui` (shadcn), `@/components/form`
  (Field/FormError), `@/core/*` or `@/lib/*` — not inside a feature.

### Client ↔ server boundary

Client components import their server **actions** directly (the action file
carries its own `'use server'` boundary), e.g. `import { login } from '../server/actions'`.
They must NOT import `../server` (the barrel) when it re-exports `next/headers`
code. Session/identity infra is **not** in the feature: it lives in the session
core — `@/core/session` (types), `@/core/session/server` (cookies + identity,
server-only), and the edge-safe `@/core/session/{session,identity}` that the
middleware (`src/proxy.ts`) imports directly.

## Layout

```
features/<name>/
├─ components/      # React components owned by this feature (client)
├─ server/          # server actions (this feature's flows)
│  └─ index.ts      #   server barrel → @/features/<name>/server
├─ api/             # query options / mutation wrappers around orval hooks
├─ schema/          # zod schemas (isomorphic)
├─ hooks/           # feature-specific hooks
└─ index.ts         # client barrel → @/features/<name>
```

Create subfolders on demand. A feature that only needs `components/` and
`index.ts` shouldn't ship empty `api/` and `schema/` folders. Anything used by
**more than one** feature (or by the middleware) is a sign it belongs in
`@/core/*`, not in a feature — see `src/core/README.md`.
