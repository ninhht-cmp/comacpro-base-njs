import 'server-only';
import { notFound } from 'next/navigation';
import { requireSession } from '@/core/guard/require';
import { type UserRole, roleFromValue } from '@/core/identity';
import type { SessionData } from '@/core/session';
import { type Permission, can, isStaff } from './policy';

/**
 * Server-side authorization guards for Server Components & actions. Build on
 * `requireSession` (so an unauthenticated user is redirected to sign-in first),
 * then enforce the role/permission. An *authenticated but unauthorized* user
 * gets `notFound()` — admin surfaces stay invisible rather than advertising a
 * 403.
 */

function roleOf(session: SessionData): UserRole | undefined {
  return roleFromValue(session.user.role);
}

/** Require a back-office staff role; returns the session or 404s. */
export async function requireStaff(): Promise<SessionData> {
  const session = await requireSession();
  if (!isStaff(roleOf(session))) notFound();
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
