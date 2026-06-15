import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { LogoutButton } from '@/components/auth/logout-button';
import { externalUserControllerGetMyProfileV1 } from '@/lib/api/generated/external-identities/external-identities';
import { redirect } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import { authorizedRequest, getSession } from '@/lib/auth/cookies';

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
    redirect({ href: '/login', locale });
    return null;
  }

  const t = await getTranslations('Auth');

  // Authenticated call: the ky mutator attaches the session's bearer token, so
  // the fresh profile is fetched as the signed-in user. Fall back to the
  // session snapshot if the live call fails.
  let fullName = session.user.fullName;
  let email = session.user.email;
  let role = session.user.role;
  try {
    const profile = (
      await externalUserControllerGetMyProfileV1(await authorizedRequest())
    ).data;
    if (profile) {
      fullName = profile.fullName;
      email = profile.email;
      const profileRole = (profile as { role?: string }).role;
      if (profileRole) role = String(profileRole);
    }
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
        {role ? (
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">{t('account.role')}</dt>
            <dd className="font-medium text-card-foreground">{role}</dd>
          </div>
        ) : null}
      </dl>

      <LogoutButton />
    </main>
  );
}
