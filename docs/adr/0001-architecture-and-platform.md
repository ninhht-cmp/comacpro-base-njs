# ADR 0001 — Architecture & platform foundations

- **Status:** Proposed
- **Date:** 2026-06-18
- **Deciders:** Frontend Platform, Staff Eng
- **Context tags:** structure, session, guard, observability, security, CI

## Context

`comacpro-base-njs` is a Next.js 16 / React 19 app (per-app repo within the
`organizations/` polyrepo). The code-quality foundation is strong: feature
modules with ESLint-enforced public barrels, orval codegen + CI freshness, t3-env,
husky/commitlint/lint-staged, vitest + Playwright + MSW, and pnpm supply-chain
controls (`minimumReleaseAge`). As the app and the number of contributing teams
grow, the gaps are at the **platform / operations / governance** layer, not the
code layer. This ADR records the decisions and the agreed direction.

## Decision 1 — Module layering (target)

One-directional dependency graph; **features never import features**.

```
app → features → core → (components/ui, lib) → generated
```

- `features/<name>/` — domain UI + server actions + schema; public surface only
  via barrels (`@/features/<name>`, `@/features/<name>/server`).
- `core/` (**new**) — cross-cutting **domain** infra without UI:
  - `core/session/` — JWE seal/open, cookie store, token refresh, `GET /me`.
  - `core/guard/` — access-control policy + helpers (see Decision 2).
- `components/` — presentation only (must not import `features`/`core`):
  `ui/` (shadcn), `form/` (**new**: shared `Field`/`FormError` — removes the
  `field.tsx` duplicated across `auth`/`users`), `theme/`, `layout/` (was the
  `common/` junk-drawer).
- `lib/api/` (**consolidate**) — single home for "talk to backend": `client.ts`
  (ky mutator + `ApiError`, was `lib/fetcher`), `query-client.ts`, `hydrate.tsx`,
  `generated/`.

**Why:** today `users` depends on `@/features/auth/server` for session, and
`proxy.ts` deep-imports `auth/server/{session,service}` behind an ESLint
exception. Both are symptoms of session being misfiled inside a feature.
Extracting `core/session` makes "features don't import features" honest and lets
the ESLint exception for `proxy.ts` be removed.

## Decision 2 — Route guards

Two surfaces, one policy:

- `core/guard/policy.ts` (**edge-safe**, no `next/headers`) — `PROTECTED_HREFS`,
  `AUTH_HREFS`, and a pure `evaluateGuard(path, hasSession)` consumed by
  `proxy.ts`. Unit-testable in isolation.
- `core/guard/require.ts` (**`server-only`**) — `requireSession()` /
  `requireGuest()` for Server Components & actions, replacing the hand-rolled
  `getSession()` + redirect copy-pasted per page.

`proxy.ts` becomes thin plumbing (cookie + locale) and delegates the decision.

## Decision 3 — Repo topology

**Keep polyrepo** (one repo per app, matching the existing `organizations/`
layout) and promote shared code to **published internal packages** (GitHub
Packages): the orval client, UI kit, the eslint/ts/tailwind presets, and
`core/session`. Revisit a Turborepo monorepo only if several apps end up sharing
a release cadence. _Owner decision required before any extraction work._

## Decision 4 — Observability

- **Errors:** Sentry (`@sentry/nextjs`) — client + server; `instrumentation.ts`
  already exposes `register()` and `onRequestError()` as the wiring points.
- **Traces/RUM:** OpenTelemetry → **Datadog** (org standard), Web Vitals via the
  `ReportWebVitals` reporter (already mounted; no-ops until
  `NEXT_PUBLIC_VITALS_ENDPOINT` is set).
- **On-call:** alerts route to **PagerDuty** (org standard).

## Decision 5 — Security headers / CSP

Baseline headers (HSTS, nosniff, frame/referrer/permissions policy) are
**enforced** now. CSP ships **Report-Only** first because the app uses an inline
theme script and the Google Identity Services SDK. Promotion to an enforced,
nonce-based CSP is prepped in code (`ThemeScript`/`next/script` accept `nonce`):
generate a per-request nonce in `proxy.ts`, thread it through the root layout,
replace `'unsafe-inline'` with `'nonce-<value>'`, and rename the header to
`Content-Security-Policy`.

## Status (P0 + P1 scaffolding)

**P0 (done):** security headers (Report-Only CSP); e2e in CI; `onRequestError`
hook + Web Vitals reporter + observability env placeholders; `CODEOWNERS`; ADR.

**P1 (done):** CodeQL + gitleaks (OSS binary, no license) + `pnpm audit` gate;
Renovate config; Codecov + Vitest coverage (patch-gated); `size-limit` bundle
budget; Lighthouse CI; container image (`Dockerfile` + standalone output) and a
`deploy.yml` skeleton (rollout step is a TODO); rollback runbook; feature-flag
seam (`src/config/flags.ts`); PR template; issue templates; CONTRIBUTING;
SECURITY; branch protection as code (`.github/settings.yml`).

## Still open (decisions / infra, not code)

| Owner action        | Item                                                                                                                          |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Install GitHub Apps | Renovate; Probot **Settings** (applies `settings.yml`)                                                                        |
| Add secrets/vars    | `CODECOV_TOKEN`; enable branch protection from `settings.yml`                                                                 |
| **Decide**          | Deploy target (registry + orchestrator) → fill `deploy.yml` rollout + runbook TODOs                                           |
| **Decide**          | Feature-flag vendor (LaunchDarkly/Unleash) if runtime flips are needed                                                        |
| P2 backlog          | a11y (axe) · visual regression · contract testing (Pact) · React Compiler · PPR · request-id propagation · edge rate-limiting |

## Consequences

- New `core/` layer and `components/form` to build (Decisions 1–2); app-facing
  feature barrels stay unchanged, so route/page code is untouched.
- Removing the `proxy.ts` ESLint exception is gated on the `core/session` move.
- `output: 'standalone'` is now set for the container build; non-container hosts
  ignore it.
- Decision 3 (topology) and the deploy/flag vendors still need owner sign-off.
