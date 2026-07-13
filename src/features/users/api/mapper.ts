import type { ProfileMeResDto, UserRefResDto } from '@/lib/api/generated/model';
import { roleFromValue, statusFromValue } from '@/core/identity';
import type { ReferralUser, User } from './types';

/**
 * Anti-corruption layer: maps the generated wire DTOs → the domain types.
 * This is the **one** module in the feature allowed to import
 * `@/lib/api/generated`. SaleNet's role/status values are already readable
 * strings; the `*FromValue` helpers validate them (unknown → undefined) so a
 * value the frontend doesn't know yet degrades instead of leaking raw strings
 * into the UI. App code imports `User`/`ReferralUser`, never the DTOs.
 */

export function toUser(dto: ProfileMeResDto): User {
  return {
    id: dto.id,
    username: dto.phoneNumber,
    email: dto.email,
    fullName: dto.fullName,
    avatar: dto.avatarUrl,
    address: dto.address,
    phone: dto.phoneNumber,
    role: roleFromValue(dto.role),
    referralCode: dto.referralCode,
    referralUrl: dto.referralUrl,
    needsProfileUpdate: dto.isNeedUpdateProfile,
    needsPasswordChange: dto.isNeedChangePassword,
  };
}

export function toReferralUser(dto: UserRefResDto): ReferralUser {
  return {
    id: dto.id,
    username: dto.username,
    fullName: dto.profile?.fullName,
    phone: dto.profile?.phoneNumber,
    avatar: dto.profile?.avatarUrl,
    role: roleFromValue(dto.role),
    status: statusFromValue(dto.status),
    code: dto.code,
  };
}
