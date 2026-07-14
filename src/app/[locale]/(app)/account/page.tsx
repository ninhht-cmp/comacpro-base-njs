import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { requireSession } from '@/core/guard/require';
import { roleKeyOf } from '@/core/identity';
import { fetchProfile } from '@/core/session/server';
import { LogoutButton } from '@/features/auth';
import { type User, toUser } from '@/features/users';
import { routing } from '@/i18n/routing';

function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/);
  const first = words[0]?.[0] ?? '';
  const last = words.length > 1 ? (words[words.length - 1]?.[0] ?? '') : '';
  return (first + last).toUpperCase() || '?';
}

/**
 * CCCD stays masked on screen (last 3 digits only): the owner already knows
 * it, so showing it in full only serves shoulder-surfers and screenshots.
 */
function maskIdCard(idCard: string): string {
  return idCard.length <= 3 ? idCard : `*** *** ${idCard.slice(-3)}`;
}

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
        </CardHeader>
        <CardContent className="flex flex-col gap-8">
          {/* READ-ONLY by product decision (temporary): profile edits and
              password changes live in the mobile app for now. To re-enable,
              restore ProfileForm / ChangePasswordForm from `@/features/users`
              (kept intact, tests included) — see git history of this page. */}
          <section className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <Avatar className="size-16">
                <AvatarImage src={user.avatar} alt="" />
                <AvatarFallback className="text-xl">
                  {initialsOf(user.fullName ?? user.username ?? '')}
                </AvatarFallback>
              </Avatar>
              <div className="flex min-w-0 flex-col">
                <p className="truncate text-lg font-semibold text-foreground">
                  {user.fullName ?? user.username}
                </p>
                {user.role ? (
                  <p className="text-sm text-muted-foreground">
                    {t(`roles.${roleKeyOf(user.role)}`)}
                  </p>
                ) : null}
                {/* eKYC state only renders once the live profile answered —
                    a session-snapshot fallback doesn't carry it, and showing
                    "unverified" to a verified user is worse than silence. */}
                {user.ekycVerified !== undefined ? (
                  <span
                    className={`mt-1 self-start rounded-full px-2 py-0.5 text-xs font-medium ${
                      user.ekycVerified
                        ? 'bg-primary/10 text-primary'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {t(
                      user.ekycVerified
                        ? 'account.ekycVerified'
                        : 'account.ekycUnverified',
                    )}
                  </span>
                ) : null}
              </div>
            </div>

            <dl className="flex flex-col">
              {(
                [
                  ['account.username', user.username],
                  ['account.profile.email', user.email],
                  [
                    'account.idCard',
                    user.idCardNumber && maskIdCard(user.idCardNumber),
                  ],
                  [
                    'account.profile.address',
                    // Street + ward + province, skipping absent parts.
                    [user.address, user.ward, user.province]
                      .filter(Boolean)
                      .join(', ') || undefined,
                  ],
                  ['account.referralCode', user.referralCode],
                ] as const
              )
                .filter(([, value]) => value)
                .map(([key, value]) => (
                  <div
                    key={key}
                    className="flex items-baseline justify-between gap-4 border-b border-border py-3 last:border-b-0"
                  >
                    <dt className="shrink-0 text-sm text-muted-foreground">
                      {t(key)}
                    </dt>
                    <dd className="text-right text-sm font-medium break-words text-foreground">
                      {value}
                    </dd>
                  </div>
                ))}
            </dl>

            <p className="text-sm text-muted-foreground">
              {t('account.manageInApp')}
            </p>
          </section>

          <Separator />

          <LogoutButton />
        </CardContent>
      </Card>
    </main>
  );
}
