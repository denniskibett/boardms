// src/app/api/committees/route.ts — cabinet committees list (GET) and create (POST).
import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { requireAccess } from '@/lib/auth/permissions';
import { lookup, errorMessage } from '../memos/_lib/helpers';
import { committeeFields } from './_fields';

const CHAIR_ORDER: Record<string, number> = { President: 1, 'Deputy President': 2 };

export async function GET() {
  const g = await requireAccess('committees', 'view');
  if (g.error) return g.error;

  try {
    const { data, error } = await supabaseServer().from('cabinet_committees').select('*').order('name');
    if (error) throw error;

    const clusters = await lookup<{ id: number; name: string }>('clusters', (data ?? []).map((c) => c.cluster_id));
    const rows = (data ?? [])
      .map((c) => ({ ...c, cluster_name: c.cluster_id ? clusters.get(c.cluster_id)?.name ?? null : null }))
      .sort((a, b) => (CHAIR_ORDER[a.chair_title] ?? 3) - (CHAIR_ORDER[b.chair_title] ?? 3));
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching committees:', error);
    return NextResponse.json({ error: 'Failed to fetch committees', message: errorMessage(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const g = await requireAccess('committees', 'create');
  if (g.error) return g.error;

  try {
    const row = committeeFields(await request.json());
    if (!row.name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    if (!row.status) row.status = 'active';

    const { data, error } = await supabaseServer().from('cabinet_committees').insert(row).select().single();
    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error creating committee:', error);
    return NextResponse.json({ error: errorMessage(error, 'Failed to create committee') }, { status: 500 });
  }
}
