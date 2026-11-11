// src/app/api/action-letters/[id]/route.ts — update / delete one action letter.
import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { requireAccess } from '@/lib/auth/permissions';
import { errorMessage, toInt } from '../../memos/_lib/helpers';
import { letterFields } from '../_fields';

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: Ctx) {
  const g = await requireAccess('actionLetters', 'edit');
  if (g.error) return g.error;

  const id = toInt((await params).id);
  if (!id) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  try {
    const row = letterFields(await request.json());
    if ('subject' in row && !row.subject) return NextResponse.json({ error: 'Subject is required' }, { status: 400 });
    row.updated_at = new Date().toISOString();

    const { data, error } = await supabaseServer().from('action_letters').update(row).eq('id', id).select().maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({ error: 'Action letter not found' }, { status: 404 });
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating action letter:', error);
    return NextResponse.json({ error: 'Failed to update action letter: ' + errorMessage(error) }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: Ctx) {
  const g = await requireAccess('actionLetters', 'delete');
  if (g.error) return g.error;

  const id = toInt((await params).id);
  if (!id) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const { error } = await supabaseServer().from('action_letters').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
