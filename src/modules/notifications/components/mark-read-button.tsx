'use client';

import { useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/sonner';
import { useRouter } from '@/i18n/navigation';
import { markNotificationAsRead } from '../server/actions';

/** Marks a single notification read, then refreshes the server-rendered list. */
export function MarkReadButton({ id }: { id: string }) {
  const t = useTranslations('Notifications');
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      size="xs"
      variant="ghost"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await markNotificationAsRead(id);
          if (result.error) {
            toast.error(t('markReadError'));
            return;
          }
          router.refresh();
        })
      }
    >
      {pending ? t('marking') : t('markRead')}
    </Button>
  );
}
