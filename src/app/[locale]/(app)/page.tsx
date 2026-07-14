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
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';

/**
 * Company landing. Deliberately CANNOT funnel to `/signup`: signup is
 * invite-only (the referral code arrives via app-shared links), so the
 * page's conversion target is the APP — download first, learn more second.
 *
 * TODO(product): placeholder copy in Home.json — replace with the real
 * marketing content (and imagery) before launch.
 */

const VALUES = [
  { key: 'income', Icon: IconTrendingUp },
  { key: 'team', Icon: IconUsersGroup },
  { key: 'tools', Icon: IconChartBar },
] as const;

const STEPS = [
  { key: 'invite', Icon: IconMailFast },
  { key: 'signup', Icon: IconUserPlus },
  { key: 'work', Icon: IconDeviceMobile },
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
      {/* Hero */}
      <section className="mx-auto flex w-full max-w-3xl flex-col items-center gap-6 px-6 py-20 text-center sm:py-28">
        <h1 className="max-w-2xl text-4xl leading-tight font-semibold tracking-tight text-balance text-foreground sm:text-5xl">
          {t('hero.title')}
        </h1>
        <p className="max-w-xl text-lg leading-8 text-muted-foreground">
          {t('hero.subtitle')}
        </p>
        <div className="flex flex-col items-center gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link href="/download">{t('hero.downloadCta')}</Link>
          </Button>
          <Button asChild size="lg" variant="secondary">
            <Link href="/about-us">{t('hero.aboutCta')}</Link>
          </Button>
        </div>
      </section>

      {/* Value props */}
      <section className="bg-muted/40 py-16">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6">
          <h2 className="text-center text-2xl font-semibold tracking-tight text-foreground">
            {t('values.heading')}
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {VALUES.map(({ key, Icon }) => (
              <Card key={key} className="shadow-none">
                <CardContent className="flex flex-col gap-3">
                  <Icon aria-hidden size={28} className="text-primary" />
                  <h3 className="font-semibold text-foreground">
                    {t(`values.${key}.title`)}
                  </h3>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {t(`values.${key}.body`)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-16">
        <h2 className="text-center text-2xl font-semibold tracking-tight text-foreground">
          {t('steps.heading')}
        </h2>
        <ol className="grid gap-6 sm:grid-cols-3">
          {STEPS.map(({ key, Icon }, index) => (
            <li key={key} className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                  {index + 1}
                </span>
                <Icon aria-hidden size={22} className="text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-foreground">
                {t(`steps.${key}.title`)}
              </h3>
              <p className="text-sm leading-6 text-muted-foreground">
                {t(`steps.${key}.body`)}
              </p>
            </li>
          ))}
        </ol>
      </section>

      {/* Final CTA */}
      <section className="bg-muted/40 py-16">
        <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-4 px-6 text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            {t('finalCta.title')}
          </h2>
          <p className="text-muted-foreground">{t('finalCta.body')}</p>
          <Button asChild size="lg" className="mt-2">
            <Link href="/download">{t('finalCta.download')}</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
