# salenet-web

The SaleNet web app — company landing, the invite-only signup funnel, and the
app-download/legal pages (see `docs/adr/0005-web-as-marketing-funnel.md`).
Built on Next.js 16 (App Router) with session auth against the SaleNet NestJS
backend, i18n, a typed API layer, and a full test/CI harness.

**What's inside**

- **Next.js 16 / React 19** — App Router, Turbopack, `output: 'standalone'`.
- **Session auth** — custom cookie sessions (JWE via `jose`, httpOnly) against
  a NestJS REST backend; guards in `src/core/guard`, session in `src/core/session`.
- **i18n** — next-intl, `vi`/`en` locales, locale-aware navigation enforced by lint.
- **UI** — Tailwind CSS v4 + shadcn/ui (Radix), Tabler icons, Storybook.
- **Data layer** — RSC-first (ADR 0002): a single `serverFetch` transport with
  orval-generated model types from the backend OpenAPI spec; Server Actions
  for mutations; MSW mocks for backend-free development and tests.
- **Quality** — TypeScript strict, ESLint (feature-boundary rules), Prettier,
  Vitest (+ coverage floors), Playwright e2e, i18n key parity check.

## Quickstart

```bash
nvm use              # Node 24.16 (.nvmrc)
corepack enable      # provides pnpm
pnpm install
cp .env.example .env # fill values; NEXT_PUBLIC_API_MOCKING=enabled → no backend needed
pnpm doctor          # environment sanity checks
pnpm dev             # http://localhost:3000
```

## Scripts

| Command                             | What                                              |
| ----------------------------------- | ------------------------------------------------- |
| `pnpm dev` / `pnpm build` / `start` | Run / build / serve the app                       |
| `pnpm typecheck`                    | `tsc --noEmit`                                    |
| `pnpm lint` / `pnpm lint:fix`       | ESLint (includes architecture boundary rules)     |
| `pnpm format` / `pnpm format:check` | Prettier                                          |
| `pnpm test` / `pnpm test:coverage`  | Vitest unit/integration (coverage floors)         |
| `pnpm test:e2e`                     | Playwright (dev server locally, prod build in CI) |
| `pnpm check:i18n`                   | i18n key parity across locales                    |
| `pnpm gen:api`                      | Regenerate API model types from the OpenAPI spec  |
| `pnpm storybook`                    | Component workbench                               |
| `pnpm doctor`                       | Environment sanity checks                         |

## Documentation

- [`ARCHITECTURE.md`](ARCHITECTURE.md) — where code goes (decision tree + rules).
- [`AGENTS.md`](AGENTS.md) — tech stack (pinned) + working rules; also the AI-agent brief.
- [`docs/adr/`](docs/adr/) — architecture decision records (stack rationale lives here).
- [`docs/golden-path/`](docs/golden-path/README.md) — shared-config blueprint.
- [`docs/runbooks/`](docs/runbooks/) — operational runbooks (rollback, …).
- [`src/modules/README.md`](src/modules/README.md) — feature-module rules.
- [`CONTRIBUTING.md`](CONTRIBUTING.md) / [`SECURITY.md`](SECURITY.md)

## Docker

Multi-stage build on the Next.js standalone output (small, non-root, healthchecked):

```bash
docker build -t salenet-web .
docker run --rm -p 3000:3000 --env-file .env salenet-web
```

CI publishes images to GHCR after the CI gate passes on `main` (staging) and on
`v*` tags (production) — see `.github/workflows/deploy.yml`.

## CI gates

Every PR must pass (`.github/workflows/`):

- **CI** — typecheck · lint · format · i18n keys · tests with coverage floors ·
  build · bundle-size budget; Playwright e2e against the production build;
  Storybook build (smoke); PR title follows Conventional Commits (squash-merge
  keeps history clean). Lighthouse runs as advisory signal only.
- **Security** — gitleaks secret scan, `pnpm audit` (high+), CodeQL.
- **API codegen freshness** — generated client must match the OpenAPI spec.

Branch protection is code — `.github/settings.yml` (Probot Settings app).
Renovate keeps dependencies fresh with a 3-day supply-chain cooldown
(`minimumReleaseAge`, mirrored in `pnpm-workspace.yaml`).
