import type { MetadataRoute } from 'next';
import { env } from '@/config/env';
import { getPathname } from '@/i18n/navigation';
import { routing, type Locale } from '@/i18n/routing';

const FALLBACK = 'http://localhost:3000';

/** Public, parameterless routes to list — keys of `routing.pathnames`.
 * `/signup` stays out on purpose: without a referral it's a dead-end. */
const STATIC_PATHS = [
  '/',
  '/about-us',
  '/download',
  '/terms',
  '/privacy',
] as const;

function origin() {
  return env.NEXT_PUBLIC_APP_URL ?? FALLBACK;
}

// `getPathname` applies both the per-locale pathname translations and the
// locale-prefix rules from the routing config, so translated paths added to
// `routing.pathnames` emit correct URLs without touching this file.
function localized(href: (typeof STATIC_PATHS)[number], locale: Locale) {
  return `${origin()}${getPathname({ href, locale })}`;
}

export default function sitemap(): MetadataRoute.Sitemap {
  return STATIC_PATHS.map((path) => ({
    url: localized(path, routing.defaultLocale),
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: path === '/' ? 1 : 0.7,
    alternates: {
      languages: Object.fromEntries(
        routing.locales.map((l) => [l, localized(path, l)]),
      ),
    },
  }));
}
