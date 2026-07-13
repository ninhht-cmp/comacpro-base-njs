import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Field, FormError } from './field';

describe('Field', () => {
  it('associates the label with the input', () => {
    render(<Field label="Username" name="username" />);
    expect(screen.getByText('Username')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveAttribute('name', 'username');
  });

  it('is not marked invalid without an error', () => {
    render(<Field label="Username" name="username" />);
    const input = screen.getByRole('textbox');
    expect(input).not.toHaveAttribute('aria-invalid');
    expect(input).not.toHaveAttribute('aria-describedby');
  });

  it('renders the error and wires up the a11y attributes', () => {
    render(<Field label="Username" name="username" error="Required" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-describedby', 'username-error');
    expect(screen.getByText('Required')).toHaveAttribute(
      'id',
      'username-error',
    );
  });
});

describe('FormError', () => {
  it('renders nothing without a message', () => {
    const { container } = render(<FormError />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders an alert with the message', () => {
    render(<FormError message="Boom" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Boom');
  });
});
