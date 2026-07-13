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
import { fetchProfile } from '@/core/session/server';
import { LogoutButton } from '@/features/auth';
import {
  CancelAccountButton,
  ChangePasswordForm,
  ProfileForm,
  type User,
  UserRole,
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

  // Exhaustive over the generated role union — a new backend role fails to
  // compile here until it gets a label (and a translation in both locales).
  const roleLabel: Record<UserRole, string> = {
    [UserRole['sm-admin']]: t('account.roles.sm-admin'),
    [UserRole['sm-system']]: t('account.roles.sm-system'),
    [UserRole['sm-marketing']]: t('account.roles.sm-marketing'),
    [UserRole['sm-support-user']]: t('account.roles.sm-support-user'),
    [UserRole['sm-support-supplier']]: t('account.roles.sm-support-supplier'),
    [UserRole['sm-support-customer']]: t('account.roles.sm-support-customer'),
    [UserRole['sm-support-deal']]: t('account.roles.sm-support-deal'),
    [UserRole['sm-support-product']]: t('account.roles.sm-support-product'),
    [UserRole['sm-boss']]: t('account.roles.sm-boss'),
    [UserRole['sm-manager']]: t('account.roles.sm-manager'),
    [UserRole['sm-leader']]: t('account.roles.sm-leader'),
    [UserRole['sm-saler']]: t('account.roles.sm-saler'),
    [UserRole['sm-member']]: t('account.roles.sm-member'),
  };

  return (
    <main className="mx-auto flex w-full max-w-lg flex-col gap-6 px-6 py-16">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{t('account.title')}</CardTitle>
          {user.username ? (
            <CardDescription>
              {t('account.username')}: {user.username}
              {user.role ? ` · ${roleLabel[user.role]}` : ''}
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
