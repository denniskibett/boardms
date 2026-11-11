// /api/users/[id] — id is users.id (number) or the Supabase auth UUID.
//   GET    users.view, or your own record
//   PUT    users.edit  (name, email, phone, image, status, role)
//   DELETE users.delete (not yourself)
import { NextRequest, NextResponse } from 'next/server';
import { requireAccess, requireUser, userCan } from '@/lib/auth/permissions';
import { supabaseServer } from '@/lib/supabase/server';
import { logAudit } from '@/lib/audit';
import {
  FULL_COLUMNS,
  USER_STATUSES,
  bad,
  findUser,
  guardRoleAssignment,
  guardTarget,
  isSelf,
  resolveRole,
} from '../_shared';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const g = await requireUser();
  if (g.error) return g.error;
  const { id } = await params;

  const user = await findUser(id);
  if (!user) return bad('User not found', 404);
  if (!isSelf(g.user, user) && !userCan(g.user, 'users', 'view')) return bad('Forbidden', 403);
  return NextResponse.json(user);
}

export async function PUT(request: NextRequest, { params }: Ctx) {
  const g = await requireAccess('users', 'edit');
  if (g.error) return g.error;
  const { id } = await params;

  const user = await findUser(id);
  if (!user) return bad('User not found', 404);
  const denied = guardTarget(g.user, user);
  if (denied) return denied;

  const body = await request.json().catch(() => ({}));
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (body.name !== undefined) {
    const name = String(body.name).trim();
    if (!name) return bad('Name is required');
    patch.name = name;
  }
  if (body.phone !== undefined) patch.phone = body.phone ? String(body.phone) : null;
  if (body.image !== undefined) patch.image = body.image ? String(body.image) : null;
  if (body.status !== undefined) {
    if (!USER_STATUSES.includes(body.status)) return bad('Invalid status');
    if (isSelf(g.user, user) && body.status !== 'active') return bad('You cannot deactivate your own account');
    patch.status = body.status;
  }
  if (body.role !== undefined) {
    const role = await resolveRole(body.role);
    if (!role) return bad('Choose a valid role');
    const r = guardRoleAssignment(g.user, role.role_key);
    if (r) return r;
    patch.role = role.name;
  }

  const db = supabaseServer();
  if (body.email !== undefined) {
    const email = String(body.email).trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return bad('Enter a valid email address');
    if (email !== user.email.toLowerCase()) {
      const { data: taken } = await db.from('users').select('id').eq('email', email).neq('id', user.id).maybeSingle();
      if (taken) return bad('Another user already has this email', 409);
      if (user.auth_id) {
        const { error } = await db.auth.admin.updateUserById(user.auth_id, { email, email_confirm: true });
        if (error) return bad(`Could not change the sign-in email: ${error.message}`);
      }
      patch.email = email;
    }
  }

  const { data, error } = await db.from('users').update(patch).eq('id', user.id).select(FULL_COLUMNS).single();
  if (error) {
    console.error('PUT /api/users/[id]:', error.message);
    return bad(`Failed to update user: ${error.message}`, 500);
  }

  if (user.auth_id && patch.status && patch.status !== user.status) {
    await db.auth.admin.updateUserById(user.auth_id, {
      ban_duration: patch.status === 'suspended' ? '876000h' : 'none',
    });
  }
  await logAudit(g.user, 'USER_UPDATE', 'user', user.id, { email: user.email, changes: Object.keys(patch).filter((k) => k !== 'updated_at') });
  return NextResponse.json(data);
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const g = await requireAccess('users', 'delete');
  if (g.error) return g.error;
  const { id } = await params;

  const user = await findUser(id);
  if (!user) return bad('User not found', 404);
  if (isSelf(g.user, user)) return bad('You cannot delete your own account');
  const denied = guardTarget(g.user, user);
  if (denied) return denied;

  const db = supabaseServer();
  const { error } = await db.from('users').delete().eq('id', user.id);
  if (error) {
    console.error('DELETE /api/users/[id]:', error.message);
    return bad('This user is linked to meetings or documents. Suspend the account instead.', 409);
  }
  if (user.auth_id) {
    const { error: authError } = await db.auth.admin.deleteUser(user.auth_id);
    if (authError) console.error('DELETE /api/users/[id] auth:', authError.message);
  }

  await logAudit(g.user, 'USER_DELETE', 'user', user.id, { email: user.email, name: user.name });
  return NextResponse.json({ ok: true });
}
