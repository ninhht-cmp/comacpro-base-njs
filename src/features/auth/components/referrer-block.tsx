import { useTranslations } from 'next-intl';
import { IconDeviceMobile } from '@tabler/icons-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { roleKeyOf } from '@/core/identity';
import type { ReferralUser } from '@/features/users';
import { ShareInviteButton } from './share-invite-button';

/**
 * Referrer identity block (top of the invite landing): avatar | name, role
 * title, phone | share button. The referrer is the funnel's trust anchor;
 * their achievement medals live in the separate honor carousel below.
 */
export function ReferrerBlock({ referrer }: { referrer: ReferralUser }) {
  const t = useTranslations('Auth');
  const name = referrer.fullName ?? referrer.username ?? referrer.phone ?? '';

  return (
    <section className="flex items-center gap-4 px-4 sm:px-0">
      <Avatar size="lg" className="size-18 text-xl">
        <AvatarImage src={referrer.avatar} alt="" />
        <AvatarFallback className="text-xl">{initialsOf(name)}</AvatarFallback>
      </Avatar>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <h1 className="truncate text-lg font-semibold text-foreground">
          {name}
        </h1>
        {referrer.role ? (
          <p className="text-sm text-muted-foreground">
            {t(`roles.${roleKeyOf(referrer.role)}`)}
          </p>
        ) : null}
        {referrer.phone ? (
          <p className="flex items-center gap-1.5 text-sm font-medium text-foreground">
            <IconDeviceMobile aria-hidden size={16} className="text-primary" />
            {referrer.phone}
          </p>
        ) : null}
      </div>
      <ShareInviteButton />
    </section>
  );
}

function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/);
  const first = words[0]?.[0] ?? '';
  const last = words.length > 1 ? (words[words.length - 1]?.[0] ?? '') : '';
  return (first + last).toUpperCase() || '?';
}
