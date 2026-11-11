// src/lib/auth/permissions.ts — server-side RBAC (API routes, server components)
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { supabaseServer } from '@/lib/supabase/server';
import {
  can,
  normalizePermissions,
  normalizeRoleKey,
  type Action,
  type ModuleKey,
  type Permissions,
} from '@/lib/rbac';

export interface SessionUser {
  id: string;
  email: string;
  name?: string | null;
  role: string | null; // normalised role key, e.g. "cabinet_secretary"
  permissions: Permissions;
}

// Small in-memory cache so every API call doesn't hit system_roles.
const CACHE_MS = 30_000;
const cache = new Map<string, { at: number; perms: Permissions }>();

export function invalidateRolePermissions(roleKey?: string) {
  if (roleKey) cache.delete(roleKey);
  else cache.clear();
}

export async function getRolePermissions(roleKey: string | null): Promise<Permissions> {
  if (!roleKey) return {};
  const hit = cache.get(roleKey);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.perms;
  const { data, error } = await supabaseServer()
    .from('system_roles')
    .select('permissions')
    .eq('role_key', roleKey)
    .maybeSingle();
  if (error) console.error('RBAC: could not load role permissions', error.message);
  const perms = normalizePermissions(data?.permissions);
  cache.set(roleKey, { at: Date.now(), perms });
  return perms;
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await getServerSession(authOptions);
  const u = session?.user as { id?: string; email?: string; name?: string; role?: string } | undefined;
  if (!u?.id && !u?.email) return null;
  const role = normalizeRoleKey(u.role);
  return {
    id: String(u.id ?? ''),
    email: String(u.email ?? ''),
    name: u.name,
    role,
    permissions: await getRolePermissions(role),
  };
}

export function userCan(user: SessionUser | null, module: ModuleKey, action: Action = 'view') {
  return !!user && can(user.role, user.permissions, module, action);
}

type Guard = { user: SessionUser; error?: undefined } | { user?: undefined; error: NextResponse };

/** Signed-in check only. `const g = await requireUser(); if (g.error) return g.error;` */
export async function requireUser(): Promise<Guard> {
  const user = await getSessionUser();
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  return { user };
}

/** Signed-in + permission. `const g = await requireAccess('meetings', 'create'); if (g.error) return g.error;` */
export async function requireAccess(module: ModuleKey, action: Action = 'view'): Promise<Guard> {
  const g = await requireUser();
  if (g.error) return g;
  if (!userCan(g.user, module, action)) {
    return { error: NextResponse.json({ error: `Forbidden: requires ${module}.${action}` }, { status: 403 }) };
  }
  return g;
}

/** Maps an HTTP method to the action it needs. */
export function actionForMethod(method: string): Action {
  switch (method.toUpperCase()) {
    case 'POST':
      return 'create';
    case 'PUT':
    case 'PATCH':
      return 'edit';
    case 'DELETE':
      return 'delete';
    default:
      return 'view';
  }
}

/* ---- Backwards-compatible helpers used by older code ------------------ */

export async function getUserRole() {
  return (await getSessionUser())?.role ?? null;
}

export async function hasServerPermission(module: string, permission: string) {
  const user = await getSessionUser();
  const action = (normalizePermissions({ [module]: [permission] })[module as ModuleKey]?.[0] ?? 'view') as Action;
  return userCan(user, module as ModuleKey, action);
}

export async function hasServerPermissionKey(permissionKey: string) {
  const i = permissionKey.lastIndexOf('_');
  return hasServerPermission(permissionKey.slice(0, i), permissionKey.slice(i + 1));
}

const roleHierarchy: Record<string, number> = {
  president: 1,
  deputy_president: 2,
  prime_cabinet_secretary: 3,
  cabinet_secretariat: 4,
  attorney_general: 5,
  cabinet_secretary: 6,
  principal_secretary: 7,
  director: 8,
  assistant_director: 9,
  co_officer: 10,
  sysadmin: 11,
  admin: 12,
};

export async function isRoleAtLeast(minRole: string) {
  const role = await getUserRole();
  if (!role) return false;
  const cur = roleHierarchy[role];
  const req = roleHierarchy[minRole];
  return !!cur && !!req && cur <= req;
}
