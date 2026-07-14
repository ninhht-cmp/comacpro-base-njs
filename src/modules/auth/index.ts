/**
 * Public (client-safe) API of the auth feature. Import UI and isomorphic
 * schemas from `@/modules/auth`.
 *
 * Server-only helpers (session cookies, the `fetch`-based service, server
 * actions used outside a form) live behind `@/modules/auth/server`.
 */

export { AuthCard } from './components/auth-card';
export { LogoutButton } from './components/logout-button';
export { HonorMedals } from './components/honor-medals';
export { ReferrerBlock } from './components/referrer-block';
export { SignupAboutSection } from './components/signup-about';
export { SignupSuccessCard } from './components/signup-success-card';
export { SigninForm } from './components/signin-form';
export { SignupForm } from './components/signup-form';
export { UserMenu } from './components/user-menu';

export * from './schema';
