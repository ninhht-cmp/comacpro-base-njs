import { useTranslations } from 'next-intl';
import {
  IconTargetArrow,
  IconTrendingUp,
  IconUserPlus,
  type Icon,
} from '@tabler/icons-react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from '@/i18n/navigation';

/**
 * "About us" landing section: heading + three link cards deep-linking into
 * `/about-us` — each card lands on its own section via the URL hash (the
 * section ids on that page are this `hash` value).
 */

const ITEMS = [
  { key: 'mission', icon: IconTargetArrow, hash: 'mission' },
  { key: 'join', icon: IconUserPlus, hash: 'join' },
  { key: 'growth', icon: IconTrendingUp, hash: 'growth' },
] as const satisfies readonly { key: string; icon: Icon; hash: string }[];

export function SignupAboutSection() {
  const t = useTranslations('Auth.signup.about');

  return (
    <section className="flex flex-col gap-3">
      {/* No own side padding: the container provides it (CardContent on
          mobile, the page column on sm+). */}
      <h2 className="text-center text-xs font-medium tracking-widest text-muted-foreground uppercase">
        {t('heading')}
      </h2>
      {/* Always 3-up — on phones the cards shrink instead of stacking, so the
          section stays one compact row (hence the smaller type below). */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {ITEMS.map(({ key, icon: ItemIcon, hash }) => (
          <Link
            key={key}
            href={{ pathname: '/about-us', hash }}
            className="group rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {/* Brand-tinted (the Card "border" is a ring utility): primary
                ring, pastel primary wash, primary text; hover deepens the
                wash — the card reads as a button. */}
            <Card
              size="sm"
              className="h-full bg-primary/5 ring-primary/25 transition-colors group-hover:bg-primary/10"
            >
              <CardHeader className="justify-items-center">
                <ItemIcon
                  aria-hidden
                  size={22}
                  className="text-primary"
                  stroke={1.75}
                />
                {/* min-h = two lines at each breakpoint: every card keeps the
                    same height whether its title wraps or not (h-full on the
                    Card equalizes any third line across the row). */}
                {/* Plain text-primary is AA-safe here: the blue primary is
                    4.85:1 on white (light) and 5.3:1 on dark surfaces. */}
                <CardTitle className="flex min-h-8 items-center justify-center text-center text-xs leading-4 font-semibold text-primary sm:min-h-10 sm:text-sm sm:leading-5">
                  {t(key)}
                </CardTitle>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
