import type { Metadata } from 'next';
import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { AuthCard, SigninForm } from '@/modules/auth';
import { routing } from '@/i18n/routing';
import { pageMetadata } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Auth');
  // Reuses the card copy — members searching "salenet đăng nhập" land here.
  return pageMetadata({
    title: t('signInTitle'),
    description: t('signInSubtitle'),
    path: '/signin',
  });
}

export default async function SigninPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ redirect?: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const { redirect } = await searchParams;
  const t = await getTranslations('Auth');

  return (
    <AuthCard title={t('signInTitle')} description={t('signInSubtitle')}>
      <SigninForm redirect={redirect} />
    </AuthCard>
  );
}
