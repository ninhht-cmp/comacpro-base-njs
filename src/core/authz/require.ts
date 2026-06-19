import 'server-only';
import { notFound } from 'next/navigation';
import { requireSession } from '@/core/guard/require';
import { type UserType, userTypeFromValue } from '@/core/identity';
import type { SessionData } from '@/core/session';
import { type Permission, can, hasAtLeast } from './policy';

/**
 * Server-side authorization guards for Server Components & actions. Build on
 * `requireSession` (so an unauthenticated user is redirected to sign-in first),
 * then enforce the role/permission. An *authenticated but unauthorized* user
 * gets `notFound()` — admin surfaces stay invisible rather than advertising a
 * 403.
 */

function roleOf(session: SessionData): UserType | undefined {
  return userTypeFromValue(session.user.userType);
}

/** Require at least `min` role; returns the session or 404s. */
export async function requireRole(min: UserType): Promise<SessionData> {
  const session = await requireSession();
  if (!hasAtLeast(roleOf(session), min)) notFound();
  return session;
}

/** Require a specific permission; returns the session or 404s. */
export async function requirePermission(
  permission: Permission,
): Promise<SessionData> {
  const session = await requireSession();
  if (!can(roleOf(session), permission)) notFound();
  return session;
}
