<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

Known deltas from training data: middleware lives in `src/proxy.ts` (exports
`proxy`), `params`/`searchParams` are async, `revalidateTag(tag, 'max')`.

Guidance for AI coding agents working in this repository. `CLAUDE.md` points
here; keep this file vendor-neutral.

## Development philosophy

Solo-maintained. Originally the Comacpro base template, now the standalone
**SaleNet web product** (landing + invite-only signup funnel — ADR 0005).
Quality bar stays high, but don't over-engineer: prefer the simplest correct
solution, delete dead code, and record real decisions in `docs/adr/`. Every
non-obvious choice gets a short comment explaining _why_ — never comments
that restate the code.

## Tech stack (pinned)

- **Node 24.16** (`.nvmrc`), **pnpm** (see `packageManager`), Turbopack
- **Next.js 16 / React 19** — App Router, RSC-first, `output: 'standalone'`
- **next-intl v4** — single locale `vi` (unprefixed) by deliberate choice;
  localized pathnames in `src/i18n/routing.ts`. The i18n layer stays for
  typed, centralized copy — adding a locale back is config + message files.
- **Tailwind v4** (CSS-first config in `src/styles/globals.css`) + shadcn (radix)
- **zod v4** for boundary validation; **jose** for the JWE session cookie
- **gen:api** (`scripts/gen-api/`, in-house) — generates model types from the
  OpenAPI spec; dedupes inline enums via `openapi/codegen.json` (ADR 0007)
- **Vitest** (+ Testing Library, MSW) / **Playwright** / **Storybook**

## Architecture (read before adding features)

RSC-first; there is deliberately NO client-side query cache — see
`docs/adr/0002-rsc-first-data-layer.md`:

- Data: session cookie → RSC → `serverFetch` (`src/lib/api/server-fetch.ts`,
  unwraps the SaleNet envelope) → mapper (`modules/*/api/mapper.ts`) → props
  to client components.
- Mutations: client → Server Action (`modules/*/server/actions.ts`, zod at
  the boundary, returns `{ error, fieldErrors }`) → `router.refresh()`.
- Auth: NestJS issues tokens; we seal them in an encrypted httpOnly cookie
  (`src/core/session`). `src/proxy.ts` refreshes proactively; Server Actions
  use `withAuthRetry` for 401-refresh-retry.
- `src/core/` = app-agnostic kernel (session, guard, authz). `src/modules/`
  = vertical slices. `src/components/` = shared UI.

## Where should this code go?

Full decision tree + smells: `ARCHITECTURE.md`. Quick version:

```
Is it a NestJS API call?            → modules/<name>/server/service.ts (via serverFetch)
Is it a form mutation?              → modules/<name>/server/actions.ts (Server Action)
Is it a wire-type → domain mapping? → modules/<name>/api/mapper.ts (+ test)
Is it feature UI?                   → modules/<name>/components/
Is it shared, feature-free UI?      → components/ (ui/ = shadcn primitives)
Is it session/authz/routing policy? → core/ (keep it pure + tested)
Is it a wire DTO type?              → generated: run `pnpm gen:api`, never hand-edit
```

## Hard rules (ESLint-enforced — don't fight them)

- Import features ONLY through barrels: `@/modules/<name>` (client) or
  `@/modules/<name>/server`. Deep imports fail lint by default.
- Never import `next/link` or `redirect`/`useRouter` from `next/navigation` —
  use `@/i18n/navigation` (locale-aware wrappers).
- `src/lib/api/generated/model` is the only supported generated import;
  `generated/.reference/` is quarantined output, never import it.

## Quick commands

```bash
pnpm doctor          # environment sanity check (run after clone)
pnpm dev             # dev server (Turbopack)
pnpm typecheck && pnpm lint && pnpm vitest run   # the local gate
pnpm check:i18n      # message-key parity across locales (no-op at 1 locale)
pnpm gen:api         # regenerate API models (needs OPENAPI_SPEC or local spec)
pnpm test:e2e        # Playwright (builds prod in CI, dev server locally)
```

Before finishing any task: `pnpm typecheck`, `pnpm lint`, `pnpm vitest run`,
and `pnpm check:i18n` if you touched messages. Don't run `pnpm build` while
the dev server is running.

## Gotchas

- Every user-facing string lives in `src/i18n/messages/vi/*.json` (never
  hardcoded in components) — typed keys, single source for copy edits.
- Server Actions return ready-to-display (already translated) messages;
  `fieldErrors` is keyed by input `name` (`src/lib/forms/field-errors.ts`).
- Backend is **SaleNet** (`/v1` prefix): every response is wrapped in the
  `BaseResDto` envelope `{ success, data, messages, statusCode }`;
  `serverFetch` unwraps it (`serverFetchPage` keeps `pagination`). See
  docs/adr/0003-salenet-backend.md.
- Usernames ARE Vietnamese phone numbers; user ids are UUID strings; roles
  are the 13 `sm-*` strings (generated unions re-exported by
  `@/core/identity`).
- The committed `openapi/openapi.json` is a snapshot of the SaleNet spec;
  regen with `pnpm gen:api`. Scope is per-operation and lives in
  `openapi/selection.json` — run `pnpm gen:api:pick` (interactive: search +
  multi-select the operations to generate) to change it, then `pnpm gen:api`.
  The selection file is committed, so `gen:api`/`check:api-fresh` stay
  deterministic (the generator prunes the spec to it).
- Tests colocate with source (`*.test.ts[x]`); mock HTTP with MSW
  (`server.use(...)`), never fetch stubs.

## Node.js version upgrade checklist

Update together: `.nvmrc`, `package.json` engines, `Dockerfile`
(`NODE_VERSION`), `CONTRIBUTING.md`, this file's Tech stack section.
