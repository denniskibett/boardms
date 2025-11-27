// src/app/api/categories/route.ts - UPDATED
import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    console.log('🔍 Fetching categories with type:', type);

    const supabase = supabaseServer();
    
    let query = supabase
      .from('categories')
      .select('id, name, type, colour, created_at, updated_at')
      .order('name', { ascending: true });

    if (type) {
      query = query.eq('type', type);
    }

    const { data: categories, error } = await query;

    if (error) {
      console.error('❌ Supabase error fetching categories:', error);
      return NextResponse.json(
        { error: 'Failed to fetch categories' },
        { status: 500 }
      );
    }

    console.log(`✅ Found ${categories?.length || 0} categories for type: ${type}`);
    return NextResponse.json(categories || []);

  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}