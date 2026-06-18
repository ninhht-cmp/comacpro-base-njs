import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { AuthCard, ForgotPasswordForm } from '@/features/auth';
import { routing } from '@/i18n/routing';

export default async function ForgotPasswordPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations('Auth');

  return (
    <AuthCard title={t('forgot.title')} description={t('forgot.subtitle')}>
      <ForgotPasswordForm />
    </AuthCard>
  );
}
