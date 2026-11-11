// src/app/api/memos/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { requireAccess, userCan } from '@/lib/auth/permissions';
import { affectedRows, dbUserId, enrichMemos, errorMessage, toInt } from '../_lib/helpers';

type Ctx = { params: Promise<{ id: string }> };

/** Statuses only an approver may set. */
const APPROVER_STATUSES = ['under_review', 'approved', 'rejected'];
const ALL_STATUSES = ['draft', 'submitted', ...APPROVER_STATUSES];

async function loadMemo(id: number) {
  const { data, error } = await supabaseServer().from('gov_memos').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data;
}

/** GET /api/memos/[id] */
export async function GET(_request: NextRequest, { params }: Ctx) {
  const g = await requireAccess('memos', 'view');
  if (g.error) return g.error;

  try {
    const id = toInt((await params).id);
    if (!id) return NextResponse.json({ error: 'Invalid memo id' }, { status: 400 });

    const memo = await loadMemo(id);
    if (!memo) return NextResponse.json({ error: 'Memo not found' }, { status: 404 });

    const { data: entities } = await supabaseServer()
      .from('memo_affected_entities')
      .select('entity_type, ministry_id, state_department_id, agency_id')
      .eq('memo_id', id);

    const [enriched] = await enrichMemos([memo]);
    return NextResponse.json({
      ...enriched,
      affected_entities: (entities ?? []).map(
        (e) => `${e.entity_type}_${e.ministry_id ?? e.state_department_id ?? e.agency_id}`,
      ),
    });
  } catch (error) {
    console.error('Error fetching memo:', error);
    return NextResponse.json({ error: errorMessage(error, 'Failed to fetch memo') }, { status: 500 });
  }
}

/** PUT /api/memos/[id] — edit content (owner, or an approver). */
export async function PUT(request: NextRequest, { params }: Ctx) {
  const g = await requireAccess('memos', 'edit');
  if (g.error) return g.error;

  try {
    const id = toInt((await params).id);
    if (!id) return NextResponse.json({ error: 'Invalid memo id' }, { status: 400 });

    const existing = await loadMemo(id);
    if (!existing) return NextResponse.json({ error: 'Memo not found' }, { status: 404 });

    const uid = await dbUserId(g.user);
    const isApprover = userCan(g.user, 'memos', 'approve');
    if (existing.created_by !== uid && !isApprover) {
      return NextResponse.json({ error: 'You can only edit memos you created' }, { status: 403 });
    }

    const body = await request.json();
    const status: string | undefined = body.status;
    if (status && !ALL_STATUSES.includes(status)) {
      return NextResponse.json({ error: `Unknown status "${status}"` }, { status: 400 });
    }
    if (status && status !== existing.status && APPROVER_STATUSES.includes(status) && !isApprover) {
      return NextResponse.json({ error: 'Forbidden: requires memos.approve' }, { status: 403 });
    }

    const update: Record<string, unknown> = { updated_at: new Date().toISOString(), updated_by: uid };
    for (const key of ['name', 'summary', 'memo_type', 'priority'] as const) {
      if (body[key] !== undefined && body[key] !== '') update[key] = body[key];
    }
    if (body.body !== undefined && body.body !== '') update.body = body.body;
    if (body.ministry_id !== undefined) update.ministry_id = toInt(body.ministry_id);
    if (body.state_department_id !== undefined) update.state_department_id = toInt(body.state_department_id);
    if (body.agency_id !== undefined) update.agency_id = toInt(body.agency_id);
    if (status) {
      update.status = status;
      if (status === 'submitted' && !existing.submitted_at) update.submitted_at = new Date().toISOString();
    }

    const supabase = supabaseServer();
    const { data: memo, error } = await supabase.from('gov_memos').update(update).eq('id', id).select().single();
    if (error) throw error;

    if (Array.isArray(body.affected_entities)) {
      await supabase.from('memo_affected_entities').delete().eq('memo_id', id);
      const rows = affectedRows(id, body.affected_entities);
      if (rows.length) {
        const { error: entitiesError } = await supabase.from('memo_affected_entities').insert(rows);
        if (entitiesError) throw entitiesError;
      }
    }

    return NextResponse.json({ message: 'Memo updated', memo });
  } catch (error) {
    console.error('Error updating memo:', error);
    return NextResponse.json({ error: errorMessage(error, 'Failed to update memo') }, { status: 500 });
  }
}

/**
 * PATCH /api/memos/[id] — workflow status change.
 *   { status: 'submitted' }                         → owner with memos.edit
 *   { status: 'under_review' | 'approved' | 'rejected' } → memos.approve
 */
export async function PATCH(request: NextRequest, { params }: Ctx) {
  const body = await request.json().catch(() => ({}));
  const status: string | undefined = body.status;
  if (!status || !ALL_STATUSES.includes(status)) {
    return NextResponse.json({ error: 'A valid status is required' }, { status: 400 });
  }

  const g = await requireAccess('memos', APPROVER_STATUSES.includes(status) ? 'approve' : 'edit');
  if (g.error) return g.error;

  try {
    const id = toInt((await params).id);
    if (!id) return NextResponse.json({ error: 'Invalid memo id' }, { status: 400 });

    const existing = await loadMemo(id);
    if (!existing) return NextResponse.json({ error: 'Memo not found' }, { status: 404 });

    const uid = await dbUserId(g.user);
    if (!APPROVER_STATUSES.includes(status) && existing.created_by !== uid && !userCan(g.user, 'memos', 'approve')) {
      return NextResponse.json({ error: 'You can only submit memos you created' }, { status: 403 });
    }

    const update: Record<string, unknown> = { status, updated_at: new Date().toISOString(), updated_by: uid };
    if (status === 'submitted' && !existing.submitted_at) update.submitted_at = new Date().toISOString();

    const { data: memo, error } = await supabaseServer().from('gov_memos').update(update).eq('id', id).select().single();
    if (error) throw error;
    return NextResponse.json({ message: 'Status updated', memo });
  } catch (error) {
    console.error('Error changing memo status:', error);
    return NextResponse.json({ error: errorMessage(error, 'Failed to update memo') }, { status: 500 });
  }
}

/** DELETE /api/memos/[id] — own drafts; users with memos.manage can delete any memo. */
export async function DELETE(_request: NextRequest, { params }: Ctx) {
  const g = await requireAccess('memos', 'delete');
  if (g.error) return g.error;

  try {
    const id = toInt((await params).id);
    if (!id) return NextResponse.json({ error: 'Invalid memo id' }, { status: 400 });

    const existing = await loadMemo(id);
    if (!existing) return NextResponse.json({ error: 'Memo not found' }, { status: 404 });

    const canManage = userCan(g.user, 'memos', 'manage');
    const uid = await dbUserId(g.user);
    if (!canManage && (existing.status !== 'draft' || existing.created_by !== uid)) {
      return NextResponse.json({ error: 'You can only delete draft memos that you created' }, { status: 403 });
    }

    const { error } = await supabaseServer().from('gov_memos').delete().eq('id', id);
    if (error) throw error;
    return NextResponse.json({ message: 'Memo deleted', id });
  } catch (error) {
    console.error('Error deleting memo:', error);
    return NextResponse.json({ error: errorMessage(error, 'Failed to delete memo') }, { status: 500 });
  }
}
