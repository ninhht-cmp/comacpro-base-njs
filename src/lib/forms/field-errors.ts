import type { ZodError } from 'zod';

/**
 * The generic field-message vocabulary, shared by all forms (`Auth` namespace).
 * Narrow union (not `string`) so the strictly-typed next-intl translator is
 * assignable and a typo'd key is a compile error.
 */
export type FieldErrorKey =
  | 'errors.passwords_mismatch'
  | 'errors.field_required'
  | 'errors.invalid_email'
  | 'errors.invalid_phone'
  | 'errors.invalid_name'
  | 'errors.field_invalid';

/**
 * Translator shape `fieldErrorsFrom` needs — satisfied by next-intl's `t` on
 * the `Auth` namespace, server (`getTranslations`) or client
 * (`useTranslations`) alike.
 */
export type FieldErrorTranslator = (key: FieldErrorKey) => string;

/**
 * Map a zod boundary-validation error to per-field, ready-to-display messages
 * keyed by the form input `name`. Shared by every feature's Server Actions so
 * forms can highlight the exact offending input (with `aria-invalid` /
 * `aria-describedby`) instead of one generic form-level message.
 */
export function fieldErrorsFrom(
  error: ZodError,
  t: (key: FieldErrorKey) => string,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const name = issue.path[0];
    // First issue per field wins; nested paths don't occur in these flat forms.
    if (typeof name !== 'string' || out[name]) continue;
    out[name] = messageFor(issue, t);
  }
  return out;
}

function messageFor(
  issue: ZodError['issues'][number],
  t: (key: FieldErrorKey) => string,
): string {
  // Schema-authored sentinels (see the auth schemas): deliberate messages,
  // not generic format problems.
  if (issue.message === 'passwords_mismatch') {
    return t('errors.passwords_mismatch');
  }
  if (issue.message === 'invalid_phone') {
    return t('errors.invalid_phone');
  }
  if (issue.message === 'invalid_name') {
    return t('errors.invalid_name');
  }
  switch (issue.code) {
    case 'too_small':
    case 'invalid_type':
      return t('errors.field_required');
    case 'invalid_format':
      // zod v4 reports email/url/regex failures as `invalid_format`.
      return 'format' in issue && issue.format === 'email'
        ? t('errors.invalid_email')
        : t('errors.field_invalid');
    default:
      return t('errors.field_invalid');
  }
}
