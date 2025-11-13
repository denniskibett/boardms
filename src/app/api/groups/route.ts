import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const groups = await query(`
      SELECT id, name, created_at, updated_at
      FROM groups
      ORDER BY name
    `);

    return NextResponse.json(groups.rows);
  } catch (error) {
    console.error('Error fetching groups:', error);
    return NextResponse.json(
      { error: 'Failed to fetch groups' },
      { status: 500 }
    );
  }
}