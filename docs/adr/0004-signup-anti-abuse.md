# ADR 0004 — Signup anti-abuse layer

- **Status:** Accepted
- **Date:** 2026-07-14
- **Relates to:** ADR 0003 (SaleNet backend)

## Context

Signup is tied to money: referral commissions flow from it, each submit
triggers a **paid ZaloOA send** to an arbitrary phone number, and the public
referral lookup's code space is guessable phone numbers. An unprotected form
is therefore simultaneously a message cannon (cost + brand damage), a
fake-account factory, and an enumeration oracle. The web tier cannot _stop_
a determined fraudster (they can call the API directly) — it can only raise
the cost of abuse and give the backend the signals its fraud rules need.

## Decision

Three measures, all confined to the signup surface:

- **Cloudflare Turnstile, opt-in by env pair** (`NEXT_PUBLIC_TURNSTILE_SITE_KEY`
  - `TURNSTILE_SECRET_KEY`; either unset disables widget and verification, so
    dev/e2e and template clones run unchanged). The Server Action verifies the
    token **before** calling the backend — a bot never costs a ZaloOA send.
    Failure policy: bad/missing token is rejected; a Cloudflare outage fails
    **open** (blocking every real signup costs more than one bot burst) with a
    loud server log. `lib/security/turnstile.ts`, `components/form/turnstile.tsx`.

- **End-user context forwarded to the backend** on signup and the referral
  lookup (`lib/api/client-context.ts`). Every request reaches SaleNet from
  this app's server IP, so without this the backend would throttle the whole
  web app as one client and investigations would have no IP to pivot on.
  Header names mirror the production referral app (`cmp-sm-fe`), which the
  backend already consumes — `X-Client-IP` is authoritative (the backend's
  ingress overwrites the standard names), plus `X-Forwarded-For`,
  `X-Real-IP`, `User-Agent`, and `X-Client-Session` (the visitor id, tying
  signups to invite-link opens). The backend must trust these only from this
  app; Vietnamese carrier CGNAT makes the IP a signal, never an identity.

- **Full-name anti-junk validation** ported from `cmp-sm-fe`
  (`lib/validation/full-name.ts`): links, digits, profanity, scam phrases, spelled-out
  phone numbers, gibberish — while keeping ethnic-minority names ("H'Hen
  Niê") valid. Reason codes map to translated field errors; the four
  "not a real name" heuristics share one message so rejections don't teach
  spammers which check caught them. Signup attempts/successes are logged
  with **masked** PII (`phone=0912xxx678 ref=<len:6> ip=…`) — enough for a
  fraud timeline without raw phone numbers in log storage.

## Consequences

- Turnstile stays inert until the env keys are set; production activation is
  a deploy-config change, not a code change.
- The real chokepoints remain backend/product work (tracked outside this
  repo): unguessable referral codes + masked lookup responses (the current
  phone-number codes make the public lookup a member-directory oracle),
  per-phone send cooldowns, activity-gated commissions with KYC before
  payout, and rule-based fraud alerting on the referral graph.
