// app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    
    let whereClause = '';
    const params: any[] = [];
    
    if (role && role !== 'all') {
      whereClause = 'WHERE u.role = $1';
      params.push(role);
    }

    const users = await query(`
      SELECT 
        u.id,
        u.image,  
        u.name,
        u.email,
        u.role,
        u.status,
        u.phone,
        u.last_login,
        u.created_at,
        u.updated_at,
        m.id as ministry_id,
        m.name as ministry_name
      FROM users u
      LEFT JOIN ministries m ON u.id = m.cabinet_secretary
      ${whereClause}
      ORDER BY 
        CASE 
          WHEN u.role = 'President' THEN 1
          WHEN u.role = 'Deputy President' THEN 2
          WHEN u.role = 'Prime Cabinet Secretary' THEN 3
          WHEN u.role = 'Cabinet Secretary' THEN 4
          WHEN u.role = 'Principal Secretary' THEN 5
          WHEN u.role = 'Attorney General' THEN 6
          WHEN u.role = 'Secretary to the Cabinet' THEN 7
          ELSE 8
        END,
        u.name
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
    const { name, image, email, password, role, status, phone, ministry_id } = body;

    console.log('Creating user with data:', { name, image, email, role, status, phone, ministry_id });

    // Validate required fields
    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: 'Name, email, password, and role are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user
    const result = await query(
      `INSERT INTO users (name, image, email, password, role, status, phone) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING id, name, email, role, status, phone, created_at`,
      [name, image || null, email.toLowerCase(), hashedPassword, role, status || 'active', phone || null]
    );

    const newUser = result.rows[0];

    // If ministry_id is provided, update the ministry
    if (ministry_id) {
      await query(
        'UPDATE ministries SET cabinet_secretary = $1 WHERE id = $2',
        [newUser.id, ministry_id]
      );
    }

    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}