/**
 * Curated **domain model** for the user feature — the clean surface the app
 * imports, decoupled from the generated API DTOs (`UserResDto` & its
 * `NUMBER_0/1/2` enums). The role/status enums are shared identity primitives
 * (`@/core/identity`); the DTO → domain mapping lives in `./mapper` (the only
 * place that touches the generated layer).
 */

import { UserStatus, UserType } from '@/core/identity';

export { UserStatus, UserType };

/** A user profile as the app understands it (not the wire DTO). */
export interface User {
  id: number;
  username?: string;
  email?: string;
  fullName?: string;
  avatar?: string;
  address?: string;
  phone?: string;
  type?: UserType;
  status?: UserStatus;
  createdAt?: string;
  lastLoginAt?: string;
}
