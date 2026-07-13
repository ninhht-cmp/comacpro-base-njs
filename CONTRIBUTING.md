# Contributing

## Prerequisites

- Node `>=24.16` (see `.nvmrc`) and **pnpm** (`corepack enable`).
- Copy `.env.example` → `.env` and fill values. With
  `NEXT_PUBLIC_API_MOCKING=enabled` you can run without a backend (MSW).

```bash
pnpm install
pnpm dev
```

## Day-to-day commands

| Command                             | What                                            |
| ----------------------------------- | ----------------------------------------------- |
| `pnpm dev`                          | Run the app locally                             |
| `pnpm typecheck`                    | `tsc --noEmit`                                  |
| `pnpm lint` / `pnpm lint:fix`       | ESLint                                          |
| `pnpm format` / `pnpm format:check` | Prettier                                        |
| `pnpm test` / `pnpm test:coverage`  | Unit/integration (Vitest)                       |
| `pnpm test:e2e`                     | End-to-end (Playwright)                         |
| `pnpm check:i18n`                   | i18n key parity                                 |
| `pnpm gen:api`                      | Regenerate the API client from the OpenAPI spec |
| `pnpm doctor`                       | Environment sanity checks                       |

## Architecture rules (enforced)

- **Feature modules** (`src/features/<name>/`) are self-contained and expose a
  public surface only through **barrels** — `@/features/<name>` (client-safe)
  and `@/features/<name>/server` (server-only). Deep imports are an ESLint error.
- **Features must not import each other.** Shared logic goes to a lower layer
  (`core/`, `components/ui`, `lib/`). See `src/features/README.md` and
  `docs/adr/0001-architecture-and-platform.md`.
- The generated client under `src/lib/api/generated/` is **codegen output** —
  never hand-edit; change the spec and run `pnpm gen:api`.

## Commits & branches

- **Conventional Commits on the PR title** — PRs are squash-merged, so the
  title becomes the commit on `main`. CI validates it (`pr-title` job); local
  commit messages on the branch are free-form.
- Branch off `main`; keep PRs focused. Husky runs lint-staged (pre-commit) and
  typecheck (pre-push) locally.

## Pull requests

- Fill in the PR template; link the Jira issue (`CMP-XXXX`).
- Green CI is required: typecheck · lint · format · i18n · test (+coverage) ·
  build · e2e · CodeQL · security. Coverage must stay above the floors in
  `vitest.config.ts` (`coverage.thresholds`) — raise them as tests are added,
  never lower them.

## Adding things

- **New env var:** add to `src/config/env.ts` (zod) **and** `.env.example`.
- **New i18n string:** add to every locale under `src/i18n/messages/<locale>/`;
  register new namespaces in `messages/index.ts` and `types.d.ts`.
- **New API call:** prefer the generated client + a feature `server/service.ts`;
  keep `fetch`/transport concerns out of components.
