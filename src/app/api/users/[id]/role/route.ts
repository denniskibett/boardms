// PUT /api/users/[id]/role — { role: roleKey | role name }. Needs users.edit.
import { NextRequest, NextResponse } from 'next/server';
import { requireAccess } from '@/lib/auth/permissions';
import { supabaseServer } from '@/lib/supabase/server';
import { logAudit } from '@/lib/audit';
import { FULL_COLUMNS, bad, findUser, guardRoleAssignment, guardTarget, isSelf, resolveRole } from '../../_shared';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const g = await requireAccess('users', 'edit');
  if (g.error) return g.error;
  const { id } = await params;

  const user = await findUser(id);
  if (!user) return bad('User not found', 404);
  if (isSelf(g.user, user)) return bad('You cannot change your own role');
  const denied = guardTarget(g.user, user);
  if (denied) return denied;

  const { role: input } = await request.json().catch(() => ({}));
  const role = await resolveRole(input);
  if (!role) return bad('Choose a valid role');
  const r = guardRoleAssignment(g.user, role.role_key);
  if (r) return r;

  const { data, error } = await supabaseServer()
    .from('users')
    .update({ role: role.name, updated_at: new Date().toISOString() })
    .eq('id', user.id)
    .select(FULL_COLUMNS)
    .single();
  if (error) {
    console.error('PUT /api/users/[id]/role:', error.message);
    return bad(`Failed to change role: ${error.message}`, 500);
  }

  await logAudit(g.user, 'USER_ROLE_CHANGE', 'user', user.id, { email: user.email, from: user.role, to: role.name });
  return NextResponse.json(data);
}
