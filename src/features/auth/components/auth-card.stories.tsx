import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/form/field';
import { AuthCard } from './auth-card';

const meta = {
  title: 'Auth/AuthCard',
  component: AuthCard,
  tags: ['autodocs'],
  args: {
    title: 'Sign in',
    description: 'Sign in to your SaleNet account.',
  },
  decorators: [
    (Story) => (
      <div className="w-[24rem]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof AuthCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: (
      <form className="flex flex-col gap-4">
        <Field label="Username" name="username" autoComplete="username" />
        <Field label="Password" name="password" type="password" />
        <Button type="submit" className="mt-2">
          Sign in
        </Button>
      </form>
    ),
  },
};

export const WithoutDescription: Story = {
  args: {
    description: undefined,
    children: <p className="text-sm text-muted-foreground">Card body.</p>,
  },
};
