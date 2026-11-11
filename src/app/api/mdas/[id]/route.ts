// src/app/api/mdas/[id]/route.ts — read / update / delete one MDA. `?type=ministry|department|agency` (default agency).
import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { requireAccess } from '@/lib/auth/permissions';
import { MDA_TABLE, parseType, pickFields } from '../_fields';

type Ctx = { params: Promise<{ id: string }> };

const DETAIL_SELECT = {
  ministry: '*, state_departments (id, name)',
  department: '*, ministries (*), agencies (id, name)',
  agency: '*, state_departments (*, ministries (*))',
} as const;

function idAndType(request: NextRequest, rawId: string) {
  const id = parseInt(rawId, 10);
  const type = parseType(new URL(request.url).searchParams.get('type')) ?? 'agency';
  return { id: Number.isNaN(id) ? null : id, type };
}

export async function GET(request: NextRequest, { params }: Ctx): Promise<NextResponse> {
  const g = await requireAccess('mdas', 'view');
  if (g.error) return g.error;

  const { id, type } = idAndType(request, (await params).id);
  if (!id) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const { data, error } = await supabaseServer().from(MDA_TABLE[type]).select(DETAIL_SELECT[type]).eq('id', id).maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ data });
}

export async function PUT(request: NextRequest, { params }: Ctx): Promise<NextResponse> {
  const g = await requireAccess('mdas', 'edit');
  if (g.error) return g.error;

  const { id, type } = idAndType(request, (await params).id);
  if (!id) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  try {
    const row = pickFields(type, await request.json());
    if ('name' in row && !row.name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    row.updated_at = new Date().toISOString();

    const { data, error } = await supabaseServer().from(MDA_TABLE[type]).update(row).eq('id', id).select().maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ data });
  } catch (error) {
    console.error('MDA update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: Ctx): Promise<NextResponse> {
  const g = await requireAccess('mdas', 'delete');
  if (g.error) return g.error;

  const { id, type } = idAndType(request, (await params).id);
  if (!id) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const { error } = await supabaseServer().from(MDA_TABLE[type]).delete().eq('id', id);
  if (error) {
    // Usually a foreign-key violation (memos, meetings or child MDAs still point at it).
    const status = error.code === '23503' ? 409 : 400;
    const message = error.code === '23503' ? 'This record is still referenced by other data and cannot be deleted.' : error.message;
    return NextResponse.json({ error: message }, { status });
  }
  return NextResponse.json({ success: true });
}
