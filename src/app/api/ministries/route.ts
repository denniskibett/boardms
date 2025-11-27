// src/app/api/ministries/route.ts - UPDATED
import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cabinetSecretary = searchParams.get('cabinet_secretary');
    
    const supabase = supabaseServer();
    
    let query = supabase
      .from('ministries')
      .select(`
        id,
        name,
        acronym,
        cluster_id,
        cabinet_secretary,
        headquarters,
        website,
        email,
        phone,
        status,
        created_at,
        updated_at
      `)
      .eq('status', 'active')
      .order('name', { ascending: true });

    if (cabinetSecretary) {
      query = query.eq('cabinet_secretary', parseInt(cabinetSecretary));
    }

    const { data: ministries, error } = await query;

    if (error) {
      console.error('Supabase error fetching ministries:', error);
      return NextResponse.json(
        { error: 'Failed to fetch ministries' },
        { status: 500 }
      );
    }

    return NextResponse.json(ministries || []);
  } catch (error) {
    console.error('Error fetching ministries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ministries' },
      { status: 500 }
    );
  }
}