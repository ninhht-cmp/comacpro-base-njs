<!-- Keep it short. The CI gate (typecheck · lint · format · i18n · test+coverage
     · build · e2e · CodeQL · security) enforces the mechanics — use this space
     for the *why* and the *risk*. -->

## What & why

<!-- One or two sentences. Link the Jira issue: CMP-XXXX -->

## How

<!-- Notable implementation choices, trade-offs, anything a reviewer should
     focus on. -->

## Testing

- [ ] Unit/integration tests cover the change (or N/A — explain)
- [ ] Tested manually (steps below)
- [ ] e2e updated if a user-facing flow changed

## Risk & rollout

- [ ] No breaking change to a feature's public barrel / API contract
- [ ] No new secret committed; env additions documented in `.env.example`
- [ ] DB/backend coordination needed? <!-- describe or "no" -->
- **Rollback:** <!-- revert PR / flag flip / see docs/runbooks/rollback.md -->

## Screenshots / notes

<!-- Optional. UI before/after, design links, follow-ups. -->
