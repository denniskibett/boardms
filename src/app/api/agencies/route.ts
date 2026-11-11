// src/app/api/agencies/route.ts — active agencies (shared lookup).
import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth/permissions';

export async function GET(request: NextRequest) {
  const g = await requireUser();
  if (g.error) return g.error;

  try {
    const { searchParams } = new URL(request.url);
    const stateDepartmentId = searchParams.get('state_department_id');
    const ministryId = searchParams.get('ministry_id');
    const supabase = supabaseServer();

    let query = supabase.from('agencies').select('*').eq('status', 'active').order('name');
    if (stateDepartmentId) query = query.eq('state_department_id', parseInt(stateDepartmentId, 10));
    if (ministryId) {
      // Agencies hang off state departments, so filter through them.
      const { data: deps } = await supabase.from('state_departments').select('id').eq('ministry_id', parseInt(ministryId, 10));
      const ids = (deps ?? []).map((d) => d.id);
      if (ids.length === 0) return NextResponse.json([]);
      query = query.in('state_department_id', ids);
    }

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json(data ?? []);
  } catch (error) {
    console.error('Error fetching agencies:', error);
    return NextResponse.json({ error: 'Failed to fetch agencies' }, { status: 500 });
  }
}
