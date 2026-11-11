// Helpers shared by the /api/users routes (not a route itself).
import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { normalizeRoleKey, SUPER_ROLE } from '@/lib/rbac';
import type { SessionUser } from '@/lib/auth/permissions';

export const USER_STATUSES = ['active', 'inactive', 'pending', 'suspended'] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export const PUBLIC_COLUMNS = 'id, auth_id, name, email, role, image';
export const FULL_COLUMNS = 'id, auth_id, name, email, role, image, status, phone, last_login, created_at, updated_at';

export type UserRow = {
  id: number;
  auth_id: string | null;
  name: string;
  email: string;
  role: string;
  image: string | null;
  status?: string | null;
  phone?: string | null;
  last_login?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export const bad = (error: string, status = 400) => NextResponse.json({ error }, { status });

/** Finds a user by users.id (numeric) or auth_id (UUID). */
export async function findUser(idOrAuthId: string): Promise<UserRow | null> {
  const db = supabaseServer();
  const q = db.from('users').select(FULL_COLUMNS);
  const { data } = await (/^\d+$/.test(idOrAuthId) ? q.eq('id', Number(idOrAuthId)) : q.eq('auth_id', idOrAuthId)).maybeSingle();
  return (data as UserRow | null) ?? null;
}

export function isSelf(actor: SessionUser, target: UserRow) {
  return (!!target.auth_id && target.auth_id === actor.id) || target.email?.toLowerCase() === actor.email?.toLowerCase();
}

/** Only a sysadmin may change a sysadmin account. */
export function guardTarget(actor: SessionUser, target: UserRow) {
  if (normalizeRoleKey(target.role) === SUPER_ROLE && actor.role !== SUPER_ROLE) {
    return bad('Only a system administrator can change this account', 403);
  }
  return null;
}

/** Looks a role up by key or display name. Users store the display name. */
export async function resolveRole(input: unknown) {
  const key = normalizeRoleKey(typeof input === 'string' ? input : null);
  if (!key) return null;
  const { data } = await supabaseServer().from('system_roles').select('role_key, name');
  return (data ?? []).find((r) => r.role_key === key || normalizeRoleKey(r.name) === key) ?? null;
}

/** Only a sysadmin may hand out the sysadmin role. */
export function guardRoleAssignment(actor: SessionUser, roleKey: string) {
  if (roleKey === SUPER_ROLE && actor.role !== SUPER_ROLE) {
    return bad('Only a system administrator can assign this role', 403);
  }
  return null;
}

export function validPassword(p: unknown): p is string {
  return typeof p === 'string' && p.length >= 8;
}
