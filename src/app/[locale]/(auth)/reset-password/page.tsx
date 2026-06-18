import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { AuthCard, ResetPasswordForm } from '@/features/auth';
import { redirect } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';

export default async function ResetPasswordPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const { token } = await searchParams;
  // No reset token → can't reset; send the user back to start the flow.
  if (!token) {
    redirect({ href: '/forgot-password', locale });
    return null;
  }

  const t = await getTranslations('Auth');

  return (
    <AuthCard title={t('reset.title')} description={t('reset.subtitle')}>
      <ResetPasswordForm token={token} />
    </AuthCard>
  );
}
