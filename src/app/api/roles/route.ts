// /api/roles — list, create, update and delete roles (table system_roles).
//   GET    roles.view   (also allowed with users.edit, so the user form can offer a role picker)
//   POST   roles.create
//   PUT    roles.edit
//   DELETE roles.delete  (?roleKey=…; never system roles or roles still assigned to users)
// Permissions are always stored normalised: { [module]: Action[] }.
import { NextRequest, NextResponse } from 'next/server';
import { invalidateRolePermissions, requireAccess, requireUser, userCan } from '@/lib/auth/permissions';
import { normalizePermissions, normalizeRoleKey, SUPER_ROLE } from '@/lib/rbac';
import { supabaseServer } from '@/lib/supabase/server';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

type RoleRow = {
  id: number;
  role_key: string;
  name: string;
  description: string | null;
  hierarchy_level: number | null;
  is_system_role: boolean | null;
  permissions: unknown;
};

function shape(r: RoleRow, userCount = 0) {
  return {
    id: r.id,
    roleKey: r.role_key,
    name: r.name,
    description: r.description ?? '',
    hierarchy: r.hierarchy_level ?? 0,
    isSystemRole: !!r.is_system_role,
    permissions: normalizePermissions(r.permissions),
    userCount,
  };
}

export async function GET() {
  const g = await requireUser();
  if (g.error) return g.error;
  if (!userCan(g.user, 'roles', 'view') && !userCan(g.user, 'users', 'edit') && !userCan(g.user, 'users', 'create')) {
    return NextResponse.json({ error: 'Forbidden: requires roles.view' }, { status: 403 });
  }

  const db = supabaseServer();
  const [{ data: roles, error }, { data: users }] = await Promise.all([
    db.from('system_roles').select('*').order('hierarchy_level', { ascending: true }),
    db.from('users').select('role'),
  ]);
  if (error) {
    console.error('GET /api/roles:', error.message);
    return NextResponse.json({ error: 'Failed to load roles' }, { status: 500 });
  }

  const counts: Record<string, number> = {};
  for (const u of users ?? []) {
    const k = normalizeRoleKey(u.role);
    if (k) counts[k] = (counts[k] ?? 0) + 1;
  }
  // Users store the display name ("Cabinet Secretary"); also count by name for custom roles.
  return NextResponse.json(
    (roles as RoleRow[]).map((r) => shape(r, counts[r.role_key] ?? counts[normalizeRoleKey(r.name) ?? ''] ?? 0)),
  );
}

export async function POST(request: NextRequest) {
  const g = await requireAccess('roles', 'create');
  if (g.error) return g.error;

  const body = await request.json().catch(() => ({}));
  const name = String(body.name ?? '').trim();
  const roleKey = normalizeRoleKey(body.roleKey || name)?.replace(/[^a-z0-9_]/g, '');
  if (!name || !roleKey) return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  if (roleKey === SUPER_ROLE) return NextResponse.json({ error: 'That key is reserved' }, { status: 400 });

  const db = supabaseServer();
  const { data: existing } = await db.from('system_roles').select('id').eq('role_key', roleKey).maybeSingle();
  if (existing) return NextResponse.json({ error: 'A role with this key already exists' }, { status: 409 });

  const { data: maxRow } = await db
    .from('system_roles')
    .select('hierarchy_level')
    .order('hierarchy_level', { ascending: false })
    .limit(1)
    .maybeSingle();
  const hierarchy =
    Number.isFinite(Number(body.hierarchy)) && Number(body.hierarchy) > 0
      ? Number(body.hierarchy)
      : (maxRow?.hierarchy_level ?? 0) + 1;

  const permissions = normalizePermissions(body.permissions);
  const { data, error } = await db
    .from('system_roles')
    .insert({
      role_key: roleKey,
      name,
      description: String(body.description ?? ''),
      hierarchy_level: hierarchy,
      is_system_role: false,
      permissions,
    })
    .select()
    .single();
  if (error) {
    console.error('POST /api/roles:', error.message);
    return NextResponse.json({ error: 'Failed to create role' }, { status: 500 });
  }

  await logAudit(g.user, 'ROLE_CREATE', 'role', data.id, { roleKey, permissions });
  return NextResponse.json(shape(data as RoleRow), { status: 201 });
}

export async function PUT(request: NextRequest) {
  const g = await requireAccess('roles', 'edit');
  if (g.error) return g.error;

  const body = await request.json().catch(() => ({}));
  const roleKey = normalizeRoleKey(body.roleKey);
  if (!roleKey) return NextResponse.json({ error: 'roleKey is required' }, { status: 400 });

  const db = supabaseServer();
  const { data: existing } = await db.from('system_roles').select('*').eq('role_key', roleKey).maybeSingle();
  if (!existing) return NextResponse.json({ error: 'Role not found' }, { status: 404 });

  // Only a sysadmin may change the sysadmin role itself (it always has full access anyway).
  if (roleKey === SUPER_ROLE && g.user.role !== SUPER_ROLE) {
    return NextResponse.json({ error: 'Only a system administrator can change this role' }, { status: 403 });
  }

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (typeof body.name === 'string' && body.name.trim()) patch.name = body.name.trim();
  if (typeof body.description === 'string') patch.description = body.description;
  if (body.hierarchy !== undefined && Number.isFinite(Number(body.hierarchy))) patch.hierarchy_level = Number(body.hierarchy);
  if (body.permissions !== undefined) patch.permissions = normalizePermissions(body.permissions);

  const { data, error } = await db.from('system_roles').update(patch).eq('role_key', roleKey).select().single();
  if (error) {
    console.error('PUT /api/roles:', error.message);
    return NextResponse.json({ error: 'Failed to update role' }, { status: 500 });
  }

  invalidateRolePermissions(roleKey);
  await logAudit(g.user, 'ROLE_UPDATE', 'role', data.id, {
    roleKey,
    before: normalizePermissions(existing.permissions),
    after: patch.permissions,
  });
  return NextResponse.json(shape(data as RoleRow));
}

export async function DELETE(request: NextRequest) {
  const g = await requireAccess('roles', 'delete');
  if (g.error) return g.error;

  const roleKey = normalizeRoleKey(new URL(request.url).searchParams.get('roleKey'));
  if (!roleKey) return NextResponse.json({ error: 'roleKey is required' }, { status: 400 });

  const db = supabaseServer();
  const { data: role } = await db.from('system_roles').select('*').eq('role_key', roleKey).maybeSingle();
  if (!role) return NextResponse.json({ error: 'Role not found' }, { status: 404 });
  if (role.is_system_role) return NextResponse.json({ error: 'System roles cannot be deleted' }, { status: 403 });

  const { data: users } = await db.from('users').select('role');
  const assigned = (users ?? []).filter((u) => {
    const k = normalizeRoleKey(u.role);
    return k === roleKey || k === normalizeRoleKey(role.name);
  }).length;
  if (assigned) {
    return NextResponse.json(
      { error: `${assigned} user(s) still have this role. Reassign them first.` },
      { status: 409 },
    );
  }

  const { error } = await db.from('system_roles').delete().eq('role_key', roleKey);
  if (error) {
    console.error('DELETE /api/roles:', error.message);
    return NextResponse.json({ error: 'Failed to delete role' }, { status: 500 });
  }

  invalidateRolePermissions(roleKey);
  await logAudit(g.user, 'ROLE_DELETE', 'role', role.id, { roleKey, name: role.name });
  return NextResponse.json({ ok: true });
}
