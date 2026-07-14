/**
 * Curated **domain model** for the user feature — the clean surface the app
 * imports, decoupled from the generated API DTOs. The role/status enums are
 * shared identity primitives (`@/core/identity`); the DTO → domain mapping
 * lives in `./mapper` (the only place that touches the generated layer).
 */

import { UserRole, UserStatus } from '@/core/identity';

export { UserRole, UserStatus };

/** A user profile as the app understands it (not the wire DTO). */
export interface User {
  /** SaleNet user id (UUID string). */
  id: string;
  /** SaleNet usernames are VN phone numbers. */
  username?: string;
  email?: string;
  fullName?: string;
  avatar?: string;
  /** Street-level address; ward/province carry the administrative parts. */
  address?: string;
  ward?: string;
  province?: string;
  phone?: string;
  /** National id (CCCD) — display MASKED (see `maskIdCard`), log never. */
  idCardNumber?: string;
  role?: UserRole;
  referralCode?: string;
  referralUrl?: string;
  ekycVerified?: boolean;
  /** Backend nudges: profile incomplete / password change required. */
  needsProfileUpdate?: boolean;
  needsPasswordChange?: boolean;
}

/** The public referral lookup (`GET /v1/users/referral/{code}`). */
export interface ReferralUser {
  id: string;
  username?: string;
  fullName?: string;
  phone?: string;
  avatar?: string;
  role?: UserRole;
  status?: UserStatus;
  code?: string;
}
