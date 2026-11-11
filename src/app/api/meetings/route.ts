// src/app/api/meetings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { requireAccess, userCan, type SessionUser } from '@/lib/auth/permissions';

const MEETING_SELECT = `
  *,
  chair:chair_id (id, name, email, role),
  created_by_user:created_by (id, name),
  approved_by_user:approved_by (id, name)
`;

function flatten(m: any) {
  const { chair, created_by_user, approved_by_user, meeting_participants, ...rest } = m;
  return {
    ...rest,
    chair_name: chair?.name ?? null,
    chair_email: chair?.email ?? null,
    created_by_name: created_by_user?.name ?? null,
    approved_by_name: approved_by_user?.name ?? null,
    attendees_count: meeting_participants?.length ?? 0,
  };
}

/** Session user id is the Supabase auth uuid; meetings.created_by references users.id. */
async function dbUserId(user: SessionUser): Promise<number | null> {
  const supabase = supabaseServer();
  const { data } = await supabase.from('users').select('id').eq('auth_id', user.id).maybeSingle();
  if (data?.id) return data.id;
  if (!user.email) return null;
  const { data: byEmail } = await supabase.from('users').select('id').eq('email', user.email).maybeSingle();
  return byEmail?.id ?? null;
}

function validate(body: any) {
  if (!body.name || !body.type || !body.start_at || !body.location || !body.status) {
    return NextResponse.json(
      { error: 'Missing required fields', details: 'name, type, start_at, location and status are required' },
      { status: 400 },
    );
  }
  return null;
}

function endFor(body: any) {
  const period = Number(body.period) || 60;
  return {
    period,
    actual_end: body.actual_end || new Date(new Date(body.start_at).getTime() + period * 60_000).toISOString(),
  };
}

export async function GET(request: NextRequest) {
  const g = await requireAccess('meetings', 'view');
  if (g.error) return g.error;

  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const type = searchParams.get('type');

    let q = supabaseServer()
      .from('meetings')
      .select(`${MEETING_SELECT}, meeting_participants (user_id)`)
      .order('start_at', { ascending: false });

    if (date) {
      // Whole calendar day (YYYY-MM-DD).
      const start = new Date(`${date.slice(0, 10)}T00:00:00`);
      const end = new Date(start.getTime() + 86_400_000);
      q = q.gte('start_at', start.toISOString()).lt('start_at', end.toISOString());
    }
    if (type) q = q.eq('type', type);

    const { data, error } = await q;
    if (error) throw error;
    return NextResponse.json((data || []).map(flatten));
  } catch (error: any) {
    console.error('Error fetching meetings:', error);
    return NextResponse.json({ error: 'Failed to fetch meetings', details: error?.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const g = await requireAccess('meetings', 'create');
  if (g.error) return g.error;

  try {
    const body = await request.json();
    const invalid = validate(body);
    if (invalid) return invalid;

    const now = new Date().toISOString();
    const { data, error } = await supabaseServer()
      .from('meetings')
      .insert([
        {
          name: body.name,
          type: body.type,
          start_at: body.start_at,
          ...endFor(body),
          location: body.location,
          chair_id: body.chair_id || null,
          status: body.status,
          description: body.description || '',
          colour: body.colour || '#3b82f6',
          created_by: await dbUserId(g.user),
          approved_by: null,
          created_at: now,
          updated_at: now,
        },
      ])
      .select(MEETING_SELECT)
      .single();
    if (error) throw error;

    return NextResponse.json(flatten(data), { status: 201 });
  } catch (error: any) {
    console.error('Error creating meeting:', error);
    return NextResponse.json({ error: 'Failed to create meeting', details: error?.message }, { status: 500 });
  }
}

/** Legacy update form: PUT /api/meetings?id=… (prefer PUT /api/meetings/[id]). */
export async function PUT(request: NextRequest) {
  const g = await requireAccess('meetings', 'edit');
  if (g.error) return g.error;

  try {
    const id = new URL(request.url).searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Meeting ID is required' }, { status: 400 });

    const body = await request.json();
    const invalid = validate(body);
    if (invalid) return invalid;

    const update: Record<string, unknown> = {
      name: body.name,
      type: body.type,
      start_at: body.start_at,
      ...endFor(body),
      location: body.location,
      chair_id: body.chair_id || null,
      status: body.status,
      description: body.description || '',
      colour: body.colour || '#3b82f6',
      updated_at: new Date().toISOString(),
    };
    // approved_by is only honoured for users who can approve meetings.
    if (body.approved_by && userCan(g.user, 'meetings', 'approve')) update.approved_by = body.approved_by;

    const { data, error } = await supabaseServer()
      .from('meetings')
      .update(update)
      .eq('id', id)
      .select(MEETING_SELECT)
      .maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });

    return NextResponse.json(flatten(data));
  } catch (error: any) {
    console.error('Error updating meeting:', error);
    return NextResponse.json({ error: 'Failed to update meeting', details: error?.message }, { status: 500 });
  }
}
