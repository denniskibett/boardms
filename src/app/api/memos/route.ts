// src/app/api/memos/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { requireAccess } from '@/lib/auth/permissions';
import { affectedRows, dbUserId, enrichMemos, errorMessage, toInt } from './_lib/helpers';

const CREATE_STATUSES = ['draft', 'submitted'];

/** GET /api/memos?type=my|all&status=… */
export async function GET(request: NextRequest) {
  const g = await requireAccess('memos', 'view');
  if (g.error) return g.error;

  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const status = searchParams.get('status');

    let query = supabaseServer().from('gov_memos').select('*').order('created_at', { ascending: false });

    if (type === 'my') {
      const uid = await dbUserId(g.user);
      if (!uid) return NextResponse.json({ success: true, data: [], count: 0 });
      query = query.eq('created_by', uid);
    }
    if (status && status !== 'all') query = query.eq('status', status);

    const { data, error } = await query;
    if (error) throw error;

    const rows = await enrichMemos(data ?? []);
    return NextResponse.json({ success: true, data: rows, count: rows.length });
  } catch (error) {
    console.error('Error fetching memos:', error);
    return NextResponse.json({ error: 'Failed to fetch memos', message: errorMessage(error) }, { status: 500 });
  }
}

/** POST /api/memos */
export async function POST(request: NextRequest) {
  const g = await requireAccess('memos', 'create');
  if (g.error) return g.error;

  try {
    const body = await request.json();
    const { name, summary, body: memoBody, memo_type, priority, ministry_id, state_department_id, agency_id } = body;
    const affected: string[] = Array.isArray(body.affected_entities) ? body.affected_entities : [];
    const status = CREATE_STATUSES.includes(body.status) ? body.status : 'draft';

    const missingFields = [];
    if (!name) missingFields.push('name');
    if (!summary) missingFields.push('summary');
    if (!memoBody) missingFields.push('body');
    if (!ministry_id) missingFields.push('ministry_id');
    if (missingFields.length > 0) {
      return NextResponse.json({ error: 'Missing required fields', missingFields }, { status: 400 });
    }

    const supabase = supabaseServer();
    const uid = await dbUserId(g.user);

    const { data: memo, error: memoError } = await supabase
      .from('gov_memos')
      .insert({
        name,
        summary,
        body: memoBody,
        memo_type: memo_type || 'cabinet',
        priority: priority || 'medium',
        ministry_id: toInt(ministry_id),
        state_department_id: toInt(state_department_id),
        agency_id: toInt(agency_id),
        created_by: uid,
        updated_by: uid,
        status,
        submitted_at: status === 'submitted' ? new Date().toISOString() : null,
      })
      .select()
      .single();
    if (memoError) throw memoError;

    if (affected.length > 0) {
      const { error: entitiesError } = await supabase.from('memo_affected_entities').insert(affectedRows(memo.id, affected));
      if (entitiesError) throw entitiesError;
    }

    return NextResponse.json({ success: true, memo }, { status: 201 });
  } catch (error) {
    console.error('Error creating memo:', error);
    return NextResponse.json({ error: 'Failed to create memo', message: errorMessage(error) }, { status: 500 });
  }
}
