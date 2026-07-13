# Golden Path — shared config blueprint

> **Status:** Draft / proposal. This is a blueprint to extract into its own repo
> `organizations/shared/golden-path` (published to GitHub Packages). Nothing here
> runs inside this app — the code blocks are the source to lift out.

## Why

Today every app hand-rolls `eslint.config`, `tsconfig`, `prettier`, hooks and a
full CI workflow. With many repos under `organizations/`, those copies **drift**.
The golden path inverts this: **one source of truth**, apps _extend_ it.

Principles:

- **Extend, don't copy.** An app's config shrinks to a few lines + its overrides.
- **Single source, semver'd.** Breaking changes are a major bump, never a silent
  edit rippling across repos.
- **Thin at the edge.** App-specific concerns stay in the app (see "What NOT to
  centralize").
- **Escape hatches.** Every preset is an array/object an app can append to or
  override — the golden path is a default, not a cage.

## Repo layout (`organizations/shared/golden-path`)

```
golden-path/
├─ package.json                 # pnpm workspace root, changesets
├─ pnpm-workspace.yaml          # packages: ['packages/*']
├─ .changeset/
├─ packages/
│  ├─ eslint-config/            # @comacpro/eslint-config
│  │  ├─ package.json
│  │  ├─ base.js                #   TS/import/prettier base
│  │  └─ next.js                #   base + next + feature-boundary rules
│  ├─ tsconfig/                 # @comacpro/tsconfig
│  │  ├─ package.json
│  │  ├─ base.json
│  │  └─ nextjs.json
│  ├─ prettier-config/          # @comacpro/prettier-config
│  │  ├─ package.json
│  │  └─ index.json
│  └─ commitlint-config/        # @comacpro/commitlint-config
│     ├─ package.json
│     └─ index.js
└─ .github/
   └─ workflows/
      ├─ ci.yml                 # reusable: workflow_call (the whole gate)
      └─ security.yml           # reusable: codeql + gitleaks + audit
```

> Reusable **workflows** must live in a repo's `.github/workflows/` and are
> referenced as `uses: comacpro/golden-path/.github/workflows/ci.yml@v1`.
> Config **presets** are npm packages published to GitHub Packages.

---

## 1) `@comacpro/eslint-config`

`packages/eslint-config/package.json`

```json
{
  "name": "@comacpro/eslint-config",
  "version": "1.0.0",
  "type": "module",
  "exports": {
    "./base": "./base.js",
    "./next": "./next.js"
  },
  "peerDependencies": {
    "eslint": "^9",
    "eslint-config-next": ">=16",
    "eslint-config-prettier": "^10",
    "typescript": "^5"
  },
  "publishConfig": { "registry": "https://npm.pkg.github.com" }
}
```

`packages/eslint-config/next.js` — bakes in the **org feature-boundary
convention** so every app enforces it identically:

```js
import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import prettierConfig from 'eslint-config-prettier';

// Public-barrel-only rule for feature modules — the org's architecture invariant.
const featureBoundary = {
  files: ['src/**/*.{ts,tsx}'],
  ignores: ['src/features/**', 'src/i18n/navigation.ts', 'src/proxy.ts'],
  rules: {
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            // Allow-list: ban every deep path under a feature by default and
            // re-allow only the server barrel (the client barrel
            // `@/features/<name>` is one segment, never matched by `*/**`) —
            // new internal directories are blocked without touching the rule.
            group: ['@/features/*/**', '!@/features/*/server'],
            message:
              'Import features via their public barrels: `@/features/<name>` or `@/features/<name>/server`.',
          },
          { group: ['next/navigation'], message: 'Use `@/i18n/navigation`.' },
        ],
      },
    ],
  },
};

/** @param {{ ignores?: string[] }} [opts] */
export default function comacproNext(opts = {}) {
  return defineConfig([
    ...nextVitals,
    ...nextTs,
    prettierConfig,
    featureBoundary,
    globalIgnores([
      '.next/**',
      'out/**',
      'coverage/**',
      'src/lib/api/**', // generated
      ...(opts.ignores ?? []),
    ]),
  ]);
}
```

Consuming app `eslint.config.mjs` (was ~130 lines → now ~6):

```js
import comacproNext from '@comacpro/eslint-config/next';

export default [
  ...comacproNext(),
  // app-only overrides go here
];
```

---

## 2) `@comacpro/tsconfig`

`packages/tsconfig/nextjs.json`

```jsonc
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "./base.json",
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "esnext"],
    "jsx": "preserve",
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] },
  },
}
```

Consuming app `tsconfig.json`:

```jsonc
{
  "extends": "@comacpro/tsconfig/nextjs.json",
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"],
}
```

`base.json` holds the strict flags (`strict`, `noUncheckedIndexedAccess`,
`verbatimModuleSyntax`, `moduleResolution: bundler`, …) — change once, every app
tightens together.

---

## 3) `@comacpro/prettier-config` & `@comacpro/commitlint-config`

`packages/prettier-config/index.json`

```json
{
  "singleQuote": true,
  "trailingComma": "all",
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

App `package.json`: `"prettier": "@comacpro/prettier-config"`.

`packages/commitlint-config/index.js`

```js
export default { extends: ['@commitlint/config-conventional'] };
```

App `commitlint.config.js`: `export { default } from '@comacpro/commitlint-config';`

> **Hooks** stay in the app (husky `.husky/*` are 3 one-liners) — not worth a
> package, and they call app scripts. Optionally ship a `prepare`-time installer.

---

## 4) Reusable CI workflow

`golden-path/.github/workflows/ci.yml` — the **entire gate as a service**, with
inputs to toggle the optional jobs per app:

```yaml
name: CI (reusable)
on:
  workflow_call:
    inputs:
      node-version-file: { type: string, default: '.nvmrc' }
      run-e2e: { type: boolean, default: false }
      run-lighthouse: { type: boolean, default: false }
      run-size: { type: boolean, default: false }
    secrets:
      CODECOV_TOKEN: { required: false }

jobs:
  quality:
    runs-on: ubuntu-latest
    env: { SKIP_ENV_VALIDATION: 'true' }
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          { node-version-file: '${{ inputs.node-version-file }}', cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm typecheck
      - run: pnpm lint
      - run: pnpm format:check
      - run: pnpm test:coverage
      - uses: codecov/codecov-action@v5
        with: { files: ./coverage/lcov.info, fail_ci_if_error: false }
        env: { CODECOV_TOKEN: '${{ secrets.CODECOV_TOKEN }}' }
      - run: pnpm build
      - if: ${{ inputs.run-size }}
        run: pnpm size

  e2e:
    if: ${{ inputs.run-e2e }}
    runs-on: ubuntu-latest
    env: { SKIP_ENV_VALIDATION: 'true', NEXT_PUBLIC_API_MOCKING: 'enabled' }
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          { node-version-file: '${{ inputs.node-version-file }}', cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm exec playwright install --with-deps chromium
      - run: pnpm test:e2e

  lighthouse:
    if: ${{ inputs.run-lighthouse }}
    runs-on: ubuntu-latest
    env: { SKIP_ENV_VALIDATION: 'true', NEXT_PUBLIC_API_MOCKING: 'enabled' }
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          { node-version-file: '${{ inputs.node-version-file }}', cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
      - run: pnpm lhci
```

Consuming app `.github/workflows/ci.yml` (was ~100 lines → now ~10):

```yaml
name: CI
on:
  push: { branches: [main] }
  pull_request:
concurrency: { group: ci-${{ github.ref }}, cancel-in-progress: true }
jobs:
  ci:
    uses: comacpro/golden-path/.github/workflows/ci.yml@v1
    with: { run-e2e: true, run-lighthouse: true, run-size: true }
    secrets: { CODECOV_TOKEN: '${{ secrets.CODECOV_TOKEN }}' }
  security:
    uses: comacpro/golden-path/.github/workflows/security.yml@v1
```

This is the key win: **fix a CI step once in golden-path `@v1`, every app gets it**
on next run — no PR-to-50-repos.

---

## 5) Versioning & governance

- **Publish** packages to GitHub Packages; apps pin `^1`. Reusable workflows are
  pinned by tag (`@v1`) — move the `v1` tag for non-breaking fixes, cut `v2` for
  breaking ones (so apps opt in deliberately).
- **Changesets** for releases + a CHANGELOG; breaking changes require a migration
  note.
- **CODEOWNERS** of golden-path = `@comacpro/frontend-platform`. Apps don't fork
  it; they request changes upstream (the org standard becomes a real conversation,
  not silent per-repo drift).
- Provide a **`create-comacpro-app`** generator (or a template repo) that
  scaffolds a new app already wired to `@v1` — the literal "golden path" a team
  starts on.

## 6) What NOT to centralize (judgment, not dogma)

Keep app-side — centralizing these causes more coupling than it removes:

- **Business config**: routes, i18n messages, feature flags, env _values_.
- **`next.config` app specifics**: security headers may start shared but CSP
  sources are app-specific (Google GSI here, something else elsewhere).
- **Domain code & the generated API client** (per-app spec).
- **Deploy targets** until the org standardizes one platform.

A golden path that tries to own everything becomes the bottleneck it was meant
to remove. Centralize the _invariants_ (lint rules, TS strictness, the CI gate
shape); leave the _variables_ at the edge.

---

## 7) Adoption path for `comacpro-base-njs`

1. Extract this blueprint into `organizations/shared/golden-path`; publish `@v1`.
2. Replace this app's `eslint.config.mjs` / `tsconfig.json` / prettier / commitlint
   with the extends-shims above. Diff `pnpm lint`/`typecheck` before & after —
   should be a no-op (the presets encode today's rules verbatim).
3. Swap `.github/workflows/ci.yml` for the `uses:` caller; keep `api-codegen.yml`
   app-side (spec is app-specific).
4. Delete the now-duplicated config from the app. Net: this repo loses ~250 lines
   of config, gains a 1-line dependency on the org standard.
5. Roll the same shims into the next app — now it's a 4-file change, not a copy.
