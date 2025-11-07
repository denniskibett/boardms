// app/api/categories/route.ts - FIXED
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    let whereClause = '';
    const params: any[] = [];

    if (type) {
      whereClause = 'WHERE type = $1';
      params.push(type);
    }

    console.log('Fetching categories...');
    
    const categories = await query(`
      SELECT 
        id,
        name,
        type,
        colour,
        created_at,
        updated_at
      FROM categories
      ${whereClause}
      ORDER BY name ASC
    `, params);

    console.log(`Found ${categories.rows.length} categories`);
    
    // Always return an array
    return NextResponse.json(categories.rows || []);
  } catch (error) {
    console.error('Error fetching categories:', error);
    // Return empty array on error
    return NextResponse.json([], { status: 500 });
  }
}