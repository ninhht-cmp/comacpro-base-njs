import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { AuthCard, SignupForm } from '@/features/auth';
import { ApiError, fetchReferralUser } from '@/features/users/server';
import type { ReferralUser } from '@/features/users';
import { Link } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import { newVisitorId, VISITOR_COOKIE } from '@/lib/visitor';

/**
 * Signup is INVITE-ONLY: the referral code (the referrer's phone number)
 * comes exclusively from the app's invite links (`/signup?referral=<phone>`)
 * — there is no visible input. Resolution is a four-way decision:
 *
 * - resolved   → form + "invited by" card (social proof)
 * - invalid    → the code definitively doesn't exist (404) or the referrer is
 *                inactive: fail FAST — block the form in place with guidance,
 *                no redirect (keeps the URL inspectable, no extra page)
 * - missing    → no `?referral=` at all: explain that an invite is required
 * - unverified → the lookup failed transiently (timeout/5xx): fail OPEN —
 *                render the form without the card; the backend re-validates
 *                on submit. A hiccup on our side must not block signups.
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
  // Required by the API for invite-open attribution. proxy.ts mints the
  // cookie on this path; the fallback covers cookie-less agents.
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
  searchParams: Promise<{ referral?: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const { referral } = await searchParams;
  const t = await getTranslations('Auth');

  const resolution = await resolveReferral(referral);

  // Blocked states render guidance instead of the form.
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

  return (
    <AuthCard title={t('signup.title')} description={t('signup.subtitle')}>
      {resolution.kind === 'resolved' && resolution.referrer.fullName ? (
        <p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
          {t('signup.invitedBy', { name: resolution.referrer.fullName })}
        </p>
      ) : null}
      {/* `referral` is guaranteed here: 'missing' returned above. */}
      <SignupForm referralCode={referral!} />
    </AuthCard>
  );
}
