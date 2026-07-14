import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HeaderNav } from './header-nav';

// The nav needs a router pathname; stub the locale-aware wrappers with plain
// anchors + a controllable pathname so tests run without a Next router.
const pathname = vi.hoisted(() => ({ current: '/' }));
vi.mock('@/i18n/navigation', () => ({
  usePathname: () => pathname.current,
  Link: ({
    href,
    children,
    ...props
  }: React.ComponentProps<'a'> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const ITEMS = [
  { href: '/about-us' as const, label: 'Về chúng tôi' },
  { href: '/download' as const, label: 'Tải ứng dụng' },
];

describe('HeaderNav', () => {
  it('marks the current section with aria-current', () => {
    pathname.current = '/about-us';
    render(<HeaderNav items={ITEMS} />);
    expect(screen.getByRole('link', { name: 'Về chúng tôi' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(
      screen.getByRole('link', { name: 'Tải ứng dụng' }),
    ).not.toHaveAttribute('aria-current');
  });

  it('treats nested paths as inside their section', () => {
    pathname.current = '/about-us/team';
    render(<HeaderNav items={ITEMS} />);
    expect(screen.getByRole('link', { name: 'Về chúng tôi' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('marks nothing on an unrelated route', () => {
    pathname.current = '/signin';
    render(<HeaderNav items={ITEMS} />);
    for (const link of screen.getAllByRole('link')) {
      expect(link).not.toHaveAttribute('aria-current');
    }
  });
});
