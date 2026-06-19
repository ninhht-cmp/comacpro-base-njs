import {
  ENotificationStatus,
  ENotificationType,
  type NotificationResDto,
} from '@/lib/api/generated/model';
import {
  type Notification,
  NotificationStatus,
  NotificationType,
} from './types';

/**
 * Anti-corruption mapping: generated wire DTO → domain {@link Notification}.
 * The lookup tables are keyed by the generated enums, so a backend contract
 * change fails here at compile time rather than leaking into the UI.
 */

const TYPE_BY_DTO: Record<ENotificationType, NotificationType> = {
  [ENotificationType.NUMBER_0]: NotificationType.All,
  [ENotificationType.NUMBER_1]: NotificationType.User,
};

const STATUS_BY_DTO: Record<ENotificationStatus, NotificationStatus> = {
  [ENotificationStatus.NUMBER_0]: NotificationStatus.Active,
  [ENotificationStatus.NUMBER_1]: NotificationStatus.Inactive,
};

export function toNotification(dto: NotificationResDto): Notification {
  return {
    id: dto.id,
    title: dto.title,
    content: dto.content,
    sendDate: dto.sendDate,
    createdAt: dto.createdAt,
    type: dto.type === undefined ? undefined : TYPE_BY_DTO[dto.type],
    status: dto.status === undefined ? undefined : STATUS_BY_DTO[dto.status],
    isRead: dto.isRead ?? false,
  };
}
