import type { Metadata } from 'next';
import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { requireSession } from '@/core/guard/require';
import { fetchProfile } from '@/core/session/server';
import {
  InviteLinkCard,
  ReferralList,
  type ReferralMemberPage,
} from '@/modules/users';
import { fetchMyReferrals } from '@/modules/users/server';
import { routing } from '@/i18n/routing';
import { logger } from '@/lib/observability/logger';

const PER_PAGE = 20;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Referrals.metadata');
  // Protected page: robots.ts disallows it; no canonical/OG needed.
  return { title: t('title') };
}

/**
 * Referral hub for signed-in members (ADR 0005: referrers manage their
 * invite links on the web): the invite link to share, and the members it
 * brought in. Each half degrades independently — a failed profile hides the
 * link card with guidance, a failed list shows a retryable error — so one
 * upstream hiccup never blanks the whole page.
 */
export default async function ReferralsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  // proxy.ts already guards this route; requireSession is defense-in-depth.
  const session = await requireSession();
  const t = await getTranslations('Referrals');

  const pageParam = Number((await searchParams).page);
  const page = Number.isInteger(pageParam) && pageParam > 1 ? pageParam : 1;

  // Independent fetches, independent fallbacks (allSettled, not all).
  const [profileResult, referralsResult] = await Promise.allSettled([
    fetchProfile(session.accessToken),
    fetchMyReferrals(session.accessToken, { page, perPage: PER_PAGE }),
  ]);

  const referralUrl =
    profileResult.status === 'fulfilled'
      ? profileResult.value.referralUrl
      : undefined;
  let referrals: ReferralMemberPage | null = null;
  if (referralsResult.status === 'fulfilled') {
    referrals = referralsResult.value;
  } else {
    logger.error('referrals', 'list fetch failed', referralsResult.reason);
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-16">
      <h1 className="font-heading text-3xl font-medium tracking-tight text-foreground">
        {t('title')}
      </h1>

      {referralUrl ? (
        <InviteLinkCard url={referralUrl} />
      ) : (
        // No link on the profile (or the profile call failed): the fix lives
        // in the app, so say that instead of rendering a broken card.
        <p className="text-sm text-muted-foreground">
          {t('invite.unavailable')}
        </p>
      )}

      <section className="flex flex-col gap-4">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-lg font-semibold text-foreground">
            {t('list.title')}
          </h2>
          {referrals?.meta && referrals.meta.total > 0 ? (
            <span className="text-sm text-muted-foreground">
              {t('list.total', { count: referrals.meta.total })}
            </span>
          ) : null}
        </div>

        {referrals ? (
          <ReferralList items={referrals.items} meta={referrals.meta} />
        ) : (
          <p
            role="alert"
            className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
          >
            {t('list.loadError')}
          </p>
        )}
      </section>
    </main>
  );
}
