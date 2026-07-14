import type { MetadataRoute } from 'next';
import { getPathname } from '@/i18n/navigation';
import { routing, type Locale } from '@/i18n/routing';
import { siteOrigin } from '@/lib/seo';

/** Public, parameterless routes to list — keys of `routing.pathnames`.
 * `/signup` stays out on purpose: without a referral it's a dead-end
 * (and its page metadata is noindex — invite URLs carry phone numbers). */
const STATIC_PATHS = [
  '/',
  '/about-us',
  '/download',
  '/terms',
  '/privacy',
] as const;

// Honest hints for a mostly-static marketing site (crawlers may ignore them,
// but claiming "daily" for legal pages is just noise).
const CHANGE_FREQUENCY: Record<
  (typeof STATIC_PATHS)[number],
  'weekly' | 'monthly' | 'yearly'
> = {
  '/': 'weekly',
  '/about-us': 'monthly',
  '/download': 'monthly',
  '/terms': 'yearly',
  '/privacy': 'yearly',
};

// `getPathname` applies both the per-locale pathname translations and the
// locale-prefix rules from the routing config, so translated paths added to
// `routing.pathnames` emit correct URLs without touching this file.
function localized(href: (typeof STATIC_PATHS)[number], locale: Locale) {
  return `${siteOrigin()}${getPathname({ href, locale })}`;
}

export default function sitemap(): MetadataRoute.Sitemap {
  return STATIC_PATHS.map((path) => ({
    url: localized(path, routing.defaultLocale),
    lastModified: new Date(),
    changeFrequency: CHANGE_FREQUENCY[path],
    priority: path === '/' ? 1 : 0.7,
    alternates: {
      languages: Object.fromEntries(
        routing.locales.map((l) => [l, localized(path, l)]),
      ),
    },
  }));
}
