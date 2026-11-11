// GET /api/books — meetings with their agenda/document counts, for the Meeting Books list (books.view)
import { NextResponse } from 'next/server';
import { requireAccess } from '@/lib/auth/permissions';
import { supabaseServer } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const g = await requireAccess('books', 'view');
  if (g.error) return g.error;

  const db = supabaseServer();
  const [{ data: meetings, error }, { data: agenda }, { data: docs }] = await Promise.all([
    db.from('meetings').select('id, name, type, start_at, location, status').order('start_at', { ascending: false }),
    db.from('agenda').select('id, meeting_id'),
    db.from('agenda_documents').select('agenda_id'),
  ]);
  if (error) return NextResponse.json({ error: 'Could not load meetings' }, { status: 500 });

  const meetingOfAgenda = new Map((agenda ?? []).map((a) => [a.id, String(a.meeting_id)]));
  const items = new Map<string, number>();
  const files = new Map<string, number>();
  for (const a of agenda ?? []) items.set(String(a.meeting_id), (items.get(String(a.meeting_id)) ?? 0) + 1);
  for (const d of docs ?? []) {
    const m = meetingOfAgenda.get(d.agenda_id);
    if (m) files.set(m, (files.get(m) ?? 0) + 1);
  }

  return NextResponse.json(
    (meetings ?? []).map((m) => ({
      ...m,
      agenda_count: items.get(String(m.id)) ?? 0,
      document_count: files.get(String(m.id)) ?? 0,
    })),
  );
}
