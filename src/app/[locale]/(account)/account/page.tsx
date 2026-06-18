import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { LogoutButton } from '@/features/auth';
import { fetchProfile, getSession } from '@/features/auth/server';
import {
  CancelAccountButton,
  ChangePasswordForm,
  ProfileForm,
} from '@/features/users';
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
  const username = session.user.username;
  let address: string | undefined;
  try {
    const profile = await fetchProfile(session.accessToken);
    fullName = profile.fullName;
    email = profile.email;
    address = profile.address;
  } catch {
    // Keep the session snapshot.
  }

  return (
    <main className="mx-auto flex w-full max-w-lg flex-col gap-6 px-6 py-16">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{t('account.title')}</CardTitle>
          {username ? (
            <CardDescription>
              {t('account.username')}: {username}
            </CardDescription>
          ) : null}
        </CardHeader>
        <CardContent className="flex flex-col gap-8">
          <section className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-semibold">
                {t('account.profile.title')}
              </h2>
              <p className="text-sm text-muted-foreground">
                {t('account.profile.description')}
              </p>
            </div>
            <ProfileForm defaultValues={{ fullName, email, address }} />
          </section>

          <Separator />

          <section className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-semibold">
                {t('account.password.title')}
              </h2>
              <p className="text-sm text-muted-foreground">
                {t('account.password.description')}
              </p>
            </div>
            <ChangePasswordForm />
          </section>

          <Separator />

          <section className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-semibold text-destructive">
                {t('account.danger.title')}
              </h2>
              <p className="text-sm text-muted-foreground">
                {t('account.danger.description')}
              </p>
            </div>
            <CancelAccountButton />
          </section>

          <Separator />

          <LogoutButton />
        </CardContent>
      </Card>
    </main>
  );
}
