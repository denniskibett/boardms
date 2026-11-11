// /api/users/me — the signed-in user's own profile.
//   GET — profile plus role display name
//   PUT — { name, phone, image } (role, status and email are admin-only)
import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/permissions';
import { supabaseServer } from '@/lib/supabase/server';
import { FULL_COLUMNS, bad, type UserRow } from '../_shared';

export const dynamic = 'force-dynamic';

async function me(authId: string, email: string) {
  const db = supabaseServer();
  const { data } = await db.from('users').select(FULL_COLUMNS).eq('auth_id', authId).maybeSingle();
  if (data) return data as UserRow;
  const { data: byEmail } = await db.from('users').select(FULL_COLUMNS).eq('email', email.toLowerCase()).maybeSingle();
  return (byEmail as UserRow | null) ?? null;
}

export async function GET() {
  const g = await requireUser();
  if (g.error) return g.error;
  const user = await me(g.user.id, g.user.email);
  if (!user) return bad('Profile not found', 404);
  return NextResponse.json({ ...user, roleKey: g.user.role });
}

export async function PUT(request: NextRequest) {
  const g = await requireUser();
  if (g.error) return g.error;
  const user = await me(g.user.id, g.user.email);
  if (!user) return bad('Profile not found', 404);

  const body = await request.json().catch(() => ({}));
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.name !== undefined) {
    const name = String(body.name).trim();
    if (!name) return bad('Name is required');
    patch.name = name;
  }
  if (body.phone !== undefined) patch.phone = body.phone ? String(body.phone).slice(0, 20) : null;
  if (body.image !== undefined) patch.image = body.image ? String(body.image) : null;

  const { data, error } = await supabaseServer().from('users').update(patch).eq('id', user.id).select(FULL_COLUMNS).single();
  if (error) {
    console.error('PUT /api/users/me:', error.message);
    return bad('Failed to update profile', 500);
  }
  return NextResponse.json({ ...data, roleKey: g.user.role });
}
