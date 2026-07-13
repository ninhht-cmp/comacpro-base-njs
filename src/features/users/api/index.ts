/**
 * Curated API facade for the users domain. App code imports the domain model
 * and mapper from here (via the feature barrel `@/features/users`) — never the
 * generated client directly.
 */
export * from './types';
export { toReferralUser, toUser } from './mapper';
