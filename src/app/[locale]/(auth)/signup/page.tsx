import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { AuthCard, GoogleSigninButton, SignupForm } from '@/features/auth';
import { routing } from '@/i18n/routing';

export default async function SignupPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations('Auth');

  return (
    <AuthCard title={t('signup.title')} description={t('signup.subtitle')}>
      <SignupForm />
      <GoogleSigninButton />
    </AuthCard>
  );
}
