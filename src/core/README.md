# Core

Cross-cutting **domain infrastructure** that more than one feature (or the
middleware) depends on — but which carries **no UI**. This is the layer that lets
the "features never import features" rule stay honest: shared domain logic sinks
here instead of one feature reaching into another.

## Dependency direction

```
app → features → core → (components/ui, lib) → generated
```

`core/` may import `@/lib/*` and `@/config/*`. It MUST NOT import `@/modules/*`
or `@/components/*` (no UI). Features and the middleware import `core`, never the
reverse.

## Modules

### `identity/`

Shared user-domain primitives — edge/client-safe, no I/O.

| Entry             | Contents                                                                                                                           |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `@/core/identity` | `UserRole` / `UserStatus` (re-exported generated unions — SaleNet's `sm-*` strings) + `roleFromValue`/`statusFromValue` validators |

Consumed by `session`, the authz-to-be, and the `users` feature facade — which
is why it lives in `core` (more than one consumer) rather than inside a feature.

### `session/`

Identity & session infrastructure.

| Entry                     | Runtime         | Contents                                                                                                                                    |
| ------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `@/core/session`          | client-safe     | types only (`SessionData`, `SessionUser`)                                                                                                   |
| `@/core/session/server`   | **server-only** | cookie store (`getSession`/`setSession`/`clearSession`) + `refreshSessionAndPersist`, `withAuthRetry`, identity re-exports (`fetchProfile`) |
| `@/core/session/session`  | edge-safe       | JWE seal/open, cookie constants, refresh threshold — imported directly by `src/proxy.ts`                                                    |
| `@/core/session/identity` | edge-safe       | token refresh (single-flight) + `GET /users/me` on `serverFetch` — shared by auth flows and the middleware                                  |

The split mirrors the runtime boundary: `proxy.ts` runs at the edge and pulls the
edge-safe modules directly; Server Components / actions use the `server` barrel.

### `guard/`

Access-control policy + helpers (consumes `session/`).

| Entry                  | Runtime         | Contents                                                                                        |
| ---------------------- | --------------- | ----------------------------------------------------------------------------------------------- |
| `@/core/guard`         | edge-safe       | pure `evaluateGuard(path, hasSession)` + `PROTECTED/AUTH` route policy — used by `src/proxy.ts` |
| `@/core/guard/require` | **server-only** | `requireSession()` for Server Components & actions (defense-in-depth + redirect)                |

`evaluateGuard` is pure and unit-tested (`policy.test.ts`); `proxy.ts` is thin
plumbing that resolves the decision into a localized redirect URL.

There is deliberately no `authz/` module: role→permission policy was removed
with no admin surface to consume it (an unconfirmed permission matrix is a
liability, not a head start). When admin features land, rebuild it here on
`identity`'s `UserRole` — an exhaustive `Record<UserRole, Permission[]>` keeps
new backend roles a compile error. Git history has the previous cut.

## When to add to core

A thing belongs here when it is **domain logic** (not generic enough for `lib/`),
has **no UI** (that's `components/`), and is needed by **≥2 features or the
middleware**. If only one feature needs it, keep it in that feature until a second
consumer appears (rule of three).
