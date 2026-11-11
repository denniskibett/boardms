// src/app/api/memos/my/route.ts — memos created by the signed-in user (array response).
import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { requireAccess } from '@/lib/auth/permissions';
import { dbUserId, enrichMemos } from '../_lib/helpers';

export async function GET(request: NextRequest) {
  const g = await requireAccess('memos', 'view');
  if (g.error) return g.error;

  try {
    const uid = await dbUserId(g.user);
    if (!uid) return NextResponse.json([]);

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const type = searchParams.get('type');

    let query = supabaseServer()
      .from('gov_memos')
      .select('*')
      .eq('created_by', uid)
      .order('created_at', { ascending: false });
    if (status && status !== 'all') query = query.eq('status', status);
    if (type && type !== 'all') query = query.eq('memo_type', type);

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json(await enrichMemos(data ?? []));
  } catch (error) {
    console.error('Error fetching user memos:', error);
    return NextResponse.json({ error: 'Failed to fetch memos' }, { status: 500 });
  }
}
