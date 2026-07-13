import type { Metadata } from 'next';
import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { cookies, headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import {
  AuthCard,
  HonorMedals,
  ReferrerBlock,
  SignupAboutSection,
  SignupForm,
  SignupSuccessCard,
} from '@/features/auth';
import { readSignupSuccess } from '@/features/auth/server';
import { ApiError, fetchReferralUser } from '@/features/users/server';
import type { ReferralUser } from '@/features/users';
import { APP_STORE_ID } from '@/config/app-links';
import { Link } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import { detectPlatform } from '@/lib/platform';
import { newVisitorId, VISITOR_COOKIE } from '@/lib/visitor';

/** Safari Smart App Banner — inert until the real App Store id is configured. */
export const metadata: Metadata = APP_STORE_ID
  ? { itunes: { appId: APP_STORE_ID } }
  : {};

/**
 * Signup is INVITE-ONLY: the referral code (= the referrer's phone number)
 * comes exclusively from app invite links (`/signup?referral=<phone>`).
 * Fail FAST when the code is definitively bad (blocked in place — no
 * redirect, URL stays inspectable); fail OPEN on transient lookup errors
 * (form renders, backend re-validates on submit).
 */
type ReferralResolution =
  | { kind: 'resolved'; referrer: ReferralUser }
  | { kind: 'invalid' }
  | { kind: 'missing' }
  | { kind: 'unverified' };

async function resolveReferral(
  referral: string | undefined,
): Promise<ReferralResolution> {
  if (!referral) return { kind: 'missing' };
  // Required for invite-open attribution; fallback covers cookie-less agents.
  const sessionId =
    (await cookies()).get(VISITOR_COOKIE)?.value ?? newVisitorId();
  try {
    const referrer = await fetchReferralUser(referral, sessionId);
    // An inactive referrer almost certainly can't refer — treat as invalid.
    // PRODUCT TODO: confirm against the backend's actual signup rule.
    if (referrer.status === 'inactive') return { kind: 'invalid' };
    return { kind: 'resolved', referrer };
  } catch (error) {
    if (
      error instanceof ApiError &&
      (error.status === 404 || error.status === 400)
    ) {
      return { kind: 'invalid' };
    }
    console.error('[signup] referral lookup failed transiently', error);
    return { kind: 'unverified' };
  }
}

export default async function SignupPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ referral?: string; status?: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const { referral, status } = await searchParams;
  const t = await getTranslations('Auth');

  const resolution = await resolveReferral(referral);

  // Blocked states render guidance instead of the landing.
  if (resolution.kind === 'missing' || resolution.kind === 'invalid') {
    const variant = resolution.kind;
    return (
      <AuthCard
        title={t(`signup.inviteOnly.${variant}Title`)}
        description={t(`signup.inviteOnly.${variant}Body`)}
      >
        <p className="text-center text-sm text-muted-foreground">
          {t('links.haveAccount')}{' '}
          <Link
            href="/signin"
            className="font-medium text-foreground underline"
          >
            {t('links.toLogin')}
          </Link>
        </p>
      </AuthCard>
    );
  }

  // PRG success state: the action redirects back here with `?status=success`
  // and a short-lived cookie (masked phone) proving a signup just happened —
  // the bare query param alone (shared/bookmarked URL) shows the form.
  const maskedPhone = status === 'success' ? await readSignupSuccess() : null;
  const platform = detectPlatform((await headers()).get('user-agent'));

  return (
    // Mobile is edge-to-edge (cards span the viewport); the padded, centered
    // column only kicks in from `sm`. No mobile bottom padding — the form
    // card is a bottom sheet there (rounded top, flush bottom).
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-8 py-12 max-sm:pb-0 sm:max-w-2xl sm:px-6 sm:py-16">
      {resolution.kind === 'resolved' ? (
        // Card-less, but aligned to the form card's column below.
        <div className="mx-auto flex w-full max-w-md flex-col gap-6">
          <ReferrerBlock referrer={resolution.referrer} />
          <HonorMedals />
        </div>
      ) : null}

      {/* Edge-less (the Card "border" is a ring utility, not `border`):
          elevation comes from the shadow alone. On mobile it reads as a
          bottom sheet — top corners keep their rounding, bottom runs flush. */}
      {/* max-sm:flex-1: on short content the card's white surface stretches
          to the viewport bottom instead of leaving a strip of page bg. */}
      <Card className="mx-auto w-full max-w-md shadow-md ring-0 max-sm:flex-1 max-sm:rounded-b-none">
        <CardContent className="flex flex-col gap-4">
          {maskedPhone ? (
            <SignupSuccessCard maskedPhone={maskedPhone} platform={platform} />
          ) : (
            <>
              <div className="flex flex-col gap-1">
                <h2 className="text-xl font-semibold">{t('signup.title')}</h2>
                <p className="text-sm text-muted-foreground">
                  {t('signup.subtitle')}
                </p>
              </div>
              {/* `referral` is guaranteed here: 'missing' returned above. */}
              <SignupForm referralCode={referral!} />
            </>
          )}

          {/* Mobile: the about section lives INSIDE this card (one sheet with
              the form); from `sm` the standalone section below renders
              instead. Two instances, one visible — RSC, so no JS cost. */}
          <div className="pt-2 sm:hidden">
            <SignupAboutSection />
          </div>
        </CardContent>
      </Card>

      <div className="max-sm:hidden">
        <SignupAboutSection />
      </div>
    </main>
  );
}
