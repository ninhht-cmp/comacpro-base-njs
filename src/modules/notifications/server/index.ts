/**
 * Server-side surface of the notifications feature. Import from
 * `@/modules/notifications/server` in Server Components / Route Handlers.
 */

export type { NotificationActionState } from './actions';
export { markNotificationAsRead } from './actions';
export {
  ApiError,
  type NotificationQuery,
  fetchMyNotifications,
  fetchUnreadCount,
  markNotificationRead,
} from './service';
