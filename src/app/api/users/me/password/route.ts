// POST /api/users/me/password — { currentPassword, newPassword }. Signed-in users change their own password.
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireUser } from '@/lib/auth/permissions';
import { supabaseServer } from '@/lib/supabase/server';
import { bad, validPassword } from '../../_shared';

export async function POST(request: NextRequest) {
  const g = await requireUser();
  if (g.error) return g.error;

  const { currentPassword, newPassword } = await request.json().catch(() => ({}));
  if (typeof currentPassword !== 'string' || !currentPassword) return bad('Enter your current password');
  if (!validPassword(newPassword)) return bad('New password must be at least 8 characters');
  if (newPassword === currentPassword) return bad('Choose a different password');

  // Verify the current password with a throw-away anon client.
  const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await anon.auth.signInWithPassword({ email: g.user.email, password: currentPassword });
  if (error || !data.user) return bad('Current password is incorrect', 403);

  const { error: updateError } = await supabaseServer().auth.admin.updateUserById(data.user.id, { password: newPassword });
  if (updateError) return bad(updateError.message);
  return NextResponse.json({ ok: true });
}
