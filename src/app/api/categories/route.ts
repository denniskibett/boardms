import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    let sql = 'SELECT id, name, type, colour, created_at, updated_at FROM categories';
    const params = [];

    if (type) {
      sql += ' WHERE type = $1';
      params.push(type);
    }

    sql += ' ORDER BY name ASC';

    const result = await query(sql, params);

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}