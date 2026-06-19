import {
  EUserStatus,
  EUserType,
  type UserResDto,
} from '@/lib/api/generated/model';
import { type User, UserStatus, UserType } from './types';

/**
 * Anti-corruption layer: maps the generated wire DTO → the domain {@link User}.
 * This is the **one** module allowed to import `@/lib/api/generated`. Because the
 * lookup tables are keyed by the generated enums, a backend contract change (e.g.
 * a new role) breaks this file at compile time — drift is caught here, not in the
 * UI. App code imports `User`/`UserType`/`UserStatus`, never the DTO.
 */

const USER_TYPE_BY_DTO: Record<EUserType, UserType> = {
  [EUserType.NUMBER_0]: UserType.SuperAdmin,
  [EUserType.NUMBER_1]: UserType.Admin,
  [EUserType.NUMBER_2]: UserType.User,
};

const USER_STATUS_BY_DTO: Record<EUserStatus, UserStatus> = {
  [EUserStatus.NUMBER_0]: UserStatus.Active,
  [EUserStatus.NUMBER_1]: UserStatus.Inactive,
  [EUserStatus.NUMBER_2]: UserStatus.Blocked,
};

export function toUser(dto: UserResDto): User {
  return {
    id: dto.id,
    username: dto.username,
    email: dto.email,
    fullName: dto.fullName,
    avatar: dto.avatar,
    address: dto.address,
    phone: dto.phone,
    type: dto.type === undefined ? undefined : USER_TYPE_BY_DTO[dto.type],
    status:
      dto.status === undefined ? undefined : USER_STATUS_BY_DTO[dto.status],
    createdAt: dto.createdAt,
    lastLoginAt: dto.lastLoginAt,
  };
}
