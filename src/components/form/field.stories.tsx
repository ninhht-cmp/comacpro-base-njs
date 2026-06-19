import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Field, FormError } from './field';

const meta = {
  title: 'Form/Field',
  component: Field,
  tags: ['autodocs'],
  args: { label: 'Email', name: 'email', placeholder: 'you@example.com' },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Field>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithValue: Story = {
  args: { defaultValue: 'ada@comacpro.com' },
};

export const Password: Story = {
  args: { label: 'Password', name: 'password', type: 'password' },
};

export const WithError: Story = {
  render: (args) => (
    <div className="flex flex-col gap-1.5">
      <Field {...args} aria-invalid />
      <FormError message="Incorrect username or password." />
    </div>
  ),
};
