import type { Metadata } from 'next';
import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { LegalArticle } from '@/components/legal-article';
import { routing } from '@/i18n/routing';
import { pageMetadata } from '@/lib/seo';

const SECTIONS = [
  'collect',
  'use',
  'share',
  'retention',
  'rights',
  'contact',
] as const;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Legal.privacy.metadata');
  return pageMetadata({
    title: t('title'),
    description: t('description'),
    path: '/privacy',
  });
}

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return <LegalArticle document="privacy" sections={SECTIONS} />;
}
