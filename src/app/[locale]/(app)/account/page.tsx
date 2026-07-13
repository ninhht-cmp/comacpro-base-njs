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
import { requireSession } from '@/core/guard/require';
import { roleKeyOf } from '@/core/identity';
import { fetchProfile } from '@/core/session/server';
import { LogoutButton } from '@/features/auth';
import {
  ChangePasswordForm,
  ProfileForm,
  type User,
  toUser,
} from '@/features/users';
import { routing } from '@/i18n/routing';

export default async function AccountPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  // proxy.ts already guards this route; `requireSession` is defense-in-depth
  // (redirects to sign-in if the session is somehow absent).
  const session = await requireSession();

  const t = await getTranslations('Auth');

  // Start from the session snapshot, then refine with the live profile. The DTO
  // is mapped to the domain `User` at the boundary (`toUser`) — the page never
  // sees the wire shape or its numeric enums.
  let user: User = {
    id: session.user.id,
    username: session.user.username,
    fullName: session.user.fullName,
    email: session.user.email,
    avatar: session.user.avatar,
  };
  try {
    user = toUser(await fetchProfile(session.accessToken));
  } catch {
    // Keep the session snapshot.
  }

  return (
    <main className="mx-auto flex w-full max-w-lg flex-col gap-6 px-6 py-16">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{t('account.title')}</CardTitle>
          {user.username ? (
            <CardDescription>
              {t('account.username')}: {user.username}
              {user.role ? ` · ${t(`roles.${roleKeyOf(user.role)}`)}` : ''}
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
            <ProfileForm
              defaultValues={{
                fullName: user.fullName,
                email: user.email,
                address: user.address,
              }}
            />
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

          <LogoutButton />
        </CardContent>
      </Card>
    </main>
  );
}
