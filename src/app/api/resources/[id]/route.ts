// src/app/api/resources/[id]/route.ts — read / update / delete one resource folder (files live in Supabase Storage).
import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { requireAccess } from '@/lib/auth/permissions';
import { errorMessage, toInt } from '../../memos/_lib/helpers';
import { enrichResources, removeStoredFiles, resourceFields, storagePathOf } from '../_lib';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Ctx) {
  const g = await requireAccess('resources', 'view');
  if (g.error) return g.error;

  const id = toInt((await params).id);
  if (!id) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const { data, error } = await supabaseServer().from('resources').select('*, resource_files(count)').eq('id', id).maybeSingle();
  if (error) return NextResponse.json({ error: 'Failed to fetch resource' }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
  const [resource] = await enrichResources([data]);
  return NextResponse.json(resource);
}

export async function PUT(request: NextRequest, { params }: Ctx) {
  const g = await requireAccess('resources', 'edit');
  if (g.error) return g.error;

  const id = toInt((await params).id);
  if (!id) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  try {
    const row = resourceFields(await request.json());
    if (('name' in row && !row.name) || ('display_name' in row && !row.display_name)) {
      return NextResponse.json({ error: 'Name and display name are required' }, { status: 400 });
    }
    row.updated_at = new Date().toISOString();

    const { data, error } = await supabaseServer()
      .from('resources')
      .update(row)
      .eq('id', id)
      .select('*, resource_files(count)')
      .maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
    const [resource] = await enrichResources([data]);
    return NextResponse.json(resource);
  } catch (error) {
    console.error('Error updating resource:', error);
    return NextResponse.json({ error: 'Failed to update resource: ' + errorMessage(error) }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: Ctx) {
  const g = await requireAccess('resources', 'delete');
  if (g.error) return g.error;

  const id = toInt((await params).id);
  if (!id) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  try {
    const supabase = supabaseServer();
    const { data: files, error: filesError } = await supabase.from('resource_files').select('file_url, metadata').eq('resource_id', id);
    if (filesError) throw filesError;

    await removeStoredFiles((files ?? []).map(storagePathOf));

    const { error: deleteFilesError } = await supabase.from('resource_files').delete().eq('resource_id', id);
    if (deleteFilesError) throw deleteFilesError;

    const { error } = await supabase.from('resources').delete().eq('id', id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting resource:', error);
    return NextResponse.json({ error: 'Failed to delete resource: ' + errorMessage(error) }, { status: 500 });
  }
}
