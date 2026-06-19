import { describe, expect, it } from 'vitest';
import { toNotification } from './mapper';
import { NotificationStatus, NotificationType } from './types';

describe('toNotification', () => {
  it('maps numeric type/status to domain enums and defaults isRead', () => {
    const n = toNotification({
      id: 1,
      title: 'Welcome',
      content: 'Xin chào',
      type: 1, // USER
      status: 0, // ACTIVE
    });

    expect(n.type).toBe(NotificationType.User);
    expect(n.status).toBe(NotificationStatus.Active);
    expect(n.isRead).toBe(false);
    expect(n.content).toBe('Xin chào');
  });

  it('preserves an explicit isRead and leaves missing enums undefined', () => {
    const n = toNotification({ id: 2, isRead: true });
    expect(n.isRead).toBe(true);
    expect(n.type).toBeUndefined();
    expect(n.status).toBeUndefined();
  });
});
