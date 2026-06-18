import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import prettierConfig from 'eslint-config-prettier';

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
    // proxy.ts is middleware-tier: it must import the edge-safe auth modules
    // (`server/session`, `server/service`) directly, bypassing the
    // `next/headers`-laden server barrel.
    ignores: ['src/features/**', 'src/i18n/navigation.ts', 'src/proxy.ts'],
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
              // Allowed public entrypoints: `@/features/<name>` (client-safe
              // barrel) and `@/features/<name>/server` (server barrel). Every
              // other internal path is forbidden.
              group: [
                '@/features/*/components',
                '@/features/*/components/**',
                '@/features/*/schema',
                '@/features/*/schema/**',
                '@/features/*/api',
                '@/features/*/api/**',
                '@/features/*/hooks',
                '@/features/*/hooks/**',
                '@/features/*/server/**',
              ],
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
              // reach a sibling only through that sibling's public barrels
              // (`@/features/<name>` or `@/features/<name>/server`).
              group: [
                '@/features/*/components',
                '@/features/*/components/**',
                '@/features/*/schema',
                '@/features/*/schema/**',
                '@/features/*/api',
                '@/features/*/api/**',
                '@/features/*/hooks',
                '@/features/*/hooks/**',
                '@/features/*/server/**',
              ],
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
    'src/lib/api/**',
    'public/mockServiceWorker.js',
    // Generated coverage report (Vitest/Codecov output).
    'coverage/**',
  ]),
]);

export default eslintConfig;
