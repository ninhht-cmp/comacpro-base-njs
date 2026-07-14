import { logger } from '@/lib/observability/logger';
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
 *
 * Deliberately ABSENT: the DTO validator texts ("fullName must be a string",
 * "username must match /^(\+84|84|0)…/", "… should not be empty"). The zod
 * schemas in `../schema` mirror those checks (the FE phone regex is a strict
 * subset of the backend's), so the action returns field errors before the
 * request is ever sent — if one still slips through, the generic fallback +
 * warn log below is the intended safety net.
 */
type KnownErrorKey =
  | 'errors.user_exists'
  | 'errors.no_zalo_account'
  | 'errors.invalid_referral'
  | 'errors.admin_referral'
  | 'errors.too_many_requests';

/** Which auth form the failed call came from (see `stateFromApiError`). */
export type AuthFlow = 'signin' | 'signup';

interface Rule {
  /** Case-insensitive match against the backend's message text. */
  match: RegExp;
  /**
   * Flows the rule applies to; omit when the text is unambiguous everywhere.
   * Needed because the same backend text can mean different things per flow
   * ("User not found" on signup = the REFERRER's account).
   */
  flows?: AuthFlow[];
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
  {
    match: /invalid referral code/i,
    flows: ['signup'],
    field: 'referralCode',
    key: 'errors.invalid_referral',
  },
  {
    // The referral code is the referrer's phone; "User not found" on signup
    // means the referrer's account is gone — same remedy as a bad code. In
    // the other flows the text would mean the VISITOR's account, hence the
    // signup scoping (map those flows separately when the backend confirms).
    match: /user not found/i,
    flows: ['signup'],
    field: 'referralCode',
    key: 'errors.invalid_referral',
  },
  {
    // Deliberately doesn't say "admin" — the visitor can't act on that;
    // asking for an invite link from someone else is the actionable advice.
    match: /cannot register with admin referral code/i,
    flows: ['signup'],
    field: 'referralCode',
    key: 'errors.admin_referral',
  },
  {
    // NestJS throttler, 429: "ThrottlerException: Too Many Requests".
    match: /too many requests/i,
    key: 'errors.too_many_requests',
  },
];

/**
 * Translate a failed service call into user-facing form state. 5xx (incl.
 * SaleNet's "Internal server error!") and non-API failures fall through to
 * the generic message; they are the caller's to log (`logAuthFailure`) —
 * this only decides what the USER sees.
 */
export function stateFromApiError(
  error: unknown,
  t: (key: KnownErrorKey | 'errors.unknown') => string,
  flow: AuthFlow,
): AuthFormState {
  if (error instanceof ApiError && error.status && error.status < 500) {
    for (const rule of KNOWN) {
      if (rule.flows && !rule.flows.includes(flow)) continue;
      if (rule.match.test(error.message)) {
        const message = t(rule.key);
        return rule.field
          ? { fieldErrors: { [rule.field]: message } }
          : { error: message };
      }
    }
    // Expected rejection we don't know yet — the log line is the TODO.
    logger.warn('auth', `unmapped backend rejection: "${error.message}"`);
  }
  return { error: t('errors.unknown') };
}
