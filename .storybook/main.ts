import type { StorybookConfig } from '@storybook/nextjs-vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(ts|tsx)'],
  // Lean addon set: component docs + accessibility checks. (The Vitest/Chromatic
  // /MCP addons from `storybook init` were dropped to keep `pnpm test` fast and
  // Storybook standalone — see vitest.config.ts.)
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y'],
  framework: '@storybook/nextjs-vite',
  staticDirs: ['../public'],
};

export default config;
