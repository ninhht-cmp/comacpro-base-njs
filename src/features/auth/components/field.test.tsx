import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Field, FormError } from './field';

describe('Field', () => {
  it('associates the label with the input', () => {
    render(<Field label="Username" name="username" />);
    expect(screen.getByText('Username')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveAttribute('name', 'username');
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
