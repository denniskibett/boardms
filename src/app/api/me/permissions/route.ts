// GET /api/me/permissions — the signed-in user's role and normalised permissions.
import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/permissions';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json({ role: user.role, permissions: user.permissions });
}
