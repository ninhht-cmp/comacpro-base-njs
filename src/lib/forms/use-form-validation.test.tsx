import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { z } from 'zod';
import { useFormValidation } from './use-form-validation';
import type { FieldErrorKey } from './field-errors';

const schema = z.object({
  username: z
    .string()
    .trim()
    .regex(/^0\d{9}$/, { message: 'invalid_phone' }),
});

// Identity translator: assertions read the raw keys.
const t = (key: FieldErrorKey) => key;

function TestForm({
  serverErrors,
  onAction,
}: {
  serverErrors?: Record<string, string>;
  onAction?: () => void;
}) {
  const { errors, formProps } = useFormValidation(schema, { serverErrors, t });
  return (
    <form {...formProps} action={onAction}>
      <input name="username" aria-label="phone" />
      {errors.username ? <p role="alert">{errors.username}</p> : null}
      <button type="submit">go</button>
    </form>
  );
}

describe('useFormValidation', () => {
  it('shows an error on blur of a filled invalid field, clears it while typing a fix', async () => {
    const user = userEvent.setup();
    render(<TestForm />);
    const input = screen.getByLabelText('phone');

    // The regression case: typing in an ERRORED field re-validates via the
    // change handler (the synthetic event must be read inside the dispatch).
    await user.type(input, 'abc');
    await user.tab(); // blur -> punish late
    expect(screen.getByRole('alert')).toHaveTextContent('errors.invalid_phone');

    await user.clear(input);
    await user.type(input, '0912345678'); // reward early: clears mid-typing
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('stays quiet when tabbing through an empty field', async () => {
    const user = userEvent.setup();
    render(<TestForm />);
    await user.click(screen.getByLabelText('phone'));
    await user.tab();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('blocks submit on invalid data and focuses the field', async () => {
    const user = userEvent.setup();
    const action = vi.fn();
    render(<TestForm onAction={action} />);

    await user.click(screen.getByRole('button'));
    expect(action).not.toHaveBeenCalled();
    // Empty inputs still submit as "" — that fails the regex, not `required`.
    expect(screen.getByRole('alert')).toHaveTextContent('errors.invalid_phone');
    expect(screen.getByLabelText('phone')).toHaveFocus();
  });

  it('adopts server errors and focuses the offending field', async () => {
    const { rerender } = render(<TestForm />);
    rerender(<TestForm serverErrors={{ username: 'taken' }} />);
    expect(await screen.findByRole('alert')).toHaveTextContent('taken');
    expect(screen.getByLabelText('phone')).toHaveFocus();
  });
});
