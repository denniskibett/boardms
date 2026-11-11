// src/app/api/resources/route.ts — list (GET) and create (POST) resource folders.
import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { requireAccess } from '@/lib/auth/permissions';
import { dbUserId, errorMessage } from '../memos/_lib/helpers';
import { enrichResources, resourceFields } from './_lib';

export async function GET(request: NextRequest) {
  const g = await requireAccess('resources', 'view');
  if (g.error) return g.error;

  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');
    const typeId = searchParams.get('type_id');

    let query = supabaseServer().from('resources').select('*, resource_files(count)');
    if (year) query = query.eq('year', parseInt(year, 10));
    if (typeId) query = query.eq('resource_type_id', parseInt(typeId, 10));

    const { data, error } = await query.order('year', { ascending: false }).order('created_at', { ascending: false });
    if (error) throw error;
    return NextResponse.json(await enrichResources(data ?? []));
  } catch (error) {
    console.error('Error fetching resources:', error);
    return NextResponse.json({ error: 'Failed to fetch resources: ' + errorMessage(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const g = await requireAccess('resources', 'create');
  if (g.error) return g.error;

  try {
    const row = resourceFields(await request.json());
    if (!row.name || !row.display_name || !row.resource_type_id || !row.year) {
      return NextResponse.json(
        { error: 'Missing required fields: name, display_name, resource_type_id and year are required' },
        { status: 400 },
      );
    }
    row.created_by = await dbUserId(g.user);

    const { data, error } = await supabaseServer().from('resources').insert(row).select().single();
    if (error) throw error;
    const [resource] = await enrichResources([data]);
    return NextResponse.json(resource, { status: 201 });
  } catch (error) {
    console.error('Error creating resource:', error);
    return NextResponse.json({ error: 'Failed to create resource: ' + errorMessage(error) }, { status: 500 });
  }
}
