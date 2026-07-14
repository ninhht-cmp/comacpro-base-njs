/**
 * Public (client-safe) API of the notifications feature. Server helpers (the
 * `fetch`-based service, localized via `Content-Language`) live behind
 * `@/modules/notifications/server`.
 */

export { NotificationBell } from './components/notification-bell';
export { NotificationList } from './components/notification-list';

export * from './api';
