import type { MetadataRoute } from 'next';
import { env } from '@/config/env';
import { routing } from '@/i18n/routing';

const FALLBACK = 'http://localhost:3000';

const STATIC_PATHS = ['/'] as const;

function origin() {
  return env.NEXT_PUBLIC_APP_URL ?? FALLBACK;
}

function localized(path: string, locale: string) {
  const prefix =
    locale === routing.defaultLocale && routing.localePrefix === 'as-needed'
      ? ''
      : `/${locale}`;
  return `${origin()}${prefix}${path === '/' ? '' : path}` || `${origin()}/`;
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
