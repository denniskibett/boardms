// /api/system-settings — GET is public (branding for the sign-in page); signed-in users get every field.
// PUT needs settings.edit.
import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser, requireAccess } from '@/lib/auth/permissions';
import { TIMEZONES, loadSettings, publicSubset, saveSettings } from './shared';

export const dynamic = 'force-dynamic';

export async function GET() {
  const settings = await loadSettings();
  const user = await getSessionUser();
  return NextResponse.json({ ...(user ? settings : publicSubset(settings)), timezones: TIMEZONES });
}

export async function PUT(request: NextRequest) {
  const g = await requireAccess('settings', 'edit');
  if (g.error) return g.error;
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') return NextResponse.json({ error: 'Invalid body' }, { status: 400 });

  const { data, error } = await saveSettings(body);
  if (error) {
    console.error('system_settings save failed:', error.message);
    return NextResponse.json({ error: 'Failed to save system settings' }, { status: 500 });
  }
  return NextResponse.json({ ...data, timezones: TIMEZONES });
}
