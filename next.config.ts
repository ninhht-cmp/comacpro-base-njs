import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
import './src/config/env';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/**
 * Security response headers applied to every route.
 *
 * The baseline headers (HSTS, nosniff, frame/referrer/permissions policy) are
 * ENFORCED — they don't risk breaking the app. The Content-Security-Policy ships
 * in **Report-Only** mode on purpose: the app still relies on an inline theme
 * script, so enforcing a strict policy blind would break it. Report-Only
 * collects violations without blocking.
 *
 * Promotion path to an enforced, nonce-based CSP (the code is already prepped —
 * `ThemeScript`/`next/script` accept a `nonce`): generate a per-request nonce in
 * `proxy.ts`, thread it through the root layout to those scripts, swap
 * `'unsafe-inline'` for `'nonce-<value>'`, and rename the header to
 * `Content-Security-Policy`. See docs/adr/0001-architecture-and-platform.md.
 */
const apiOrigin = (() => {
  const base =
    process.env.NEXT_PUBLIC_API_BASE_URL ?? process.env.API_BASE_URL ?? '';
  try {
    return base ? new URL(base).origin : '';
  } catch {
    return '';
  }
})();

const csp = [
  `default-src 'self'`,
  `base-uri 'self'`,
  `object-src 'none'`,
  `frame-ancestors 'none'`,
  `form-action 'self'`,
  `img-src 'self' data: https:`,
  `font-src 'self'`,
  `style-src 'self' 'unsafe-inline'`,
  `script-src 'self' 'unsafe-inline'`,
  `connect-src 'self' ${apiOrigin}`.trim(),
]
  .join('; ')
  .replace(/\s+/g, ' ');

const securityHeaders = [
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  // Nothing opens cross-origin popups anymore (Google Sign-In is gone), so
  // full isolation is safe. Relax to `same-origin-allow-popups` if a popup
  // flow (OAuth, payment) ever returns.
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
  },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  // Report-Only: observe before enforcing (see the note above).
  { key: 'Content-Security-Policy-Report-Only', value: csp },
];

const nextConfig: NextConfig = {
  // Self-contained server output for containerized deploys (see Dockerfile).
  output: 'standalone',
  images: {
    remotePatterns: [],
    qualities: [75],
    minimumCacheTTL: 14400,
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
  async redirects() {
    return [
      // The mobile app's invite links point at the bare `/signup`
      // (`/signup?referral=<phone>`). The default locale (vi) is unprefixed
      // and localizes this path to `/dang-ky`, so the bare path would 404 —
      // bounce it to the vi path instead (the query string is preserved
      // automatically). `/en/signup` is untouched (source has no prefix).
      { source: '/signup', destination: '/dang-ky', permanent: false },
    ];
  },
};

export default withNextIntl(nextConfig);
