import { getTranslations } from 'next-intl/server';

export default async function Loading() {
  const t = await getTranslations('Common');
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-1 items-center justify-center p-12"
    >
      <div
        aria-hidden
        className="h-8 w-8 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-foreground"
      />
      <span className="sr-only">{t('loading')}</span>
    </div>
  );
}
