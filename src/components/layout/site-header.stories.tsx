import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Button } from '@/components/ui/button';
import { SiteHeader } from './site-header';

const meta = {
  title: 'Layout/SiteHeader',
  component: SiteHeader,
  // Full-bleed so the sticky header sits flush at the top of the canvas.
  parameters: { layout: 'fullscreen' },
  args: {
    brand: (
      <span className="text-base font-semibold tracking-tight">Comacpro</span>
    ),
    nav: (
      <ul className="hidden items-center sm:flex">
        <li>
          <span className="rounded-md px-3 py-1.5 text-sm text-muted-foreground">
            Home
          </span>
        </li>
      </ul>
    ),
    actions: (
      <Button size="sm" variant="default">
        Sign in
      </Button>
    ),
  },
} satisfies Meta<typeof SiteHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/**
 * Scroll the canvas to see the smart behavior: the header hides on scroll-down,
 * reveals on scroll-up, is always shown near the top, and gains a blurred
 * background + border once scrolled.
 */
export const OverScrollableContent: Story = {
  render: (args) => (
    <>
      <SiteHeader {...args} />
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex h-[200vh] flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            Scroll down — the header tucks away; scroll up — it returns.
          </p>
          {Array.from({ length: 12 }, (_, i) => (
            <div key={i} className="rounded-lg border border-border p-6">
              Section {i + 1}
            </div>
          ))}
        </div>
      </div>
    </>
  ),
};
