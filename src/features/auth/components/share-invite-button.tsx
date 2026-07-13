'use client';

import { useTranslations } from 'next-intl';
import { IconShare2 } from '@tabler/icons-react';
import { toast } from '@/components/ui/sonner';

/**
 * Shares the CURRENT invite URL (referral included) — the viral loop: an
 * invitee can forward the invitation before even registering. Web Share API
 * on capable devices, clipboard fallback elsewhere.
 */
export function ShareInviteButton() {
  const t = useTranslations('Auth.signup.share');

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: t('title'), url });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast.success(t('copied'));
    } catch {
      // Dismissing the OS share sheet rejects — not an error worth surfacing.
    }
  };

  return (
    <button
      type="button"
      onClick={share}
      aria-label={t('label')}
      className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors hover:bg-primary/15"
    >
      <IconShare2 aria-hidden size={20} />
    </button>
  );
}
