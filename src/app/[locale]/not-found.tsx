import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';

export default async function NotFound() {
  const t = await getTranslations('Errors.notFound');
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-3xl font-semibold tracking-tight text-foreground">
        {t('title')}
      </h1>
      <p className="max-w-md text-muted-foreground">{t('description')}</p>
      <Button asChild>
        <Link href="/">{t('back')}</Link>
      </Button>
    </div>
  );
}
