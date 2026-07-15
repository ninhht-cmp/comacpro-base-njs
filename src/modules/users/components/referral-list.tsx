import { getFormatter, getTranslations } from 'next-intl/server';
import { IconShieldCheck } from '@tabler/icons-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { roleKeyOf } from '@/core/identity';
import { Link } from '@/i18n/navigation';
import { maskPhoneForDisplay } from '@/lib/mask';
import { initialsOf } from '@/lib/name';
import type { ReferralMember, ReferralPageMeta } from '../api';

/**
 * The referred-members list (server component — data arrives as props, the
 * only interaction is prev/next links driving the `?page=` search param).
 *
 * Phones are display-MASKED: the member registered with their own number and
 * the referrer doesn't need it in full on screen (same shoulder-surfing
 * rationale as the account page's CCCD). Flip to full display if the product
 * decides referrers manage their team by phone.
 */
export async function ReferralList({
  items,
  meta,
}: {
  items: ReferralMember[];
  meta?: ReferralPageMeta;
}) {
  const t = await getTranslations('Referrals.list');
  const tAuth = await getTranslations('Auth');
  const format = await getFormatter();

  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">{t('empty')}</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col divide-y divide-border">
        {items.map((member) => (
          <li key={member.id} className="flex items-center gap-3 py-4">
            <Avatar>
              <AvatarImage src={member.avatar} alt="" />
              <AvatarFallback>{initialsOf(member.fullName)}</AvatarFallback>
            </Avatar>

            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate text-sm font-medium text-foreground">
                  {member.fullName}
                </p>
                {member.role ? (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    {tAuth(`roles.${roleKeyOf(member.role)}`)}
                  </span>
                ) : null}
                {member.ekycVerified ? (
                  <IconShieldCheck
                    size={14}
                    aria-hidden
                    className="text-brand"
                  />
                ) : null}
              </div>
              <p className="text-xs text-muted-foreground">
                {member.phone ? `${maskPhoneForDisplay(member.phone)} · ` : ''}
                {t('joined', {
                  date: format.dateTime(new Date(member.joinedAt), {
                    dateStyle: 'medium',
                  }),
                })}
              </p>
            </div>

            {member.dealCount !== undefined ? (
              <span className="shrink-0 text-sm text-muted-foreground tabular-nums">
                {t('deals', { count: member.dealCount })}
              </span>
            ) : null}
          </li>
        ))}
      </ul>

      {meta && meta.totalPages > 1 ? (
        <nav
          aria-label={t('page', { page: meta.page, total: meta.totalPages })}
          className="flex items-center justify-between border-t border-border pt-4 text-sm"
        >
          {meta.page > 1 ? (
            <Link
              href={{ pathname: '/referrals', query: { page: meta.page - 1 } }}
              className="font-medium text-foreground underline underline-offset-4"
            >
              ← {t('prev')}
            </Link>
          ) : (
            <span />
          )}
          <span className="text-muted-foreground">
            {t('page', { page: meta.page, total: meta.totalPages })}
          </span>
          {meta.page < meta.totalPages ? (
            <Link
              href={{ pathname: '/referrals', query: { page: meta.page + 1 } }}
              className="font-medium text-foreground underline underline-offset-4"
            >
              {t('next')} →
            </Link>
          ) : (
            <span />
          )}
        </nav>
      ) : null}
    </div>
  );
}
