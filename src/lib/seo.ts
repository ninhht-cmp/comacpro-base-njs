import type { Metadata } from 'next';
import { env } from '@/config/env';

/**
 * Shared SEO primitives. The [locale] layout owns the site-wide defaults
 * (metadataBase, title template, fallback Open Graph); pages describe
 * themselves through {@link pageMetadata} so every indexable page carries a
 * canonical URL and a complete OG block — Next.js replaces (not deep-merges)
 * top-level metadata fields, so a partial page-level `openGraph` would
 * silently drop the layout's siteName/locale.
 *
 * Open Graph is the priority surface for THIS product: distribution happens
 * through invite links shared on Zalo/Facebook, so the link preview is the
 * first (often only) impression. See docs/adr/0005 for the funnel.
 */

export const SITE_NAME = 'SaleNet';

/**
 * Link-preview image, served by `app/api/og/route.tsx` and referenced
 * explicitly on every page (resolved to an absolute URL via `metadataBase`).
 */
export const OG_IMAGE = {
  url: '/api/og',
  width: 1200,
  height: 630,
  alt: SITE_NAME,
} as const;

/** Canonical site origin — sitemap, robots and metadataBase must agree. */
export function siteOrigin(): string {
  return env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
}

export function pageMetadata({
  title,
  description,
  path,
  absoluteTitle = false,
}: {
  title: string;
  description: string;
  /** Logical route path (`/download`) — resolved against `metadataBase`. */
  path: string;
  /** Skip the `%s — SaleNet` template for titles that already carry the brand. */
  absoluteTitle?: boolean;
}): Metadata {
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: 'website',
      siteName: SITE_NAME,
      locale: 'vi_VN',
      url: path,
      title,
      description,
      images: [OG_IMAGE],
    },
  };
}
