import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { SectionHeading } from '@/components/marketing/section-heading';
import { Card, CardContent } from '@/components/ui/card';
import { routing } from '@/i18n/routing';

/**
 * Public "about us" page. Section ids are deep-link targets — the signup
 * page's about cards link here as `/about-us#<id>`; keep them in sync with
 * `SignupAboutSection`'s `hash` values.
 *
 * TODO(product): placeholder body copy — replace with the real content.
 */
const SECTIONS = ['mission', 'join', 'growth'] as const;

export default async function AboutUsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations('About');

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-14 px-6 py-20">
      <SectionHeading
        eyebrow={t('eyebrow')}
        title={t('title')}
        lede={t('lede')}
      />

      <div className="flex flex-col gap-5">
        {SECTIONS.map((section) => (
          // scroll-mt clears the sticky header when landing on a #hash.
          <Card key={section} id={section} className="scroll-mt-28 shadow-none">
            <CardContent className="flex flex-col gap-2">
              <h2 className="text-xl font-semibold text-foreground">
                {t(`${section}.title`)}
              </h2>
              <p className="leading-7 text-muted-foreground">
                {t(`${section}.body`)}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}
