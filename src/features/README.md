# Features

Domain modules. Each feature is self-contained and exposes a public API via `index.ts`.

## Rules (enforced by ESLint)

- Code **outside** a feature folder MUST import only from `@/features/<name>` (the barrel), never deep paths.
- Code **inside** a feature MAY import from its own subfolders freely.
- Features MUST NOT import each other's internals. Cross-feature collaboration goes through public APIs (`@/features/other`).
- Shared primitives belong in `@/components/ui` (shadcn), `@/lib/*`, or `@comacpro/ui` — not inside a feature.

## Layout

```
features/<name>/
├─ components/   # React components owned by this feature
├─ hooks/        # feature-specific hooks
├─ api/          # query options, mutation wrappers (re-export orval hooks)
├─ schema/       # zod schemas
└─ index.ts      # public API — only what other features/app need
```

Create subfolders on demand. A feature that only needs `components/` and
`index.ts` shouldn't ship empty `api/` and `schema/` folders.
