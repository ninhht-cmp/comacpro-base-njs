import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { AuthCard, SigninForm } from '@/features/auth';
import { routing } from '@/i18n/routing';

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
