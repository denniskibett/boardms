// /api/users
//   GET  — any signed-in user (participant / presenter pickers use it). Full columns need users.view.
//          ?role=<name|all>  ?roles=a,b,c  ?status=active
//   POST — users.create: creates the Supabase Auth account and the users profile.
import { NextRequest, NextResponse } from 'next/server';
import { requireAccess, requireUser, userCan } from '@/lib/auth/permissions';
import { supabaseServer } from '@/lib/supabase/server';
import { logAudit } from '@/lib/audit';
import {
  FULL_COLUMNS,
  PUBLIC_COLUMNS,
  USER_STATUSES,
  bad,
  guardRoleAssignment,
  resolveRole,
  validPassword,
} from './_shared';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const g = await requireUser();
  if (g.error) return g.error;

  const sp = new URL(request.url).searchParams;
  const full = userCan(g.user, 'users', 'view');
  let q = supabaseServer()
    .from('users')
    .select(full ? FULL_COLUMNS : PUBLIC_COLUMNS)
    .order('name', { ascending: true });

  const role = sp.get('role');
  const roles = sp.get('roles');
  const status = sp.get('status');
  if (role && role !== 'all') q = q.eq('role', role);
  else if (roles) q = q.in('role', roles.split(',').map((r) => r.trim()).filter(Boolean));
  if (status && full) q = q.eq('status', status);

  const { data, error } = await q;
  if (error) {
    console.error('GET /api/users:', error.message);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
  return NextResponse.json(data ?? []);
}

export async function POST(request: NextRequest) {
  const g = await requireAccess('users', 'create');
  if (g.error) return g.error;

  const body = await request.json().catch(() => ({}));
  const name = String(body.name ?? '').trim();
  const email = String(body.email ?? '').trim().toLowerCase();
  if (!name || !email) return bad('Name and email are required');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return bad('Enter a valid email address');
  if (!validPassword(body.password)) return bad('Password must be at least 8 characters');

  const role = await resolveRole(body.role);
  if (!role) return bad('Choose a valid role');
  const denied = guardRoleAssignment(g.user, role.role_key);
  if (denied) return denied;

  const status = USER_STATUSES.includes(body.status) ? body.status : 'active';
  const db = supabaseServer();

  const { data: exists } = await db.from('users').select('id').eq('email', email).maybeSingle();
  if (exists) return bad('A user with this email already exists', 409);

  const { data: auth, error: authError } = await db.auth.admin.createUser({
    email,
    password: body.password,
    email_confirm: true,
    user_metadata: { name },
  });
  if (authError || !auth.user) return bad(authError?.message || 'Could not create the sign-in account');

  const now = new Date().toISOString();
  const { data: user, error } = await db
    .from('users')
    .insert({
      auth_id: auth.user.id,
      name,
      email,
      role: role.name,
      status,
      phone: body.phone ? String(body.phone) : null,
      image: body.image ? String(body.image) : null,
      created_at: now,
      updated_at: now,
    })
    .select(FULL_COLUMNS)
    .single();

  if (error) {
    await db.auth.admin.deleteUser(auth.user.id);
    console.error('POST /api/users:', error.message);
    return bad(`Could not create the user profile: ${error.message}`);
  }

  if (status === 'suspended') await db.auth.admin.updateUserById(auth.user.id, { ban_duration: '876000h' });
  await logAudit(g.user, 'USER_CREATE', 'user', user.id, { email, role: role.name });
  return NextResponse.json(user, { status: 201 });
}
