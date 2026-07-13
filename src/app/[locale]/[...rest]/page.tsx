import { hasLocale } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';

/**
 * Catch-all that funnels every unknown URL into `notFound()`, so it renders the
 * localized `[locale]/not-found.tsx` inside the layouts instead of Next's bare
 * root 404 (standard next-intl pattern).
 */
export default async function CatchAllPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  notFound();
}
