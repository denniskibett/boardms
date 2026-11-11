// /api/settings — legacy alias of /api/system-settings used by older hooks.
// GET needs a signed-in user; PUT needs settings.edit.
import { NextRequest, NextResponse } from 'next/server';
import { requireAccess, requireUser } from '@/lib/auth/permissions';
import { TIMEZONES, loadSettings, saveSettings } from '../system-settings/shared';

export const dynamic = 'force-dynamic';

export async function GET() {
  const g = await requireUser();
  if (g.error) return g.error;
  return NextResponse.json({ ...(await loadSettings()), timezones: TIMEZONES });
}

export async function PUT(request: NextRequest) {
  const g = await requireAccess('settings', 'edit');
  if (g.error) return g.error;
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') return NextResponse.json({ error: 'Invalid body' }, { status: 400 });

  const { data, error } = await saveSettings(body);
  if (error) {
    console.error('system_settings save failed:', error.message);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
  return NextResponse.json(data);
}
