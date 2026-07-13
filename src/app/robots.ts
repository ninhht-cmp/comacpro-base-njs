import type { MetadataRoute } from 'next';
import { env } from '@/config/env';
import { routing } from '@/i18n/routing';

const FALLBACK = 'http://localhost:3000';

/** Internal routes crawlers must not index, in every localized form. */
const PRIVATE_PATHNAMES = ['/account', '/checkout', '/cart'] as const;

function disallowList(): string[] {
  // A Set since the en pathname can equal the vi one for untranslated routes.
  const paths = new Set<string>(['/api/']);
  for (const pathname of PRIVATE_PATHNAMES) {
    for (const locale of routing.locales) {
      // vi (default) is unprefixed under `as-needed`; other locales are prefixed.
      const prefix = locale === routing.defaultLocale ? '' : `/${locale}`;
      const path = `${prefix}${routing.pathnames[pathname][locale]}`;
      paths.add(path);
      paths.add(`${path}/`);
    }
  }
  return [...paths];
}

export default function robots(): MetadataRoute.Robots {
  const origin = env.NEXT_PUBLIC_APP_URL ?? FALLBACK;
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
