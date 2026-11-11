// src/app/api/committees/[id]/route.ts — read / update / delete one cabinet committee.
import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { requireAccess } from '@/lib/auth/permissions';
import { errorMessage, toInt } from '../../memos/_lib/helpers';
import { committeeFields } from '../_fields';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Ctx) {
  const g = await requireAccess('committees', 'view');
  if (g.error) return g.error;

  const id = toInt((await params).id);
  if (!id) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const { data, error } = await supabaseServer().from('cabinet_committees').select('*').eq('id', id).maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Committee not found' }, { status: 404 });
  return NextResponse.json(data);
}

export async function PUT(request: NextRequest, { params }: Ctx) {
  const g = await requireAccess('committees', 'edit');
  if (g.error) return g.error;

  const id = toInt((await params).id);
  if (!id) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  try {
    const row = committeeFields(await request.json());
    if ('name' in row && !row.name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    row.updated_at = new Date().toISOString();

    const { data, error } = await supabaseServer().from('cabinet_committees').update(row).eq('id', id).select().maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({ error: 'Committee not found' }, { status: 404 });
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating committee:', error);
    return NextResponse.json({ error: errorMessage(error, 'Failed to update committee') }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: Ctx) {
  const g = await requireAccess('committees', 'delete');
  if (g.error) return g.error;

  const id = toInt((await params).id);
  if (!id) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const { error } = await supabaseServer().from('cabinet_committees').delete().eq('id', id);
  if (error) {
    console.error('Error deleting committee:', error);
    return NextResponse.json({ error: error.message }, { status: error.code === '23503' ? 409 : 500 });
  }
  return NextResponse.json({ success: true });
}
