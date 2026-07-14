import type { ZodError } from 'zod';
import type { FullNameReason } from '@/lib/full-name';

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
  | 'errors.field_invalid'
  | 'errors.name_too_short'
  | 'errors.name_too_long'
  | 'errors.name_contains_link'
  | 'errors.name_contains_digits'
  | 'errors.name_invalid_chars'
  | 'errors.name_profanity'
  | 'errors.name_not_real';

/**
 * `name_<reason>` sentinels from the signup schema's full-name validation
 * (`@/lib/full-name`), one message per actionable reason. The four "this
 * isn't a real name" reasons share one message on purpose: telling a spammer
 * WHICH heuristic caught them is a walkthrough for evading it.
 */
const NAME_SENTINELS: Record<`name_${FullNameReason}`, FieldErrorKey> = {
  name_empty: 'errors.field_required',
  name_too_short: 'errors.name_too_short',
  name_too_long: 'errors.name_too_long',
  name_contains_link: 'errors.name_contains_link',
  name_contains_digits: 'errors.name_contains_digits',
  name_invalid_chars: 'errors.name_invalid_chars',
  name_profanity: 'errors.name_profanity',
  name_number_word_spam: 'errors.name_not_real',
  name_repeated_chars: 'errors.name_not_real',
  name_gibberish: 'errors.name_not_real',
  name_not_a_name: 'errors.name_not_real',
};

function isNameSentinel(
  message: string,
): message is keyof typeof NAME_SENTINELS {
  return message in NAME_SENTINELS;
}

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
  if (isNameSentinel(issue.message)) {
    return t(NAME_SENTINELS[issue.message]);
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
