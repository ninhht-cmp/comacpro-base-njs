import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';

/**
 * Public "about us" page. Section ids are deep-link targets — the signup
 * page's about cards link here as `/about-us#<id>`; keep them in sync with
 * `SignupAboutSection`'s `hash` values.
 *
 * TODO(product): placeholder copy — replace with the real content.
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
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-10 px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight text-foreground">
        {t('title')}
      </h1>
      {SECTIONS.map((section) => (
        // scroll-mt clears the sticky app header when landing on a #hash.
        <section
          key={section}
          id={section}
          className="flex scroll-mt-24 flex-col gap-2"
        >
          <h2 className="text-xl font-semibold text-foreground">
            {t(`${section}.title`)}
          </h2>
          <p className="leading-7 text-muted-foreground">
            {t(`${section}.body`)}
          </p>
        </section>
      ))}
    </main>
  );
}
