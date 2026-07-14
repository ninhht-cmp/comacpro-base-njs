import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { IconDeviceMobile, IconShieldCheck } from '@tabler/icons-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { requireSession } from '@/core/guard/require';
import { roleKeyOf } from '@/core/identity';
import { fetchProfile } from '@/core/session/server';
import { LogoutButton } from '@/modules/auth';
import { type User, toUser } from '@/modules/users';
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
  return idCard.length <= 3 ? idCard : `••• ••• ${idCard.slice(-3)}`;
}

export default async function AccountPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  // proxy.ts already guards this route; `requireSession` is defense-in-depth.
  const session = await requireSession();
  const t = await getTranslations('Auth');

  // Session snapshot first, then refine with the live profile (mapped to the
  // domain `User` at the boundary — the page never sees the wire DTO).
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

  const rows = (
    [
      ['account.profile.email', user.email],
      ['account.idCard', user.idCardNumber && maskIdCard(user.idCardNumber)],
      [
        'account.profile.address',
        // Street + ward + province, skipping absent parts.
        [user.address, user.ward, user.province].filter(Boolean).join(', ') ||
          undefined,
      ],
      ['account.referralCode', user.referralCode],
    ] as const
  ).filter(([, value]) => value);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-16">
      <h1 className="font-heading text-3xl font-medium tracking-tight text-foreground">
        {t('account.title')}
      </h1>

      {/* READ-ONLY by product decision (temporary): profile edits and password
          changes live in the mobile app. Restore ProfileForm /
          ChangePasswordForm from `@/modules/users` to re-enable. */}

      {/* Identity header */}
      <Card>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <Avatar className="size-16 ring-1 ring-border">
            <AvatarImage src={user.avatar} alt="" />
            <AvatarFallback className="text-xl">
              {initialsOf(user.fullName ?? user.username ?? '')}
            </AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <p className="truncate text-xl font-semibold text-foreground">
              {user.fullName ?? user.username}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {user.role ? (
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                  {t(`roles.${roleKeyOf(user.role)}`)}
                </span>
              ) : null}
              {/* Only rendered once the live profile answered — a session-only
                  fallback doesn't carry it, and showing "unverified" to a
                  verified user is worse than silence. */}
              {user.ekycVerified !== undefined ? (
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    user.ekycVerified
                      ? 'bg-brand/10 text-brand'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  <IconShieldCheck size={13} aria-hidden />
                  {t(
                    user.ekycVerified
                      ? 'account.ekycVerified'
                      : 'account.ekycUnverified',
                  )}
                </span>
              ) : null}
            </div>
            {user.phone ? (
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <IconDeviceMobile size={15} aria-hidden />
                {user.phone}
              </p>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {/* Details */}
      {rows.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t('account.profile.title')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="flex flex-col">
              {rows.map(([key, value]) => (
                <div
                  key={key}
                  className="flex items-baseline justify-between gap-4 border-b border-border py-3 first:pt-0 last:border-b-0 last:pb-0"
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
          </CardContent>
        </Card>
      ) : null}

      <p className="text-sm text-muted-foreground">
        {t('account.manageInApp')}
      </p>

      <div>
        <LogoutButton />
      </div>
    </main>
  );
}
