import { useTranslations } from 'next-intl';
import type { ComponentProps } from 'react';
import { BrandLogo } from '@/components/layout/brand-logo';
import { Link } from '@/i18n/navigation';

/**
 * Company footer, structured like a content-portal footer (ref: zongheng.com):
 * a multi-column link/brand/contact row on top, then a centered legal-identity
 * block (registered entity, tax code, copyright) below a hairline — the
 * Vietnamese equivalent of the ICP/registration block those sites carry.
 *
 * TODO(legal): add support email/hotline in the contact column, and the
 * "Đã thông báo Bộ Công Thương" badge, once the company provides them (a real
 * registration is required before that badge may be shown).
 */
type FooterLink = ComponentProps<typeof Link>['href'] & string;

const EXPLORE: FooterLink[] = ['/', '/about-us', '/download'];
const LEGAL: FooterLink[] = ['/terms', '/privacy'];

export function SiteFooter() {
  const t = useTranslations('Common');

  return (
    <footer className="border-t border-border bg-muted/40">
      <div className="mx-auto flex w-full max-w-[100rem] flex-col gap-10 px-6 py-12 lg:px-8">
        {/* Top: brand · link columns · contact */}
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_2fr]">
          <div className="flex flex-col gap-4">
            <Link href="/" className="flex items-center">
              <BrandLogo className="h-7" />
            </Link>
            <p className="max-w-xs text-sm leading-6 text-muted-foreground">
              {t('footer.tagline')}
            </p>
          </div>

          <FooterColumn heading={t('footer.explore')} links={EXPLORE} t={t} />
          <FooterColumn heading={t('footer.legal')} links={LEGAL} t={t} />

          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-foreground">
              {t('footer.contact')}
            </h3>
            <div className="flex flex-col gap-1 text-sm leading-6 text-muted-foreground">
              <span className="text-foreground">
                {t('footer.addressLabel')}
              </span>
              <address className="not-italic">{t('footer.address')}</address>
            </div>
          </div>
        </div>

        {/* Legal identity — centered, small, like the ICP block */}
        <div className="flex flex-col items-center gap-1.5 border-t border-border pt-8 text-center text-xs leading-5 text-muted-foreground">
          <p className="font-medium text-foreground">{t('footer.company')}</p>
          <p>{t('footer.taxId')}</p>
          <p>{t('footer.copyright', { year: new Date().getFullYear() })}</p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  heading,
  links,
  t,
}: {
  heading: string;
  links: FooterLink[];
  t: ReturnType<typeof useTranslations<'Common'>>;
}) {
  return (
    <nav aria-label={heading} className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-foreground">{heading}</h3>
      <ul className="flex flex-col gap-2.5">
        {links.map((href) => (
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
  );
}
