import type { MetadataRoute } from 'next';
import { env } from '@/config/env';
import { getPathname } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import { siteOrigin } from '@/lib/seo';

/** Internal routes crawlers must not index, in every localized form. */
const PRIVATE_PATHNAMES = ['/account', '/notifications'] as const;

function disallowList(): string[] {
  // Set: localized forms can collide for untranslated routes. `getPathname`
  // owns the pathname translation AND the prefix rules (same as sitemap.ts),
  // so this survives locale/pathname config changes untouched.
  const paths = new Set<string>(['/api/']);
  for (const pathname of PRIVATE_PATHNAMES) {
    for (const locale of routing.locales) {
      const path = getPathname({ href: pathname, locale });
      paths.add(path);
      paths.add(`${path}/`);
    }
  }
  return [...paths];
}

export default function robots(): MetadataRoute.Robots {
  const origin = siteOrigin();
  const isProd = env.NODE_ENV === 'production';

  return {
    rules: isProd
      ? [
          {
            userAgent: '*',
            allow: '/',
            disallow: disallowList(),
          },
        ]
      : [{ userAgent: '*', disallow: '/' }],
    sitemap: `${origin}/sitemap.xml`,
    host: origin,
  };
}
