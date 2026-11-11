// src/app/api/agenda/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { requireAccess, type SessionUser } from '@/lib/auth/permissions';

const toIntOrNull = (v: unknown) => {
  if (v === '' || v === null || v === undefined || v === 'null') return null;
  const n = parseInt(String(v), 10);
  return Number.isNaN(n) ? null : n;
};

/** Session user id is the Supabase auth uuid; agenda.created_by references users.id. */
async function dbUserId(user: SessionUser): Promise<number | null> {
  const supabase = supabaseServer();
  const { data } = await supabase.from('users').select('id').eq('auth_id', user.id).maybeSingle();
  if (data?.id) return data.id;
  if (!user.email) return null;
  const { data: byEmail } = await supabase.from('users').select('id').eq('email', user.email).maybeSingle();
  return byEmail?.id ?? null;
}

export async function GET(request: NextRequest) {
  const g = await requireAccess('agenda', 'view');
  if (g.error) return g.error;

  try {
    // ?meetingId=… returns that meeting's items in order; without it, every item (newest first) with its meeting.
    const meetingId = new URL(request.url).searchParams.get('meetingId');

    const supabase = supabaseServer();
    let q = supabase.from('agenda').select('*');
    q = meetingId
      ? q.eq('meeting_id', meetingId).order('sort_order', { ascending: true })
      : q.order('created_at', { ascending: false });
    const { data, error } = await q;
    if (error) throw error;

    const meetingIds = meetingId ? [] : [...new Set((data || []).map((a) => a.meeting_id).filter(Boolean))];
    const { data: meetings } = meetingIds.length
      ? await supabase.from('meetings').select('id, name, type, start_at').in('id', meetingIds)
      : { data: [] as any[] };

    const ministryIds = [...new Set((data || []).map((a) => a.ministry_id).filter(Boolean))];
    const presenterIds = [...new Set((data || []).map((a) => a.presenter_id).filter(Boolean))];
    const [{ data: ministries }, { data: presenters }] = await Promise.all([
      ministryIds.length
        ? supabase.from('ministries').select('id, name').in('id', ministryIds)
        : Promise.resolve({ data: [] as any[] }),
      presenterIds.length
        ? supabase.from('users').select('id, name').in('id', presenterIds)
        : Promise.resolve({ data: [] as any[] }),
    ]);

    return NextResponse.json(
      (data || []).map((item: any) => ({
        ...item,
        description: item.description || '',
        ministry_name: (ministries || []).find((m: any) => m.id === item.ministry_id)?.name ?? null,
        presenter_name: (presenters || []).find((u: any) => u.id === item.presenter_id)?.name ?? null,
        ...(meetingId ? {} : { meeting: (meetings || []).find((m: any) => m.id === item.meeting_id) ?? null }),
      })),
    );
  } catch (error: any) {
    console.error('Error fetching agenda items:', error);
    return NextResponse.json({ error: 'Failed to fetch agenda items', details: error?.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const g = await requireAccess('agenda', 'create');
  if (g.error) return g.error;

  try {
    const body = await request.json();
    if (!body.name || !body.meeting_id) {
      return NextResponse.json(
        { error: 'Missing required fields', details: 'name and meeting_id are required' },
        { status: 400 },
      );
    }

    const supabase = supabaseServer();
    let sortOrder = Number(body.sort_order) || 0;
    if (!sortOrder) {
      const { count } = await supabase
        .from('agenda')
        .select('id', { count: 'exact', head: true })
        .eq('meeting_id', body.meeting_id);
      sortOrder = (count ?? 0) + 1;
    }

    const { data, error } = await supabase
      .from('agenda')
      .insert({
        name: body.name,
        description: body.description || '',
        status: body.status || 'draft',
        sort_order: sortOrder,
        meeting_id: body.meeting_id,
        presenter_id: toIntOrNull(body.presenter_id),
        ministry_id: toIntOrNull(body.ministry_id),
        cabinet_approval_required: !!body.cabinet_approval_required,
        memo_id: body.memo_id || null,
        created_by: await dbUserId(g.user),
      })
      .select('*')
      .single();
    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    console.error('Error creating agenda item:', error);
    return NextResponse.json({ error: 'Failed to create agenda item', details: error?.message }, { status: 500 });
  }
}
