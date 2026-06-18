import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { LogoutButton } from '@/features/auth';
import { fetchProfile, getSession } from '@/features/auth/server';
import { redirect } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';

export default async function AccountPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  // proxy.ts already guards this route; this is defense-in-depth.
  const session = await getSession();
  if (!session) {
    redirect({ href: '/signin', locale });
    return null;
  }

  const t = await getTranslations('Auth');

  // Fetch the live profile with the session's bearer token (raw fetch — the
  // generated client's `BaseResDto` envelope doesn't match the live response).
  // Fall back to the session snapshot if the call fails.
  let fullName = session.user.fullName;
  let email = session.user.email;
  let username = session.user.username;
  try {
    const profile = await fetchProfile(session.accessToken);
    fullName = profile.fullName;
    email = profile.email;
    username = profile.username;
  } catch {
    // Keep the session snapshot.
  }

  return (
    <main className="mx-auto flex w-full max-w-lg flex-col gap-6 px-6 py-16">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        {t('account.title')}
      </h1>

      <dl className="flex flex-col gap-3 rounded-lg border border-border bg-card p-6 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">{t('account.signedInAs')}</dt>
          <dd className="font-medium text-card-foreground">{fullName}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">{t('email')}</dt>
          <dd className="font-medium text-card-foreground">{email}</dd>
        </div>
        {username ? (
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">{t('account.username')}</dt>
            <dd className="font-medium text-card-foreground">{username}</dd>
          </div>
        ) : null}
      </dl>

      <LogoutButton />
    </main>
  );
}
