import { z } from 'zod';

/**
 * Input schemas for the auth flows. Shared by the server actions (boundary
 * validation of `FormData`) and available to client components for optimistic
 * checks. Field names match the form `<input name>` and the generated DTOs.
 *
 * SaleNet usernames ARE Vietnamese phone numbers — the regex mirrors the
 * backend's own validation (`(\+84|84|0)[3|5|7|8|9]xxxxxxxx`). The
 * `invalid_phone` / `invalid_name` messages are sentinels mapped to
 * translated messages by `@/lib/forms/field-errors` (same mechanism as
 * `passwords_mismatch`).
 */

export const VN_PHONE_REGEX = /^(\+84|84|0)[35789][0-9]{8}$/;

/**
 * Letters (any script, so Vietnamese diacritics included; `\p{M}` keeps
 * decomposed accents valid) separated by single spaces. Deliberately
 * STRICTER than the backend, which only requires fullName to be a non-empty
 * string — without this, junk like "%&HGVUJH__/" becomes an account name.
 * Mirror it server-side when the backend adds a rule.
 */
export const FULL_NAME_REGEX = /^[\p{L}\p{M}]+(?: [\p{L}\p{M}]+)*$/u;

const fullNameField = z
  .string()
  .trim()
  // Canonicalize before judging: NFC merges decomposed Vietnamese accents,
  // and doubled/odd whitespace collapses to single spaces — the backend
  // then stores the clean form.
  .transform((value) => value.normalize('NFC').replace(/\s+/g, ' '))
  .pipe(z.string().min(1).regex(FULL_NAME_REGEX, { message: 'invalid_name' }));

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

export const forgotPasswordSchema = z.object({
  username: phoneField,
});

/**
 * SaleNet resets the password in ONE verify step:
 * `POST /v1/auth/forgot-password/verify` takes username + OTP + new password.
 */
export const resetPasswordSchema = z
  .object({
    username: phoneField,
    otpCode: z.string().trim().min(1),
    newPassword: z.string().min(1),
    confirmPassword: z.string().min(1),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ['confirmPassword'],
    // Distinguishes a mismatch from an empty field so the action can map it to
    // the `passwords_mismatch` message rather than `missing_fields`.
    message: 'passwords_mismatch',
  });

export type SigninInput = z.infer<typeof signinSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
