// src/app/api/action-letters/route.ts — action letters issued to ministries for cabinet decisions.
import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { requireAccess } from '@/lib/auth/permissions';
import { errorMessage, lookup } from '../memos/_lib/helpers';
import { letterFields } from './_fields';

export async function GET() {
  const g = await requireAccess('actionLetters', 'view');
  if (g.error) return g.error;

  try {
    const { data, error } = await supabaseServer().from('action_letters').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    const rows = data ?? [];
    const [ministries, decisions] = await Promise.all([
      lookup<{ id: number; name: string }>('ministries', rows.map((r) => r.to_ministry_id)),
      lookup<{ id: number; decision_text: string | null }>('deliberations', rows.map((r) => r.deliberation_id), 'id, decision_text'),
    ]);
    return NextResponse.json(
      rows.map((r) => ({
        ...r,
        ministry_name: r.to_ministry_id ? ministries.get(r.to_ministry_id)?.name ?? null : null,
        decision_text: r.deliberation_id ? decisions.get(r.deliberation_id)?.decision_text ?? null : null,
      })),
    );
  } catch (error) {
    console.error('Error fetching action letters:', error);
    return NextResponse.json({ error: 'Failed to fetch action letters: ' + errorMessage(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const g = await requireAccess('actionLetters', 'create');
  if (g.error) return g.error;

  try {
    const row = letterFields(await request.json());
    if (!row.subject) return NextResponse.json({ error: 'Subject is required' }, { status: 400 });
    if (!row.to_ministry_id) return NextResponse.json({ error: 'Recipient ministry is required' }, { status: 400 });
    if (!row.status) row.status = 'pending';

    const { data, error } = await supabaseServer().from('action_letters').insert(row).select().single();
    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error creating action letter:', error);
    return NextResponse.json({ error: 'Failed to create action letter: ' + errorMessage(error) }, { status: 500 });
  }
}
