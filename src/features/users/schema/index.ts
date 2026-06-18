import { z } from 'zod';

/**
 * Input schemas for the user account flows. Shared by the server actions
 * (boundary validation of `FormData`) and available to client components.
 * Field names match the form `<input name>` and the generated DTOs
 * (`UpdateProfileDto`, `ChangePasswordDto`).
 */

export const updateProfileSchema = z.object({
  fullName: z.string().trim().min(1),
  email: z.string().trim().email(),
  // Optional free-text; an empty input is treated as "no address".
  address: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value : undefined)),
});

export const changePasswordSchema = z
  .object({
    oldPassword: z.string().min(1),
    newPassword: z.string().min(1),
    confirmPassword: z.string().min(1),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ['confirmPassword'],
    // Distinguishes a mismatch from an empty field so the action can map it to
    // the `passwords_mismatch` message rather than `missing_fields`.
    message: 'passwords_mismatch',
  });

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
