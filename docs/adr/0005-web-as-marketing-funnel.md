# ADR 0005 — The web surface is the marketing + signup funnel

- **Status:** Accepted
- **Date:** 2026-07-14
- **Relates to:** ADR 0003 (SaleNet backend), ADR 0004 (signup anti-abuse)

## Context

The product lives in the SaleNet mobile app. The web's actual jobs are:
company landing, the invite-only signup funnel (referral links open here),
an app-download page, and the legal pages the app stores require. Password
recovery already ships in the app, and web users of `/forgot-password` were
a leftover from before that.

## Decision

- **Pages**: `/` (company landing), `/about-us`, `/download`, `/terms`,
  `/privacy` are the public surface; `/signup` stays invite-only (never
  linked from marketing CTAs — the conversion target is the app download).
  `/signin`, `/account`, `/notifications` remain for members (referrers
  manage their invite links there).
- **Password recovery removed from web**: pages, forms, actions, service
  calls, schemas and messages deleted; the signin form shows a static
  "reset in the app" hint instead of a link. Restore from git history if a
  web flow is ever needed again.
- **Store badges extracted** to `components/store-badges.tsx` (shared by the
  signup success state and `/download`), platform-ordered via
  `detectPlatform`.
- **Legal pages** render placeholder copy marked `TODO(legal)` — plausible
  structure, NOT lawyer-reviewed. Store listing review requires the privacy
  URL, so these must be finalized before app submission. The footer states
  the registered entity (Công ty Cổ phần SaleNet, MST 0111539358); a support
  hotline/email is still pending.

## Consequences

- The sitemap lists only the public pages; `/signup` is excluded on purpose
  (without a referral it renders a blocked state).
- **Resolved 2026-07-14**: the repo is re-scoped as the standalone SaleNet
  web product (owner decision) — package renamed `salenet-web`, all
  Comacpro/CMP branding removed from the user-facing surface, cookie prefix
  `cmp_` → `sn_` (safe pre-launch; no production cookies existed).
- Real marketing copy, imagery, store URLs (`src/config/app-links.ts`) and
  legal text are product-owner inputs — every placeholder is marked with a
  `TODO(product)` / `TODO(legal)` comment.
