// src/app/api/ministries/route.ts — active ministries (shared lookup for memo, agenda and resource forms).
import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth/permissions';

export async function GET(request: NextRequest) {
  // Reference data used by several modules' forms, so any signed-in user may read it.
  const g = await requireUser();
  if (g.error) return g.error;

  try {
    const { searchParams } = new URL(request.url);
    const cabinetSecretary = searchParams.get('cabinet_secretary');

    let query = supabaseServer()
      .from('ministries')
      .select('id, name, acronym, cluster_id, cabinet_secretary, headquarters, website, email, phone, status, created_at, updated_at')
      .eq('status', 'active')
      .order('name', { ascending: true });
    if (cabinetSecretary) query = query.eq('cabinet_secretary', parseInt(cabinetSecretary, 10));

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json(data ?? []);
  } catch (error) {
    console.error('Error fetching ministries:', error);
    return NextResponse.json({ error: 'Failed to fetch ministries' }, { status: 500 });
  }
}
