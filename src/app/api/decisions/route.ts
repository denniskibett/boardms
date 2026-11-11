// src/app/api/decisions/route.ts — cabinet decisions (deliberations on agenda items).
import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { requireAccess } from '@/lib/auth/permissions';
import { errorMessage, lookup } from '../memos/_lib/helpers';

export async function GET() {
  const g = await requireAccess('decisions', 'view');
  if (g.error) return g.error;

  try {
    const { data, error } = await supabaseServer().from('deliberations').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    const rows = data ?? [];

    type AgendaRow = { id: number; name: string; meeting_id: number | null; memo_id: number | null; ministry_id: number | null };
    const [agenda, signers] = await Promise.all([
      lookup<AgendaRow>('agenda', rows.map((d) => d.agenda_id), 'id, name, meeting_id, memo_id, ministry_id'),
      lookup<{ id: number; name: string }>('users', rows.map((d) => d.signed_by)),
    ]);
    const agendaRows = [...agenda.values()];
    const [meetings, memos, ministries] = await Promise.all([
      lookup<{ id: number; name: string; start_at: string | null }>('meetings', agendaRows.map((a) => a.meeting_id), 'id, name, start_at'),
      lookup<{ id: number; name: string }>('gov_memos', agendaRows.map((a) => a.memo_id)),
      lookup<{ id: number; name: string }>('ministries', agendaRows.map((a) => a.ministry_id)),
    ]);

    return NextResponse.json(
      rows.map((d) => {
        const a = d.agenda_id ? agenda.get(d.agenda_id) : undefined;
        const m = a?.meeting_id ? meetings.get(a.meeting_id) : undefined;
        return {
          ...d,
          agenda_name: a?.name ?? null,
          meeting_id: a?.meeting_id ?? null,
          meeting_name: m?.name ?? null,
          meeting_date: m?.start_at ?? null,
          memo_id: a?.memo_id ?? null,
          memo_name: a?.memo_id ? memos.get(a.memo_id)?.name ?? null : null,
          ministry_name: a?.ministry_id ? ministries.get(a.ministry_id)?.name ?? null : null,
          signed_by_name: d.signed_by ? signers.get(d.signed_by)?.name ?? null : null,
        };
      }),
    );
  } catch (error) {
    console.error('Error fetching decisions:', error);
    return NextResponse.json({ error: 'Failed to fetch decisions: ' + errorMessage(error) }, { status: 500 });
  }
}
