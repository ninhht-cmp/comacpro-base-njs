import type { AuthFormState } from './actions';
import { ApiError } from './service';

/**
 * Backend-rejection dictionary. SaleNet 4xx bodies carry raw English
 * internals ("User already exists") — those must NEVER reach the UI. Known
 * texts map to a translated message, attached to the offending field when we
 * know it (the form then highlights + focuses that input); anything unmapped
 * shows the generic message and logs the raw text so this list can grow.
 *
 * Add a rule per newly observed backend text — the `key` union keeps the
 * translation honest (a typo'd or missing key is a compile error).
 */
type KnownErrorKey = 'errors.user_exists' | 'errors.no_zalo_account';

interface Rule {
  /** Case-insensitive match against the backend's message text. */
  match: RegExp;
  /** Input `name` to pin the message to; omit for a form-level error. */
  field?: string;
  key: KnownErrorKey;
}

const KNOWN: Rule[] = [
  {
    match: /user already exists/i,
    field: 'username',
    key: 'errors.user_exists',
  },
  {
    // Credentials are delivered via ZaloOA — a Zalo-less number can't finish
    // signup, so the message must tell the user to use a different number.
    match: /phone number does not have a zalo account/i,
    field: 'username',
    key: 'errors.no_zalo_account',
  },
];

/**
 * Translate a failed service call into user-facing form state. 5xx and
 * non-API failures are the caller's to log (`logAuthFailure`) — this only
 * decides what the USER sees.
 */
export function stateFromApiError(
  error: unknown,
  t: (key: KnownErrorKey | 'errors.unknown') => string,
): AuthFormState {
  if (error instanceof ApiError && error.status && error.status < 500) {
    for (const rule of KNOWN) {
      if (rule.match.test(error.message)) {
        const message = t(rule.key);
        return rule.field
          ? { fieldErrors: { [rule.field]: message } }
          : { error: message };
      }
    }
    // Expected rejection we don't know yet — the log line is the TODO.
    console.warn(`[auth] unmapped backend rejection: "${error.message}"`);
  }
  return { error: t('errors.unknown') };
}
