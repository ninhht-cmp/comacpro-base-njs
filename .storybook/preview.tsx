import type { Decorator, Preview } from '@storybook/nextjs-vite';
import '../src/styles/globals.css';

// Render every story inside the app's design tokens and let a toolbar switch
// the `.dark` class — so components are reviewed in both themes.
const withTheme: Decorator = (Story, context) => {
  const theme = context.globals.theme === 'dark' ? 'dark' : '';
  // Fullscreen stories (e.g. the sticky header) need a flush, padding-free frame.
  const full = context.parameters.layout === 'fullscreen';
  return (
    <div className={theme}>
      <div
        className={
          full
            ? 'min-h-svh bg-background text-foreground'
            : 'rounded-lg bg-background p-6 text-foreground'
        }
      >
        <Story />
      </div>
    </div>
  );
};

const preview: Preview = {
  parameters: {
    layout: 'centered',
    controls: {
      matchers: { color: /(background|color)$/i, date: /Date$/i },
    },
    a11y: {
      // 'todo' shows violations in the panel; switch to 'error' to fail CI.
      test: 'todo',
    },
  },
  globalTypes: {
    theme: {
      description: 'App theme',
      toolbar: {
        title: 'Theme',
        icon: 'circlehollow',
        items: [
          { value: 'light', title: 'Light', icon: 'sun' },
          { value: 'dark', title: 'Dark', icon: 'moon' },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { theme: 'light' },
  decorators: [withTheme],
};

export default preview;
