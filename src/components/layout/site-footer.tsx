import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

/**
 * Company footer for the `(app)` surface: brand + legal identity line, and
 * the public-page links (about, download, terms, privacy).
 *
 * The identity line carries the registered entity (Công ty Cổ phần SaleNet,
 * MST 0111539358 — per the business registry). TODO(legal): add the support
 * hotline/email once the company designates one; the legal pages' contact
 * sections point readers here.
 */
const LINKS = ['/about-us', '/download', '/terms', '/privacy'] as const;

export function SiteFooter() {
  const t = useTranslations('Common');

  return (
    <footer className="border-t border-border bg-muted/40">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-10">
        <nav aria-label={t('footer.nav')}>
          <ul className="flex flex-wrap items-center gap-x-6 gap-y-2">
            {LINKS.map((href) => (
              <li key={href}>
                <Link
                  href={href}
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {t(`footer.links.${href}` as never)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex flex-col gap-1 text-xs leading-5 text-muted-foreground">
          <p className="font-medium text-foreground">{t('brand')}</p>
          <p>{t('footer.identity')}</p>
          <p>{t('footer.copyright', { year: new Date().getFullYear() })}</p>
        </div>
      </div>
    </footer>
  );
}
