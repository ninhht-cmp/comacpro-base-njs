# Security Policy

## Reporting a vulnerability

**Do not open a public issue for security vulnerabilities.**

Report privately via one of:

- GitHub **Security Advisories** → "Report a vulnerability" (preferred), or
- email **security@comacpro.com**

Please include: affected area/version, reproduction steps or PoC, and impact.
We aim to acknowledge within **2 business days** and to provide a remediation
timeline after triage. Coordinated disclosure is appreciated — give us a
reasonable window to ship a fix before any public write-up.

## Supported versions

`main` (production) receives security fixes. Older release branches are
supported only while a deployment depends on them.

## What this project already does

- **Dependencies:** Renovate updates with a **7-day** `minimumReleaseAge`
  cooldown (`renovate.json`, enforced at install time via
  `minimumReleaseAge: 10080` minutes in `pnpm-workspace.yaml`) to avoid pulling
  compromised fresh releases; CI runs `pnpm audit --prod --audit-level high`.
- **SAST:** CodeQL (`security-extended`) on PRs, main, and weekly.
- **Secrets:** gitleaks scans every PR; never commit credentials — use env vars
  validated by `src/config/env.ts` (t3-env).
- **Transport/headers:** HSTS + hardened response headers; CSP in Report-Only,
  migrating to nonce-based enforcement (see `docs/adr/0001-architecture-and-platform.md`).
- **Sessions:** encrypted (JWE) httpOnly cookies; tokens never exposed to client JS.

## Handling secrets locally

Copy `.env.example` → `.env`, fill real values. `.env*` is git-ignored. If a
secret is ever committed, rotate it immediately and notify the security team —
removing it from history is not sufficient.
