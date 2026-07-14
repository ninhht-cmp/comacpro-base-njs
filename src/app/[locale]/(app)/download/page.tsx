import type { Metadata } from 'next';
import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { IconCircleCheck } from '@tabler/icons-react';
import { StoreBadges } from '@/components/store-badges';
import { APP_STORE_ID } from '@/config/app-links';
import { Link } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import { detectPlatform } from '@/lib/platform';

/** Safari Smart App Banner — inert until the real App Store id is configured. */
export const metadata: Metadata = APP_STORE_ID
  ? { itunes: { appId: APP_STORE_ID } }
  : {};

const FEATURES = ['orders', 'team', 'income'] as const;

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
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center gap-10 px-6 py-20 text-center">
      <div className="flex flex-col items-center gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/assets/2/launch.svg"
          alt=""
          width={96}
          height={96}
          className="size-24"
        />
        <h1 className="text-3xl font-semibold tracking-tight text-balance text-foreground">
          {t('title')}
        </h1>
        <p className="max-w-md text-muted-foreground">{t('subtitle')}</p>
      </div>

      <StoreBadges platform={platform} />

      <ul className="flex flex-col items-start gap-3 text-left">
        {FEATURES.map((feature) => (
          <li key={feature} className="flex items-start gap-2.5">
            <IconCircleCheck
              aria-hidden
              size={20}
              className="mt-0.5 shrink-0 text-primary"
            />
            <span className="text-sm leading-6 text-foreground">
              {t(`features.${feature}`)}
            </span>
          </li>
        ))}
      </ul>

      <div className="flex flex-col items-center gap-2 border-t border-border pt-8">
        <p className="max-w-md text-sm leading-6 text-muted-foreground">
          {t('invite.note')}
        </p>
        <Link
          href="/about-us"
          className="text-sm font-medium text-foreground underline"
        >
          {t('invite.about')}
        </Link>
      </div>
    </main>
  );
}
