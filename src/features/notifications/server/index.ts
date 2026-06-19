/**
 * Server-side surface of the notifications feature. Import from
 * `@/features/notifications/server` in Server Components / Route Handlers.
 */

export type { NotificationActionState } from './actions';
export { markNotificationAsRead } from './actions';
export {
  NotificationApiError,
  type NotificationQuery,
  fetchMyNotifications,
  fetchUnreadCount,
  markNotificationRead,
} from './service';
