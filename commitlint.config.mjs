/**
 * Conventional Commits. Scope is optional and free-form but must be kebab-case.
 * Type set, subject casing and length limits come from config-conventional.
 * @see https://www.conventionalcommits.org
 * @type {import("@commitlint/types").UserConfig}
 */
export default {
  extends: ['@commitlint/config-conventional'],
  helpUrl: 'https://www.conventionalcommits.org/en/v1.0.0/#summary',
  rules: {
    'scope-case': [2, 'always', 'kebab-case'],
  },
};
