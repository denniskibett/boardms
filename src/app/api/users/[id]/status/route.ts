// PUT /api/users/[id]/status — { status: active | inactive | pending | suspended }. Needs users.edit.
// Suspending also bans the Supabase Auth account so the user cannot sign in.
import { NextRequest, NextResponse } from 'next/server';
import { requireAccess } from '@/lib/auth/permissions';
import { supabaseServer } from '@/lib/supabase/server';
import { logAudit } from '@/lib/audit';
import { FULL_COLUMNS, USER_STATUSES, bad, findUser, guardTarget, isSelf } from '../../_shared';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const g = await requireAccess('users', 'edit');
  if (g.error) return g.error;
  const { id } = await params;

  const { status } = await request.json().catch(() => ({}));
  if (!USER_STATUSES.includes(status)) return bad('Invalid status');

  const user = await findUser(id);
  if (!user) return bad('User not found', 404);
  if (isSelf(g.user, user)) return bad('You cannot change the status of your own account');
  const denied = guardTarget(g.user, user);
  if (denied) return denied;

  const db = supabaseServer();
  const { data, error } = await db
    .from('users')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', user.id)
    .select(FULL_COLUMNS)
    .single();
  if (error) {
    console.error('PUT /api/users/[id]/status:', error.message);
    return bad('Failed to update status', 500);
  }

  if (user.auth_id) {
    const { error: banError } = await db.auth.admin.updateUserById(user.auth_id, {
      ban_duration: status === 'suspended' ? '876000h' : 'none',
    });
    if (banError) console.error('PUT /api/users/[id]/status ban:', banError.message);
  }

  await logAudit(g.user, status === 'suspended' ? 'USER_SUSPEND' : 'USER_STATUS', 'user', user.id, {
    email: user.email,
    from: user.status,
    to: status,
  });
  return NextResponse.json(data);
}
