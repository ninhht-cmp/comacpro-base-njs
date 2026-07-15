import { describe, expect, it } from 'vitest';
import type {
  ProfileMeResDto,
  ReferralListItemDto,
  UserRefResDto,
} from '@/lib/api/generated/model';
import { toReferralMember, toReferralUser, toUser } from './mapper';
import { UserRole, UserStatus } from './types';

describe('toUser', () => {
  it('maps the wire profile to the domain user', () => {
    const dto: ProfileMeResDto = {
      id: 'u-123',
      fullName: 'Nguyễn Văn A',
      phoneNumber: '0912345678',
      email: 'a@example.com',
      avatarUrl: 'https://cdn/avatar.png',
      address: '210 Lê Trọng Tấn',
      ward: { id: 'w-1', name: 'Phường Phương Liệt', provinceId: 'p-1' },
      province: { id: 'p-1', name: 'Hà Nội', countryId: 'vn' },
      idCardNumber: '001203012345',
      role: 'sm-saler',
      referralCode: 'REF123',
      isEKYCVerified: true,
      isNeedUpdateProfile: true,
    };

    expect(toUser(dto)).toMatchObject({
      id: 'u-123',
      username: '0912345678',
      phone: '0912345678',
      email: 'a@example.com',
      avatar: 'https://cdn/avatar.png',
      address: '210 Lê Trọng Tấn',
      // Names only — the administrative ids stay behind the boundary.
      ward: 'Phường Phương Liệt',
      province: 'Hà Nội',
      idCardNumber: '001203012345',
      role: UserRole['sm-saler'],
      referralCode: 'REF123',
      ekycVerified: true,
      needsProfileUpdate: true,
    });
  });

  it('degrades an unknown role to undefined instead of leaking it', () => {
    const dto = {
      id: 'u-1',
      fullName: 'X',
      role: 'sm-brand-new-role',
    } as unknown as ProfileMeResDto;

    expect(toUser(dto).role).toBeUndefined();
  });
});

describe('toReferralUser', () => {
  it('maps the referral lookup including the nested profile', () => {
    const dto: UserRefResDto = {
      id: 'u-9',
      username: '0987654321',
      role: 'sm-leader',
      status: 'active',
      code: 'ABC',
      profile: {
        id: 'p-9',
        fullName: 'Trần B',
        phoneNumber: '0987654321',
        avatarUrl: 'https://cdn/b.png',
      },
    };

    expect(toReferralUser(dto)).toEqual({
      id: 'u-9',
      username: '0987654321',
      fullName: 'Trần B',
      phone: '0987654321',
      avatar: 'https://cdn/b.png',
      role: UserRole['sm-leader'],
      status: UserStatus.active,
      code: 'ABC',
    });
  });
});

describe('toReferralMember', () => {
  it('maps a full referral list item, flattening the profile', () => {
    const dto: ReferralListItemDto = {
      role: 'sm-member',
      dealCount: 4,
      profile: {
        id: 'm-1',
        fullName: 'Lê Văn C',
        phoneNumber: '0911222333',
        avatarUrl: 'https://cdn/c.png',
        createdAt: '2026-07-01T00:00:00.000Z',
        isEKYCVerified: true,
        province: { id: 'p1', name: 'Hà Nội', countryId: 'vn' },
      },
    };

    expect(toReferralMember(dto)).toEqual({
      id: 'm-1',
      fullName: 'Lê Văn C',
      phone: '0911222333',
      avatar: 'https://cdn/c.png',
      role: UserRole['sm-member'],
      joinedAt: '2026-07-01T00:00:00.000Z',
      province: 'Hà Nội',
      ekycVerified: true,
      dealCount: 4,
    });
  });

  it('degrades gracefully on a minimal item (only required fields)', () => {
    const dto: ReferralListItemDto = {
      role: 'sm-member',
      profile: {
        id: 'm-2',
        fullName: 'Người Mới',
        createdAt: '2026-07-10T00:00:00.000Z',
      },
    };

    const member = toReferralMember(dto);
    expect(member.fullName).toBe('Người Mới');
    expect(member.phone).toBeUndefined();
    expect(member.province).toBeUndefined();
    expect(member.dealCount).toBeUndefined();
  });
});
