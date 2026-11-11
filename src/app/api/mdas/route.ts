// src/app/api/mdas/route.ts — list (GET) and create (POST) ministries, state departments and agencies.
import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { requireAccess } from '@/lib/auth/permissions';
import { MDA_TABLE, parseType, pickFields } from './_fields';

const SELECT = {
  ministry: '*',
  department: '*, ministries (id, name, acronym)',
  agency: '*, state_departments (id, name, ministry_id, ministries (id, name, acronym))',
} as const;

export async function GET(request: NextRequest): Promise<NextResponse> {
  const g = await requireAccess('mdas', 'view');
  if (g.error) return g.error;

  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(2000, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)));
    const type = parseType(searchParams.get('type')) ?? 'agency';
    // Strip characters that would break the PostgREST filter syntax.
    const search = (searchParams.get('search') || '').replace(/[,()%*]/g, ' ').trim();

    const from = (page - 1) * limit;
    const supabase = supabaseServer();
    const table = MDA_TABLE[type];

    let query = supabase.from(table).select(SELECT[type], { count: 'exact' });
    if (search) {
      query = type === 'department'
        ? query.ilike('name', `%${search}%`)
        : query.or(`name.ilike.%${search}%,acronym.ilike.%${search}%`);
    }
    const { data, error, count } = await query.order('name').range(from, from + limit - 1);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    const total = count ?? 0;
    const response = {
      data: data ?? [],
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
    return NextResponse.json(response);
  } catch (error) {
    console.error('MDAs API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/** POST /api/mdas  { type: 'ministry'|'department'|'agency', name, … } */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const g = await requireAccess('mdas', 'create');
  if (g.error) return g.error;

  try {
    const body = await request.json();
    const type = parseType(body.type);
    if (!type) return NextResponse.json({ error: 'type must be ministry, department or agency' }, { status: 400 });

    const row = pickFields(type, body);
    if (!row.name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    if (type === 'department' && !row.ministry_id) return NextResponse.json({ error: 'Ministry is required' }, { status: 400 });
    if (type === 'agency' && !row.state_department_id) {
      return NextResponse.json({ error: 'State department is required' }, { status: 400 });
    }
    if (!row.status) row.status = 'active';

    const { data, error } = await supabaseServer().from(MDA_TABLE[type]).insert(row).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error('MDA create error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
