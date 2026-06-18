import { z } from 'zod';

/**
 * Input schemas for the auth flows. Shared by the server actions (boundary
 * validation of `FormData`) and available to client components for optimistic
 * checks. Field names match the form `<input name>` and the generated DTOs.
 */

export const signinSchema = z.object({
  username: z.string().trim().min(1),
  password: z.string().min(1),
});

export const googleAuthSchema = z.object({
  idToken: z.string().min(1),
});

export const signupSchema = z.object({
  fullName: z.string().trim().min(1),
  username: z.string().trim().min(1),
  email: z.string().trim().email(),
  password: z.string().min(1),
});

export const otpSchema = z.object({
  email: z.string().trim().email(),
  otp: z.string().trim().min(1),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email(),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1),
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
export type GoogleAuthInput = z.infer<typeof googleAuthSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type OtpInput = z.infer<typeof otpSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
