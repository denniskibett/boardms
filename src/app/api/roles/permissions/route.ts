// GET /api/roles/permissions?roleKey=… — a role's permissions.
// Users may read their own role; reading any other role needs roles.view.
import { NextRequest, NextResponse } from 'next/server';
import { getRolePermissions, requireUser, userCan } from '@/lib/auth/permissions';
import { normalizeRoleKey } from '@/lib/rbac';
import { supabaseServer } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const g = await requireUser();
  if (g.error) return g.error;

  const roleKey = normalizeRoleKey(new URL(request.url).searchParams.get('roleKey')) ?? g.user.role;
  if (roleKey !== g.user.role && !userCan(g.user, 'roles', 'view')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data, error } = await supabaseServer()
    .from('system_roles')
    .select('name, description, hierarchy_level')
    .eq('role_key', roleKey)
    .maybeSingle();
  if (error || !data) return NextResponse.json({ error: 'Role not found' }, { status: 404 });

  return NextResponse.json({ ...data, role_key: roleKey, permissions: await getRolePermissions(roleKey) });
}
