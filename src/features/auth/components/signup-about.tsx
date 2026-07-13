import { useTranslations } from 'next-intl';
import {
  IconHeadset,
  IconPackage,
  IconUsers,
  type Icon,
} from '@tabler/icons-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * "About us" landing section: heading + three value-prop cards.
 * TODO(product): placeholder copy — replace with the real value props.
 */

const ITEMS = [
  { key: 'community', icon: IconUsers },
  { key: 'products', icon: IconPackage },
  { key: 'support', icon: IconHeadset },
] as const satisfies readonly { key: string; icon: Icon }[];

export function SignupAboutSection() {
  const t = useTranslations('Auth.signup.about');

  return (
    <section className="flex flex-col gap-3">
      <h2 className="px-4 text-xs font-medium tracking-widest text-muted-foreground uppercase sm:px-0">
        {t('heading')}
      </h2>
      <div className="grid gap-3 sm:grid-cols-3">
        {ITEMS.map(({ key, icon: ItemIcon }) => (
          <Card key={key} size="sm" className="max-sm:rounded-none">
            <CardHeader>
              <ItemIcon
                aria-hidden
                size={22}
                className="text-primary"
                stroke={1.75}
              />
              <CardTitle className="text-sm font-semibold">
                {t(`${key}.title`)}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {t(`${key}.body`)}
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
