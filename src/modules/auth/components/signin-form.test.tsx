import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import Auth from '@/i18n/messages/vi/Auth.json';
import Common from '@/i18n/messages/vi/Common.json';
import { SigninForm } from './signin-form';

vi.mock('@/i18n/navigation', () => ({
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

// The server action never runs in these render-level tests; stub it so the
// module graph doesn't pull `next/headers` into jsdom.
vi.mock('../server/actions', () => ({
  signin: vi.fn(async () => ({})),
}));

function renderForm() {
  return render(
    <NextIntlClientProvider locale="vi" messages={{ Auth, Common }}>
      <SigninForm />
    </NextIntlClientProvider>,
  );
}

describe('SigninForm', () => {
  it('renders a numeric phone field that autofocuses', () => {
    renderForm();
    const phone = screen.getByLabelText(Auth.username);
    expect(phone).toHaveAttribute('type', 'tel');
    expect(phone).toHaveAttribute('inputmode', 'numeric');
    expect(phone).toHaveFocus();
  });

  it('offers a password reveal toggle', async () => {
    const user = userEvent.setup();
    renderForm();
    const password = screen.getByLabelText(Auth.password);
    expect(password).toHaveAttribute('type', 'password');
    await user.click(
      screen.getByRole('button', { name: Common.form.showPassword }),
    );
    expect(password).toHaveAttribute('type', 'text');
  });

  it('hints in-app password reset (no dead link) and routes new users to the app', () => {
    renderForm();
    // Recovery lives in the mobile app — a static hint, deliberately NOT a link.
    expect(screen.getByText(Auth.forgot.inApp)).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /quên mật khẩu/i })).toBeNull();
    // Signup is invite-only — the "no account" path goes to the app download.
    expect(
      screen.getByRole('link', { name: Auth.links.getApp }),
    ).toHaveAttribute('href', '/download');
  });
});
