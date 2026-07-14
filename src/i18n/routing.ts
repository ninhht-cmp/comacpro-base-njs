import { defineRouting } from 'next-intl/routing';

/**
 * Single-locale on purpose: the product serves Vietnamese sales staff only,
 * so the second locale was dropped (see the git history for the bilingual
 * setup). The i18n LAYER stays — centralized, typed copy — and re-adding a
 * locale is config + translation files, not an architecture change.
 *
 * `pathnames` are identity mappings (English URLs) by choice, but the map
 * itself is load-bearing: it is the typed route registry (`PathKey`) that
 * the guard policy, sitemap and robots derive from. Register new routes here.
 */
export const routing = defineRouting({
  locales: ['vi'] as const,
  defaultLocale: 'vi',
  localePrefix: 'as-needed',

  pathnames: {
    '/': '/',
    '/signin': '/signin',
    '/signup': '/signup',
    '/forgot-password': '/forgot-password',
    '/reset-password': '/reset-password',
    '/account': '/account',
    '/notifications': '/notifications',
    '/about-us': '/about-us',
  },
});

export type Locale = (typeof routing.locales)[number];
