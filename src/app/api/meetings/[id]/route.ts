// src/app/api/meetings/[id]/route.ts
// Note: the legacy `query()` helper in lib/db ignores WHERE clauses, so this route uses the Supabase client directly.
import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { requireAccess } from '@/lib/auth/permissions';

type Ctx = { params: Promise<{ id: string }> };

const MEETING_SELECT = `
  *,
  chair:chair_id (id, name, email, role),
  created_by_user:created_by (id, name),
  approved_by_user:approved_by (id, name)
`;

function flatten(m: any) {
  const { chair, created_by_user, approved_by_user, ...rest } = m;
  return {
    ...rest,
    chair_name: chair?.name ?? null,
    chair_email: chair?.email ?? null,
    chair_role: chair?.role ?? null,
    created_by_name: created_by_user?.name ?? null,
    approved_by_name: approved_by_user?.name ?? null,
  };
}

export async function GET(_request: NextRequest, { params }: Ctx) {
  const g = await requireAccess('meetings', 'view');
  if (g.error) return g.error;

  try {
    const { id: meetingId } = await params;
    const supabase = supabaseServer();

    const { data: meeting, error } = await supabase.from('meetings').select(MEETING_SELECT).eq('id', meetingId).maybeSingle();
    if (error) throw error;
    if (!meeting) return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });

    const { data: participantRows } = await supabase
      .from('meeting_participants')
      .select('users (id, auth_id, name, email, role)')
      .eq('meeting_id', meetingId)
      .not('user_id', 'is', null);
    const participants = (participantRows || []).map((r: any) => r.users).filter(Boolean);

    let agenda: any[] = [];
    const { data: agendaRows, error: agendaError } = await supabase
      .from('agenda')
      .select('*')
      .eq('meeting_id', meetingId)
      .order('sort_order', { ascending: true });

    if (agendaError) {
      console.error('Error loading agenda for meeting', meetingId, agendaError.message);
    } else if (agendaRows?.length) {
      const agendaIds = agendaRows.map((a) => a.id);
      const ministryIds = [...new Set(agendaRows.map((a) => a.ministry_id).filter(Boolean))];

      const [{ data: docs }, { data: ministries }] = await Promise.all([
        supabase
          .from('agenda_documents')
          .select('id, agenda_id, name, file_url, file_type, file_size, uploaded_by, uploaded_at, metadata')
          .in('agenda_id', agendaIds)
          .order('uploaded_at', { ascending: false }),
        ministryIds.length
          ? supabase.from('ministries').select('id, name').in('id', ministryIds)
          : Promise.resolve({ data: [] as { id: number; name: string }[] }),
      ]);

      agenda = agendaRows.map((a) => {
        const ministry = (ministries || []).find((m: any) => m.id === a.ministry_id) || null;
        return {
          ...a,
          ministry_name: ministry?.name ?? null,
          ministry: ministry ? { id: ministry.id, name: ministry.name } : null,
          documents: (docs || []).filter((d: any) => d.agenda_id === a.id),
        };
      });
    }

    return NextResponse.json({ ...flatten(meeting), participants, agenda });
  } catch (error) {
    console.error('Error fetching meeting:', error);
    return NextResponse.json(
      { error: 'Failed to fetch meeting', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest, { params }: Ctx) {
  const g = await requireAccess('meetings', 'edit');
  if (g.error) return g.error;

  try {
    const { id: meetingId } = await params;
    const body = await request.json();
    const supabase = supabaseServer();

    if (!body.name || !body.type || !body.start_at || !body.location || !body.status) {
      return NextResponse.json({ error: 'Missing required fields: name, type, start_at, location, status' }, { status: 400 });
    }

    const { data: existing, error: findError } = await supabase
      .from('meetings')
      .select('id, approved_by')
      .eq('id', meetingId)
      .maybeSingle();
    if (findError) throw findError;
    if (!existing) return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });

    // Changing approved_by requires the approve permission; otherwise keep the stored value.
    let approvedBy = existing.approved_by ?? null;
    if (body.approved_by && String(body.approved_by) !== String(approvedBy ?? '')) {
      const ga = await requireAccess('meetings', 'approve');
      if (ga.error) return ga.error;
      approvedBy = body.approved_by;
    }

    const period = Number(body.period) || 60;
    const actualEnd =
      body.actual_end || new Date(new Date(body.start_at).getTime() + period * 60_000).toISOString();

    const { data: updated, error } = await supabase
      .from('meetings')
      .update({
        name: body.name,
        type: body.type,
        start_at: body.start_at,
        period,
        actual_end: actualEnd,
        location: body.location,
        chair_id: body.chair_id || null,
        status: body.status,
        description: body.description || '',
        colour: body.colour || '#3b82f6',
        approved_by: approvedBy,
        updated_at: new Date().toISOString(),
      })
      .eq('id', meetingId)
      .select(MEETING_SELECT)
      .single();
    if (error) throw error;

    return NextResponse.json(flatten(updated));
  } catch (error: any) {
    console.error('Error updating meeting:', error);
    return NextResponse.json({ error: 'Failed to update meeting', details: error?.message ?? 'Unknown error' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: Ctx) {
  const g = await requireAccess('meetings', 'delete');
  if (g.error) return g.error;

  try {
    const { id: meetingId } = await params;
    const { data, error } = await supabaseServer().from('meetings').delete().eq('id', meetingId).select('id');
    if (error) throw error;
    if (!data?.length) return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting meeting:', error);
    return NextResponse.json({ error: 'Failed to delete meeting', details: error?.message }, { status: 500 });
  }
}
