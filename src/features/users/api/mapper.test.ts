import { describe, expect, it } from 'vitest';
import type { ProfileMeResDto, UserRefResDto } from '@/lib/api/generated/model';
import { toReferralUser, toUser } from './mapper';
import { UserRole, UserStatus } from './types';

describe('toUser', () => {
  it('maps the wire profile to the domain user', () => {
    const dto: ProfileMeResDto = {
      id: 'u-123',
      fullName: 'Nguyễn Văn A',
      phoneNumber: '0912345678',
      email: 'a@example.com',
      avatarUrl: 'https://cdn/avatar.png',
      address: 'Hà Nội',
      role: 'sm-saler',
      referralCode: 'REF123',
      isNeedUpdateProfile: true,
    };

    expect(toUser(dto)).toMatchObject({
      id: 'u-123',
      username: '0912345678',
      phone: '0912345678',
      email: 'a@example.com',
      avatar: 'https://cdn/avatar.png',
      role: UserRole['sm-saler'],
      referralCode: 'REF123',
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
