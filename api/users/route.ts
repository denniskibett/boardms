// app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    
    let whereClause = '';
    const params: any[] = [];
    
    if (role) {
      whereClause = 'WHERE role = $1';
      params.push(role);
    }

    const users = await query(`
      SELECT * FROM users 
      ${whereClause}
      ORDER BY 
        CASE 
          WHEN role = 'President' THEN 1
          WHEN role = 'Deputy President' THEN 2
          WHEN role = 'Prime Cabinet Secretary' THEN 3
          WHEN role = 'Cabinet Secretary' THEN 4
          ELSE 5
        END,
        name
    `, params);

    return NextResponse.json(users.rows);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name, role, ministry } = body;

    const result = await query(`
      INSERT INTO users (email, name, role, ministry)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [email, name, role, ministry]);

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}