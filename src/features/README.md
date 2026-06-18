# Features

Domain modules. Each feature is self-contained and exposes its public surface
through **barrels** — never deep paths. `auth/` is the reference implementation.

## Rules (enforced by ESLint)

- Code **outside** a feature MUST import only through a feature's public barrels:
  - `@/features/<name>` — client-safe surface (components, isomorphic schemas).
  - `@/features/<name>/server` — server-only surface (server actions, session,
    `fetch`-based services). Pulls in `next/headers`; importing it from a Client
    Component is a (deliberate) build error.
- Deep paths (`@/features/<name>/components/...`, `.../server/actions`, …) are
  forbidden.
- Code **inside** a feature MAY import its own subfolders freely — use **relative**
  paths (`../server/actions`, `./field`).
- Features MUST NOT reach into each other's internals. Cross-feature
  collaboration goes through the sibling's barrels.
- Shared primitives belong in `@/components/ui` (shadcn) or `@/lib/*` — not inside
  a feature.

### Client ↔ server boundary

Client components import their server **actions** directly (the action file
carries its own `'use server'` boundary), e.g. `import { login } from '../server/actions'`.
They must NOT import `../server` (the barrel) — it re-exports `next/headers`
code. The middleware (`src/proxy.ts`) is the one allowed exception: it imports
the edge-safe `server/session` and `server/service` modules directly.

## Layout

```
features/<name>/
├─ components/      # React components owned by this feature (client)
├─ server/          # server actions, session/cookies, fetch services
│  └─ index.ts      #   server barrel → @/features/<name>/server
├─ api/             # query options / mutation wrappers around orval hooks
├─ schema/          # zod schemas (isomorphic)
├─ hooks/           # feature-specific hooks
└─ index.ts         # client barrel → @/features/<name>
```

Create subfolders on demand. A feature that only needs `components/` and
`index.ts` shouldn't ship empty `api/` and `schema/` folders.
