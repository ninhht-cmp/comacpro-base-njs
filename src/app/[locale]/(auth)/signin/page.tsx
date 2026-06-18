import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { GoogleSigninButton, SigninForm } from '@/features/auth';
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
    <main className="mx-auto flex min-h-[60vh] w-full max-w-sm flex-col justify-center gap-6 px-6 py-16">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {t('signInTitle')}
        </h1>
        <p className="text-sm text-muted-foreground">{t('signInSubtitle')}</p>
      </div>
      <SigninForm redirect={redirect} />
      <GoogleSigninButton redirectTo={redirect} />
    </main>
  );
}
