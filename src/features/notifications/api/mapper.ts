import type { NotificationResDto } from '@/lib/api/generated/model';
import type { Notification } from './types';

/**
 * Anti-corruption mapping: generated wire DTO → domain {@link Notification}.
 * SaleNet's `event` is a generated string union re-exported by `./types`, so
 * a new backend event widens the type here at compile time rather than
 * leaking an unknown string into the UI unnoticed.
 */

export function toNotification(dto: NotificationResDto): Notification {
  return {
    id: dto.id,
    description: dto.description,
    pageUrl: dto.pageUrl,
    event: dto.event,
    createdAt: dto.createdAt,
    isRead: dto.isRead,
  };
}
