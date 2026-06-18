# Runbook — Rollback

Vendor-agnostic procedure for reverting a bad release. Fill in the **TODO**
hosting-specific commands once the deploy target is decided (see ADR 0001,
Decision 3 — deploy pipeline is still pending sign-off).

## When to roll back

Roll back (don't roll forward) when any of these follow a deploy:

- Error rate / 5xx spikes on the Datadog service dashboard.
- A core flow is broken (sign-in, checkout) and there's no quick safe fix.
- A PagerDuty SEV-1/2 is opened pointing at the release.

If the issue is gated by a **feature flag**, prefer flipping the flag off — it's
faster and lower-risk than a redeploy.

## Decision (≤5 min)

1. Confirm the deploy is the cause: compare the alert start time to the deploy
   timestamp; check the release diff.
2. Flag-controlled? → **disable the flag**, verify recovery, stop here.
3. Otherwise → **roll back to the previous known-good build**.

## Rollback steps

```bash
# 1. Identify the last known-good release/SHA
#    TODO(deploy): <command to list recent deploys>

# 2. Promote/redeploy that build
#    TODO(deploy): <command to redeploy a previous build>

# 3. Verify
#    - Datadog: error rate back to baseline, latency normal
#    - Synthetic/e2e smoke on the critical path
```

## Backend / data coordination

- Frontend rollback is safe **only if** the backend contract is unchanged. If
  this release shipped alongside a backend/API change, coordinate with the
  owning service team before reverting (a forward-only DB migration may make the
  old frontend incompatible).
- The generated API client is versioned to the spec — a mismatched client is a
  red flag.

## After recovery

- Update the incident channel + PagerDuty; downgrade severity.
- Open a follow-up issue and schedule a **blameless postmortem** (see the
  incident-response process).
