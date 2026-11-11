// POST /api/users/[id]/reset-password — { password } (min 8 chars). Needs users.edit.
// Sets a new password on the Supabase Auth account; there is no default password.
import { NextRequest, NextResponse } from 'next/server';
import { requireAccess } from '@/lib/auth/permissions';
import { supabaseServer } from '@/lib/supabase/server';
import { logAudit } from '@/lib/audit';
import { bad, findUser, guardTarget, validPassword } from '../../_shared';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const g = await requireAccess('users', 'edit');
  if (g.error) return g.error;
  const { id } = await params;

  const { password } = await request.json().catch(() => ({}));
  if (!validPassword(password)) return bad('Password must be at least 8 characters');

  const user = await findUser(id);
  if (!user) return bad('User not found', 404);
  const denied = guardTarget(g.user, user);
  if (denied) return denied;
  if (!user.auth_id) return bad('This user has no sign-in account');

  const { error } = await supabaseServer().auth.admin.updateUserById(user.auth_id, { password });
  if (error) return bad(error.message);

  await logAudit(g.user, 'USER_PASSWORD_RESET', 'user', user.id, { email: user.email });
  return NextResponse.json({ ok: true });
}
