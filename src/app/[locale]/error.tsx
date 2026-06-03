'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';

export default function Error({ reset }: { error: Error; reset: () => void }) {
  const t = useTranslations('Errors.generic');
  const tc = useTranslations('Common.actions');
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-3xl font-semibold tracking-tight text-foreground">
        {t('title')}
      </h1>
      <p className="max-w-md text-muted-foreground">{t('description')}</p>
      <Button onClick={reset}>{tc('retry')}</Button>
    </div>
  );
}
