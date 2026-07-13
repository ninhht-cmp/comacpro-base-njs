# Core

Cross-cutting **domain infrastructure** that more than one feature (or the
middleware) depends on — but which carries **no UI**. This is the layer that lets
the "features never import features" rule stay honest: shared domain logic sinks
here instead of one feature reaching into another.

## Dependency direction

```
app → features → core → (components/ui, lib) → generated
```

`core/` may import `@/lib/*` and `@/config/*`. It MUST NOT import `@/features/*`
or `@/components/*` (no UI). Features and the middleware import `core`, never the
reverse.

## Modules

### `identity/`

Shared user-domain primitives — edge/client-safe, no I/O.

| Entry             | Contents                                                                                                                           |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `@/core/identity` | `UserRole` / `UserStatus` (re-exported generated unions — SaleNet's `sm-*` strings) + `roleFromValue`/`statusFromValue` validators |

Consumed by `session`, `authz`, and the `users` feature facade — which is why it
lives in `core` (more than one consumer) rather than inside a feature.

### `session/`

Identity & session infrastructure (was previously misfiled inside `features/auth`).

| Entry                     | Runtime         | Contents                                                                                                                                               |
| ------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `@/core/session`          | client-safe     | types only (`SessionData`, `SessionUser`)                                                                                                              |
| `@/core/session/server`   | **server-only** | cookie store (`getSession`/`setSession`/`clearSession`/`getAccessToken`/`authorizedRequest`) + identity (`fetchProfile`, `refreshTokens`, `AuthError`) |
| `@/core/session/session`  | edge-safe       | JWE seal/open, cookie constants, refresh threshold — imported directly by `src/proxy.ts`                                                               |
| `@/core/session/identity` | edge-safe       | raw `fetch` transport + token refresh + `GET /me` — shared by auth flows and the middleware                                                            |

The split mirrors the runtime boundary: `proxy.ts` runs at the edge and pulls the
edge-safe modules directly; Server Components / actions use the `server` barrel.

### `guard/`

Access-control policy + helpers (consumes `session/`).

| Entry                  | Runtime         | Contents                                                                                            |
| ---------------------- | --------------- | --------------------------------------------------------------------------------------------------- |
| `@/core/guard`         | edge-safe       | pure `evaluateGuard(path, hasSession)` + `PROTECTED/AUTH` route policy — used by `src/proxy.ts`     |
| `@/core/guard/require` | **server-only** | `requireSession()` / `requireGuest()` for Server Components & actions (defense-in-depth + redirect) |

`evaluateGuard` is pure and unit-tested (`policy.test.ts`); `proxy.ts` is now thin
plumbing that resolves the decision into a localized redirect URL.

### `authz/`

Authorization — role hierarchy + permissions (consumes `identity` + `guard`).
Authentication answers "who are you"; this answers "what may you do".

| Entry                  | Runtime         | Contents                                                                                      |
| ---------------------- | --------------- | --------------------------------------------------------------------------------------------- |
| `@/core/authz`         | edge-safe       | pure `can(role, perm)` / `isStaff(role)` + `Permission` (unit-tested) — usable in UI          |
| `@/core/authz/require` | **server-only** | `requireStaff()` / `requirePermission(p)` — build on `requireSession`, `notFound()` if denied |

Usage: gate an admin page with `await requirePermission('admin.access')`; hide a
button with `can(role, 'users.manage')`. Roles come from `session.user.role`
via `roleFromValue`.

## When to add to core

A thing belongs here when it is **domain logic** (not generic enough for `lib/`),
has **no UI** (that's `components/`), and is needed by **≥2 features or the
middleware**. If only one feature needs it, keep it in that feature until a second
consumer appears (rule of three).
