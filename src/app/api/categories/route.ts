// src/app/api/categories/route.ts — lookup values (resource types, meeting types, RSVP statuses, …).
import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth/permissions';

export async function GET(request: NextRequest) {
  // Shared by every module's forms, so any signed-in user may read it.
  const g = await requireUser();
  if (g.error) return g.error;

  try {
    const type = new URL(request.url).searchParams.get('type');
    let query = supabaseServer()
      .from('categories')
      .select('id, name, type, colour, created_at, updated_at')
      .order('name', { ascending: true });
    if (type) query = query.eq('type', type);

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json(data ?? []);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}
