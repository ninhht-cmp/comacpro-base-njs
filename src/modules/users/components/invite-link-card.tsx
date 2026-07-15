'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { IconCheck, IconCopy, IconShare2 } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/sonner';

/**
 * The member's invite link with copy + native-share — the referral loop's
 * supply side (the demand side is the signup landing that consumes the link).
 * The URL itself comes from the profile (`referralUrl`, built by the backend
 * so web and app share one canonical link).
 */
export function InviteLinkCard({ url }: { url: string }) {
  const t = useTranslations('Referrals.invite');
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success(t('copied'));
      // Brief ✓ affordance on the button itself, then back to normal.
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard denied (permissions/iframe) — the visible URL is selectable.
    }
  };

  const share = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: t('shareTitle'), url });
        return;
      }
      await copy();
    } catch {
      // Dismissing the OS share sheet rejects — not an error worth surfacing.
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground">{t('description')}</p>
        <div className="flex flex-col gap-2 sm:flex-row">
          {/* Read-only input: visible, selectable fallback when clipboard
              APIs are unavailable. */}
          <input
            readOnly
            value={url}
            onFocus={(e) => e.currentTarget.select()}
            aria-label={t('title')}
            className="h-10 min-w-0 flex-1 rounded-lg border border-border bg-muted/40 px-3 font-mono text-sm text-foreground"
          />
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              className="h-10"
              onClick={copy}
            >
              {copied ? (
                <IconCheck size={16} aria-hidden />
              ) : (
                <IconCopy size={16} aria-hidden />
              )}
              {t('copy')}
            </Button>
            <Button type="button" className="h-10" onClick={share}>
              <IconShare2 size={16} aria-hidden />
              {t('share')}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
