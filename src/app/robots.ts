import type { MetadataRoute } from 'next';
import { env } from '@/config/env';

const FALLBACK = 'http://localhost:3000';

export default function robots(): MetadataRoute.Robots {
  const origin = env.NEXT_PUBLIC_APP_URL ?? FALLBACK;
  const isProd = env.NODE_ENV === 'production';

  return {
    rules: isProd
      ? [
          {
            userAgent: '*',
            allow: '/',
            disallow: ['/api/', '/account/', '/checkout/', '/cart/'],
          },
        ]
      : [{ userAgent: '*', disallow: '/' }],
    sitemap: `${origin}/sitemap.xml`,
    host: origin,
  };
}
