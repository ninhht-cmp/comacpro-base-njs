import { describe, expect, it } from 'vitest';
import type { NotificationResDto } from '@/lib/api/generated/model';
import { toNotification } from './mapper';

describe('toNotification', () => {
  it('maps the wire DTO to the domain notification', () => {
    const dto: NotificationResDto = {
      id: 'n-1',
      isRead: false,
      event: 'WELCOME_TO_NEW_MEMBER',
      pageUrl: '/account',
      description: 'Chào mừng bạn đến với SaleNet',
      createdAt: '2026-07-13T08:00:00.000Z',
    };

    expect(toNotification(dto)).toEqual({
      id: 'n-1',
      description: 'Chào mừng bạn đến với SaleNet',
      pageUrl: '/account',
      event: 'WELCOME_TO_NEW_MEMBER',
      createdAt: '2026-07-13T08:00:00.000Z',
      isRead: false,
    });
  });

  it('preserves an explicit isRead', () => {
    const dto: NotificationResDto = {
      id: 'n-2',
      isRead: true,
      event: 'DEAL_UPDATED_SUCCESS',
      pageUrl: '/deals/1',
      description: 'Deal đã cập nhật',
      createdAt: '2026-07-13T08:00:00.000Z',
    };
    expect(toNotification(dto).isRead).toBe(true);
  });
});
