import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import prettierConfig from 'eslint-config-prettier';
// Lints Storybook story files (CSF best practices). See:
// https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from 'eslint-plugin-storybook';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  prettierConfig,
  // Allow anonymous default exports in config files.
  {
    files: ['**/*.config.{js,cjs,mjs,ts}'],
    rules: { 'import/no-anonymous-default-export': 'off' },
  },
  // Feature boundary: outside code may only import a feature via its barrel.
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/features/**', 'src/i18n/navigation.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'next/link',
              message:
                'Use `Link` from `@/i18n/navigation` for locale-aware links.',
            },
          ],
          patterns: [
            {
              // Allow-list: the ONLY public entrypoints are `@/features/<name>`
              // (client-safe barrel — one segment, never matched by `*/**`) and
              // `@/features/<name>/server` (server barrel — re-allowed via the
              // `!` negation). Every other internal path — including directories
              // that don't exist yet — is forbidden by default, so new feature
              // subfolders can't silently leak.
              group: ['@/features/*/**', '!@/features/*/server'],
              message:
                'Import features through their public barrels: `@/features/<name>` (client) or `@/features/<name>/server` (server). Deep imports are forbidden.',
            },
            {
              group: ['next/navigation'],
              importNames: [
                'redirect',
                'permanentRedirect',
                'useRouter',
                'usePathname',
              ],
              message:
                'Use locale-aware equivalents from `@/i18n/navigation` instead of `next/navigation`.',
            },
          ],
        },
      ],
    },
  },
  // Inside a feature, forbid reaching into a sibling feature's internals.
  {
    files: ['src/features/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'next/link',
              message:
                'Use `Link` from `@/i18n/navigation` for locale-aware links.',
            },
          ],
          patterns: [
            {
              // A feature uses relative paths for its own internals; it may
              // reach a sibling only through that sibling's public barrels.
              // Same allow-list as above: everything under `@/features/*/` is
              // banned except the `server` barrel (`@/features/<name>` itself
              // is a single segment, so `*/**` never matches it).
              group: ['@/features/*/**', '!@/features/*/server'],
              message:
                'Cross-feature imports must use the sibling barrel: `@/features/<name>` or `@/features/<name>/server`.',
            },
            {
              group: ['next/navigation'],
              importNames: [
                'redirect',
                'permanentRedirect',
                'useRouter',
                'usePathname',
              ],
              message:
                'Use locale-aware equivalents from `@/i18n/navigation` instead of `next/navigation`.',
            },
          ],
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    'src/lib/api/generated/**',
    // Generated coverage report (Vitest output).
    'coverage/**',
    // Storybook build output.
    'storybook-static/**',
  ]),
  ...storybook.configs['flat/recommended'],
]);

export default eslintConfig;
