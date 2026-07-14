import type { ComponentProps, ReactNode } from 'react';
import { IconChevronRight } from '@tabler/icons-react';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

/**
 * Marketing CTA in the Claude-docs button style: a rounded-full pill. Primary
 * mirrors the docs' dark "…on the Web" pill (foreground fill, inverted text,
 * trailing chevron); secondary is an outline pill. Kept separate from the
 * design-system `Button` (rounded-lg, used for forms/app UI) so the marketing
 * pages get the docs look without changing functional buttons.
 */
export function CtaLink({
  href,
  variant = 'primary',
  size = 'default',
  arrow = false,
  children,
  className,
}: {
  href: ComponentProps<typeof Link>['href'];
  variant?: 'primary' | 'secondary';
  /** `sm` fits the header bar; `default` is the marketing/page CTA size. */
  size?: 'default' | 'sm';
  arrow?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'inline-flex items-center justify-center gap-1 rounded-xl font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none',
        size === 'sm' ? 'h-9 px-4 text-sm' : 'h-11 px-5 text-sm',
        variant === 'primary'
          ? 'bg-foreground text-background hover:bg-foreground/90'
          : 'border border-border bg-background text-foreground hover:bg-muted',
        className,
      )}
    >
      {children}
      {arrow ? (
        <IconChevronRight size={16} className="-mr-1" aria-hidden />
      ) : null}
    </Link>
  );
}
