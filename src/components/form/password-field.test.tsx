import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import Common from '@/i18n/messages/vi/Common.json';
import { PasswordField } from './password-field';

function renderField() {
  return render(
    <NextIntlClientProvider locale="vi" messages={{ Common }}>
      <PasswordField label="Mật khẩu" name="password" />
    </NextIntlClientProvider>,
  );
}

describe('PasswordField', () => {
  it('renders a password input with an accessible show/hide toggle', () => {
    renderField();
    const input = screen.getByLabelText('Mật khẩu');
    expect(input).toHaveAttribute('type', 'password');
    expect(
      screen.getByRole('button', { name: Common.form.showPassword }),
    ).toBeInTheDocument();
  });

  it('toggles reveal on click and back again', async () => {
    const user = userEvent.setup();
    renderField();
    const input = screen.getByLabelText('Mật khẩu');

    await user.click(
      screen.getByRole('button', { name: Common.form.showPassword }),
    );
    expect(input).toHaveAttribute('type', 'text');

    await user.click(
      screen.getByRole('button', { name: Common.form.hidePassword }),
    );
    expect(input).toHaveAttribute('type', 'password');
  });

  it('keeps the toggle out of the tab order (submit stays next after the field)', () => {
    renderField();
    expect(
      screen.getByRole('button', { name: Common.form.showPassword }),
    ).toHaveAttribute('tabindex', '-1');
  });
});
