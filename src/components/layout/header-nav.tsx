'use client';

import type { ComponentProps } from 'react';
import { Link, usePathname } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

export type HeaderNavItem = {
  href: ComponentProps<typeof Link>['href'];
  label: string;
};

/**
 * Desktop primary nav (Claude-docs style): understated text links, the
 * current section lifted to full-contrast foreground with a short underline
 * marker. Client-only because the active state needs `usePathname`; labels
 * are translated by the server layout and passed in, so this stays
 * i18n-agnostic. Hidden below `md` — the compact viewport uses `MobileMenu`.
 */
export function HeaderNav({ items }: { items: HeaderNavItem[] }) {
  const pathname = usePathname();

  return (
    <ul className="hidden items-center gap-1 md:flex">
      {items.map(({ href, label }) => {
        const target = typeof href === 'string' ? href : '';
        const active =
          target !== '' &&
          (pathname === target || pathname.startsWith(`${target}/`));
        return (
          <li key={target || label}>
            <Link
              href={href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'relative rounded-md px-3 py-2 text-sm font-medium transition-colors',
                // Underline marker sits on the header's bottom edge, mirroring
                // the docs' active-tab treatment.
                'after:absolute after:inset-x-3 after:-bottom-px after:h-0.5 after:rounded-full after:bg-primary after:transition-opacity',
                active
                  ? 'text-foreground after:opacity-100'
                  : 'text-muted-foreground after:opacity-0 hover:text-foreground',
              )}
            >
              {label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
