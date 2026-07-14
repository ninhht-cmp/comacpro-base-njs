import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Shared marketing section header: an optional brand-orange eyebrow, a display
 * title, and an optional lede. One component so every section shares the same
 * type rhythm and alignment — the consistency that reads as "designed system"
 * rather than page-by-page.
 */
export function SectionHeading({
  eyebrow,
  title,
  lede,
  align = 'center',
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  lede?: ReactNode;
  align?: 'center' | 'left';
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3',
        align === 'center' ? 'items-center text-center' : 'items-start',
        className,
      )}
    >
      {eyebrow ? <span className="text-eyebrow">{eyebrow}</span> : null}
      <h2 className="font-heading text-3xl font-medium tracking-tight text-balance text-foreground">
        {title}
      </h2>
      {lede ? (
        <p
          className={cn(
            'max-w-2xl text-base leading-7 text-pretty text-muted-foreground sm:text-lg',
            align === 'center' && 'mx-auto',
          )}
        >
          {lede}
        </p>
      ) : null}
    </div>
  );
}
