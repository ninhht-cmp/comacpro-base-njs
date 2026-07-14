import { hasLocale } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { SiteShell } from '../shell';
import { routing } from '@/i18n/routing';

/**
 * Public marketing surface (home, about, download, legal): the shared shell.
 * Kept as its own group so this chrome stays top-nav-only when the signed-in
 * `(app)` surface grows product chrome of its own.
 */
export default async function MarketingLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return <SiteShell locale={locale}>{children}</SiteShell>;
}
