import type { Metadata } from 'next';
import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import {
  IconReceipt2,
  IconTrendingUp,
  IconUsersGroup,
} from '@tabler/icons-react';
import { FeatureCard } from '@/components/marketing/feature-card';
import { JsonLd } from '@/components/json-ld';
import { StoreBadges } from '@/components/store-badges';
import {
  APP_STORE_ID,
  APP_STORE_URL,
  GOOGLE_PLAY_URL,
} from '@/config/app-links';
import { Link } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import { detectPlatform } from '@/lib/platform';
import { pageMetadata, SITE_NAME } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Download.metadata');
  return {
    ...pageMetadata({
      title: t('title'),
      description: t('description'),
      path: '/download',
    }),
    // Safari Smart App Banner — inert until the real App Store id is configured.
    ...(APP_STORE_ID ? { itunes: { appId: APP_STORE_ID } } : {}),
  };
}

// App entity for Google. Deliberately NO aggregateRating/review: Google
// requires real rating data and fabricating it risks a manual action — add
// the field once the store listings have genuine ratings to cite.
const mobileAppJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'MobileApplication',
  name: SITE_NAME,
  operatingSystem: 'ANDROID, IOS',
  applicationCategory: 'BusinessApplication',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'VND' },
  installUrl: [GOOGLE_PLAY_URL, APP_STORE_URL],
};

const FEATURES = [
  { key: 'orders', icon: IconReceipt2 },
  { key: 'team', icon: IconUsersGroup },
  { key: 'income', icon: IconTrendingUp },
] as const;

/**
 * App download landing — the conversion target for every public page (the
 * home hero, invite-less signup visits). The product lives in the mobile
 * app; signup itself stays invite-only, hence the closing note that points
 * account-less visitors at their referrer instead of a signup CTA.
 */
export default async function DownloadPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations('Download');
  const platform = detectPlatform((await headers()).get('user-agent'));

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center gap-14 px-6 py-20">
      <JsonLd data={mobileAppJsonLd} />
      <div className="flex flex-col items-center gap-5 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/assets/2/launch.svg"
          alt=""
          width={80}
          height={80}
          className="size-20"
        />
        <span className="text-eyebrow">{t('eyebrow')}</span>
        <h1 className="font-heading text-4xl font-medium tracking-tight text-balance text-foreground">
          {t('title')}
        </h1>
        <p className="max-w-md text-lg text-pretty text-muted-foreground">
          {t('subtitle')}
        </p>
        <div className="pt-2">
          <StoreBadges platform={platform} />
        </div>
      </div>

      <div className="grid w-full gap-5 sm:grid-cols-3">
        {FEATURES.map(({ key, icon }) => (
          <FeatureCard
            key={key}
            icon={icon}
            title={t(`features.${key}.title`)}
            body={t(`features.${key}.body`)}
          />
        ))}
      </div>

      <div className="flex w-full flex-col items-center gap-2 border-t border-border pt-8 text-center">
        <p className="max-w-md text-sm leading-6 text-muted-foreground">
          {t('invite.note')}
        </p>
        <Link
          href="/about-us"
          className="text-sm font-medium text-foreground underline underline-offset-4"
        >
          {t('invite.about')}
        </Link>
      </div>
    </main>
  );
}
