/**
 * Server-side public API of the users feature. The server *actions* carry their
 * own `'use server'` boundary, so client components import them directly from
 * `../server/actions`; this barrel is for Server Components / Route Handlers.
 */

export type { UserFormState } from './actions';
export { cancelAccount, changePassword, updateProfile } from './actions';
export {
  UserApiError,
  cancelAccount as cancelAccountRequest,
  changePassword as changePasswordRequest,
  updateProfile as updateProfileRequest,
} from './service';
