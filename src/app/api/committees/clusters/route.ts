// src/app/api/committees/clusters/route.ts — clusters lookup for the committee form.
import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { requireAccess } from '@/lib/auth/permissions';

export async function GET() {
  const g = await requireAccess('committees', 'view');
  if (g.error) return g.error;

  const { data, error } = await supabaseServer().from('clusters').select('id, name').order('name');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}
