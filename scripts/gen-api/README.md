# gen-api — OpenAPI → TypeScript models

Self-contained codegen toolchain (Node + TypeScript, no runtime deps; the
interactive picker needs `enquirer`, everything else only `tsx`). Emits **model
types only** — one deterministic file, deduplicated enums, no client (this
repo's transport is `serverFetch`; see ADR 0002/0007).

## Commands

| Command                | Does                                                                                           |
| ---------------------- | ---------------------------------------------------------------------------------------------- |
| `pnpm gen:api`         | Spec (+`selection.json` scope, `codegen.json` naming) → `src/lib/api/generated/model/index.ts` |
| `pnpm gen:api:pick`    | Interactive search/multi-select of operations → writes `selection.json`                        |
| `pnpm gen:api:sync`    | Backend changed: pull `OPENAPI_SPEC` → snapshot → regenerate → show the diff                   |
| `pnpm check:api-fresh` | CI/local gate: regenerate and fail on drift                                                    |

## Files

- `core.ts` — the pure generator (unit-tested in `core.test.ts`); emits both
  the types (`model/index.ts`) and matching zod validators (`schemas.ts`)
  from the same schema walk, so the two artifacts cannot drift
- `io.ts` — shared env/spec/selection loading; all paths live here
- `generate.ts` / `sync.ts` / `pick.ts` / `check-fresh.ts` — thin commands
- `openapi/openapi.json` — LOCAL spec snapshot (gitignored: it maps the
  backend's whole API surface, admin endpoints included — that recon map
  stays out of the repo; recreate anytime with `pnpm gen:api:sync`)
- `openapi/selection.json` — operation scope; `"operations": "*"` = full spec
- `openapi/codegen.json` — inline-enum naming (`{ "role": "UserRole" }`)

## Design rules

- **Derived state**: output is rewritten wholesale every run — never edited,
  never merged. A backend rename shows up as a rename; `typecheck` finds the
  consumers.
- **Deterministic**: same inputs → byte-identical output (what `check:api-fresh`
  relies on).
- **Fail loudly**: unknown constructs, stale selections and enum-name
  collisions are build errors with instructions — never guesses.

## Porting to another repo

1. Copy this folder.
2. Add the four script entries above to `package.json` (needs `tsx`;
   plus `enquirer` if you want the picker).
3. Create `openapi/` with `{ "operations": "*" }` as `selection.json`; set
   `OPENAPI_SPEC` in `.env` and run `pnpm gen:api:sync` for the local
   snapshot (gitignore it); narrow later with the picker.
4. Optional: `openapi/codegen.json` for domain enum names; a CI job calling
   `check:api-fresh` (see `.github/workflows/api-codegen.yml` here).
