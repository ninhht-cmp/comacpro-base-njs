import { z } from 'zod';

/**
 * Input schemas for the auth flows. Shared by the server actions (boundary
 * validation of `FormData`) and available to client components for optimistic
 * checks. Field names match the form `<input name>` and the generated DTOs.
 *
 * SaleNet usernames ARE Vietnamese phone numbers — the regex mirrors the
 * backend's own validation (`(\+84|84|0)[3|5|7|8|9]xxxxxxxx`). The
 * `invalid_phone` message is a sentinel mapped to a translated message by
 * `@/lib/forms/field-errors` (same mechanism as `passwords_mismatch`).
 */

export const VN_PHONE_REGEX = /^(\+84|84|0)[35789][0-9]{8}$/;

const phoneField = z
  .string()
  .trim()
  .regex(VN_PHONE_REGEX, { message: 'invalid_phone' });

export const signinSchema = z.object({
  username: phoneField,
  password: z.string().min(1),
});

export const signupSchema = z.object({
  fullName: z.string().trim().min(1),
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
