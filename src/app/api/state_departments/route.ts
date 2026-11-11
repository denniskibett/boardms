// src/app/api/state_departments/route.ts — active state departments (shared lookup).
import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth/permissions';

export async function GET(request: NextRequest) {
  const g = await requireUser();
  if (g.error) return g.error;

  try {
    const { searchParams } = new URL(request.url);
    const ministryId = searchParams.get('ministry_id');
    const principalSecretary = searchParams.get('principal_secretary');

    let query = supabaseServer().from('state_departments').select('*').eq('status', 'active').order('name');
    if (ministryId) query = query.eq('ministry_id', parseInt(ministryId, 10));
    if (principalSecretary) query = query.eq('principal_secretary', principalSecretary);

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json(data ?? []);
  } catch (error) {
    console.error('Error fetching state departments:', error);
    return NextResponse.json({ error: 'Failed to fetch state departments' }, { status: 500 });
  }
}
