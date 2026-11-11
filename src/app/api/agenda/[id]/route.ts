// src/app/api/agenda/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { requireAccess } from '@/lib/auth/permissions';

type Ctx = { params: Promise<{ id: string }> };

const APPROVAL_STATUSES = new Set(['approved', 'rejected']);

const toIntOrNull = (v: unknown) => {
  if (v === '' || v === null || v === undefined || v === 'null') return null;
  const n = parseInt(String(v), 10);
  return Number.isNaN(n) ? null : n;
};

async function withNames(agenda: any) {
  const supabase = supabaseServer();
  const [ministry, presenter] = await Promise.all([
    agenda.ministry_id
      ? supabase.from('ministries').select('name').eq('id', agenda.ministry_id).maybeSingle()
      : Promise.resolve({ data: null }),
    agenda.presenter_id
      ? supabase.from('users').select('name').eq('id', agenda.presenter_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  return {
    ...agenda,
    description: agenda.description || '',
    ministry_name: (ministry.data as any)?.name ?? null,
    presenter_name: (presenter.data as any)?.name ?? null,
  };
}

export async function GET(_request: NextRequest, { params }: Ctx) {
  const g = await requireAccess('agenda', 'view');
  if (g.error) return g.error;

  try {
    const { id } = await params;
    const { data, error } = await supabaseServer().from('agenda').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({ error: 'Agenda item not found' }, { status: 404 });
    return NextResponse.json(await withNames(data));
  } catch (error: any) {
    console.error('Error fetching agenda item:', error);
    return NextResponse.json({ error: 'Failed to fetch agenda item', details: error?.message }, { status: 500 });
  }
}

/** Full update (PUT) or partial update (PATCH, e.g. reorder or status change). */
async function update(request: NextRequest, { params }: Ctx, partial: boolean) {
  const g = await requireAccess('agenda', 'edit');
  if (g.error) return g.error;

  try {
    const { id } = await params;
    const body = await request.json();
    const supabase = supabaseServer();

    if (!partial && !body.name) {
      return NextResponse.json({ error: 'Missing required field', details: 'name is required' }, { status: 400 });
    }

    const { data: existing, error: findError } = await supabase
      .from('agenda')
      .select('id, status')
      .eq('id', id)
      .maybeSingle();
    if (findError) throw findError;
    if (!existing) return NextResponse.json({ error: 'Agenda item not found' }, { status: 404 });

    const has = (k: string) => !partial || Object.prototype.hasOwnProperty.call(body, k);
    const data: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (has('name')) data.name = body.name;
    if (has('description')) data.description = body.description || '';
    if (has('status')) data.status = body.status || 'draft';
    if (has('sort_order')) data.sort_order = Number(body.sort_order) || 1;
    if (has('cabinet_approval_required')) data.cabinet_approval_required = !!body.cabinet_approval_required;
    if (has('presenter_id')) data.presenter_id = toIntOrNull(body.presenter_id);
    if (has('ministry_id')) data.ministry_id = toIntOrNull(body.ministry_id);
    if (has('memo_id') && body.memo_id !== undefined) data.memo_id = body.memo_id || null;

    // Approving or rejecting an item needs agenda.approve.
    const nextStatus = String(data.status ?? '').toLowerCase();
    if (data.status && nextStatus !== String(existing.status ?? '').toLowerCase() && APPROVAL_STATUSES.has(nextStatus)) {
      const ga = await requireAccess('agenda', 'approve');
      if (ga.error) return ga.error;
    }

    const { data: updated, error } = await supabase.from('agenda').update(data).eq('id', id).select('*').single();
    if (error) throw error;
    return NextResponse.json(await withNames(updated));
  } catch (error: any) {
    console.error('Error updating agenda item:', error);
    return NextResponse.json({ error: 'Failed to update agenda item', details: error?.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, ctx: Ctx) {
  return update(request, ctx, false);
}

export async function PATCH(request: NextRequest, ctx: Ctx) {
  return update(request, ctx, true);
}

export async function DELETE(_request: NextRequest, { params }: Ctx) {
  const g = await requireAccess('agenda', 'delete');
  if (g.error) return g.error;

  try {
    const { id } = await params;
    const { data, error } = await supabaseServer().from('agenda').delete().eq('id', id).select('id');
    if (error) throw error;
    if (!data?.length) return NextResponse.json({ error: 'Agenda item not found' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting agenda item:', error);
    return NextResponse.json({ error: 'Failed to delete agenda item', details: error?.message }, { status: 500 });
  }
}
