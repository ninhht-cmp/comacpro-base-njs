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
              group: ['@/features/*/*'],
              message:
                'Import features through their public barrel: `@/features/<name>`. Deep imports are forbidden.',
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
              group: ['@/features/*/*'],
              message:
                'Cross-feature imports must use the sibling feature barrel: `@/features/<name>`.',
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
  ]),
]);

export default eslintConfig;
