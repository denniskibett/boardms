// GET /api/dashboard/notifications — small feed for the header bell.
// Upcoming meetings (next 14 days, meetings.view) and accounts awaiting activation (users.edit).
import { NextResponse } from 'next/server';
import { requireUser, userCan } from '@/lib/auth/permissions';
import { supabaseServer } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export type FeedItem = { id: string; kind: 'meeting' | 'user'; title: string; detail: string; at: string | null; href: string };

export async function GET() {
  const g = await requireUser();
  if (g.error) return g.error;

  const db = supabaseServer();
  const items: FeedItem[] = [];
  const now = new Date();
  const until = new Date(now.getTime() + 14 * 86_400_000);

  if (userCan(g.user, 'meetings', 'view')) {
    const { data } = await db
      .from('meetings')
      .select('id, name, start_at, location')
      .gte('start_at', now.toISOString())
      .lte('start_at', until.toISOString())
      .order('start_at', { ascending: true })
      .limit(8);
    for (const m of data ?? []) {
      items.push({
        id: `meeting-${m.id}`,
        kind: 'meeting',
        title: m.name,
        detail: m.location ? `Meeting · ${m.location}` : 'Meeting',
        at: m.start_at,
        href: `/meetings/${m.id}`,
      });
    }
  }

  if (userCan(g.user, 'users', 'edit')) {
    const { data } = await db.from('users').select('id, name, created_at').eq('status', 'pending').order('created_at', { ascending: false }).limit(5);
    for (const u of data ?? []) {
      items.push({ id: `user-${u.id}`, kind: 'user', title: u.name, detail: 'Account awaiting activation', at: u.created_at, href: `/users/${u.id}` });
    }
  }

  return NextResponse.json({ items });
}
