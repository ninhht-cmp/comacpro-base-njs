import { z } from 'zod';
import { normalizeFullName, validateFullName } from '@/lib/full-name';

/**
 * Input schemas for the auth flows. Shared by the server actions (boundary
 * validation of `FormData`) and available to client components for optimistic
 * checks. Field names match the form `<input name>` and the generated DTOs.
 *
 * SaleNet usernames ARE Vietnamese phone numbers — the regex mirrors the
 * backend's own validation (`(\+84|84|0)[3|5|7|8|9]xxxxxxxx`). The
 * `invalid_phone` / `name_*` messages are sentinels mapped to translated
 * messages by `@/lib/forms/field-errors` (same mechanism as
 * `passwords_mismatch`).
 */

const VN_PHONE_REGEX = /^(\+84|84|0)[35789][0-9]{8}$/;

/**
 * Anti-junk name validation ported from the production referral app — see
 * `@/lib/full-name` for the rules (links, digits, profanity, spelled-out
 * numbers, gibberish…). Deliberately STRICTER than the backend, which only
 * requires fullName to be a non-empty string. The transform persists the
 * canonical form (NFC, smart quotes folded, whitespace collapsed) so the
 * backend stores what was validated.
 */
const fullNameField = z
  .string()
  .transform(normalizeFullName)
  .superRefine((value, ctx) => {
    const { valid, reason } = validateFullName(value);
    if (!valid && reason) {
      // `name_<reason>` sentinels; translated in `@/lib/forms/field-errors`.
      ctx.addIssue({ code: 'custom', message: `name_${reason}` });
    }
  });

const phoneField = z
  .string()
  .trim()
  // Normalize before judging: people type/paste phones as "090 123 4567",
  // "090.123.4567" or "(+84) 90…" — strip the separators instead of rejecting
  // them; the backend then receives the canonical form.
  .transform((value) => value.replace(/[\s.()-]/g, ''))
  .pipe(z.string().regex(VN_PHONE_REGEX, { message: 'invalid_phone' }));

export const signinSchema = z.object({
  username: phoneField,
  password: z.string().min(1),
});

export const signupSchema = z.object({
  fullName: fullNameField,
  username: phoneField,
  referralCode: z.string().trim().min(1),
});

export type SigninInput = z.infer<typeof signinSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
