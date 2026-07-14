import type { Metadata } from 'next';
import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { JsonLd } from '@/components/json-ld';
import { APP_STORE_URL, GOOGLE_PLAY_URL } from '@/config/app-links';
import { routing } from '@/i18n/routing';
import { OG_IMAGE, SITE_NAME, siteOrigin } from '@/lib/seo';
import { Providers } from '@/providers';

/**
 * Site-wide SEO defaults; pages override via `pageMetadata` (@/lib/seo).
 * `metadataBase` makes every relative canonical/OG url absolute, and the
 * title template brands page titles — pages whose title already carries the
 * brand opt out with `absoluteTitle`.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const t = await getTranslations({ locale, namespace: 'Home.metadata' });
  return {
    metadataBase: new URL(siteOrigin()),
    title: { default: t('title'), template: `%s — ${SITE_NAME}` },
    description: t('description'),
    openGraph: {
      type: 'website',
      siteName: SITE_NAME,
      locale: 'vi_VN',
      title: t('title'),
      description: t('description'),
      images: [OG_IMAGE],
    },
    // Card type only — X (and everyone else) falls back to og:image.
    twitter: { card: 'summary_large_image' },
  };
}

// Entity data for Google's knowledge graph. Legal identity mirrors the
// footer copy (Common.footer) — update both together.
const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: SITE_NAME,
  legalName: 'Công ty Cổ phần SaleNet (SALENET JSC)',
  taxID: '0111539358',
  url: siteOrigin(),
  logo: `${siteOrigin()}/brand/logo.svg`,
  sameAs: [APP_STORE_URL, GOOGLE_PLAY_URL],
};

const webSiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: SITE_NAME,
  url: siteOrigin(),
  inLanguage: 'vi',
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

/**
 * Locale-level layout: owns the locale boundary + app-wide providers only. The
 * page chrome differs per section, so it lives in the route-group layouts —
 * `(app)/layout.tsx` (full sticky header) and `(auth)/layout.tsx` (minimal,
 * logo-only). These are nested layouts under one root, so navigating between
 * groups stays a client transition (no full reload).
 */
export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return (
    <Providers locale={locale}>
      <JsonLd data={organizationJsonLd} />
      <JsonLd data={webSiteJsonLd} />
      {children}
    </Providers>
  );
}
