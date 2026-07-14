import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import {
  IconChartBar,
  IconDeviceMobile,
  IconMailFast,
  IconTrendingUp,
  IconUserPlus,
  IconUsersGroup,
} from '@tabler/icons-react';
import { CtaLink } from '@/components/marketing/cta-link';
import { FeatureCard } from '@/components/marketing/feature-card';
import { SectionHeading } from '@/components/marketing/section-heading';
import { routing } from '@/i18n/routing';

/**
 * Company landing, in the clean Claude-docs content style: a centered content
 * column, flat cards, hairline dividers — no gradients, no motion. Deliberately
 * CANNOT funnel to `/signup` (invite-only); the conversion target is the app.
 *
 * TODO(product): copy in Home.json is placeholder — replace before launch.
 */
const VALUES = [
  { key: 'income', icon: IconTrendingUp },
  { key: 'team', icon: IconUsersGroup },
  { key: 'tools', icon: IconChartBar },
] as const;

const STEPS = [
  { key: 'invite', icon: IconMailFast },
  { key: 'signup', icon: IconUserPlus },
  { key: 'work', icon: IconDeviceMobile },
] as const;

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations('Home');

  return (
    <main className="flex flex-1 flex-col">
      {/* ── Hero ───────────────────────────────────────────────── */}
      <section className="border-b border-border">
        <div className="mx-auto flex w-full max-w-[100rem] flex-col items-center gap-6 px-6 py-20 text-center sm:py-28 lg:px-8">
          <span className="text-eyebrow">{t('hero.eyebrow')}</span>
          <h1 className="max-w-3xl font-heading text-4xl leading-[1.1] font-medium tracking-tight text-balance text-foreground sm:text-5xl">
            {t('hero.title')}
          </h1>
          <p className="max-w-xl text-lg leading-8 text-pretty text-muted-foreground">
            {t('hero.subtitle')}
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <CtaLink href="/download" arrow>
              {t('hero.downloadCta')}
            </CtaLink>
            <CtaLink href="/about-us" variant="secondary">
              {t('hero.aboutCta')}
            </CtaLink>
          </div>
        </div>
      </section>

      {/* ── Value props ────────────────────────────────────────── */}
      <section className="py-20 sm:py-24">
        <div className="mx-auto flex w-full max-w-[100rem] flex-col gap-12 px-6 lg:px-8">
          <SectionHeading
            eyebrow={t('values.eyebrow')}
            title={t('values.heading')}
          />
          <div className="grid gap-5 sm:grid-cols-3">
            {VALUES.map(({ key, icon }) => (
              <FeatureCard
                key={key}
                icon={icon}
                title={t(`values.${key}.title`)}
                body={t(`values.${key}.body`)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ───────────────────────────────────────── */}
      <section className="border-t border-border bg-muted/30 py-20 sm:py-24">
        <div className="mx-auto flex w-full max-w-[100rem] flex-col gap-12 px-6 lg:px-8">
          <SectionHeading
            eyebrow={t('steps.eyebrow')}
            title={t('steps.heading')}
          />
          <ol className="grid gap-8 sm:grid-cols-3">
            {STEPS.map(({ key, icon: Icon }, index) => (
              <li key={key} className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground tabular-nums">
                    {index + 1}
                  </span>
                  <Icon
                    aria-hidden
                    size={22}
                    className="text-muted-foreground"
                  />
                </div>
                <h3 className="text-base font-semibold text-foreground">
                  {t(`steps.${key}.title`)}
                </h3>
                <p className="text-sm leading-6 text-muted-foreground">
                  {t(`steps.${key}.body`)}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Closing CTA ────────────────────────────────────────── */}
      <section className="border-t border-border py-20 sm:py-24">
        <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-4 px-6 text-center">
          <h2 className="font-heading text-3xl font-medium tracking-tight text-balance text-foreground">
            {t('finalCta.title')}
          </h2>
          <p className="text-pretty text-muted-foreground">
            {t('finalCta.body')}
          </p>
          <CtaLink href="/download" arrow className="mt-2">
            {t('finalCta.download')}
          </CtaLink>
        </div>
      </section>
    </main>
  );
}
