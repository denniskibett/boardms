// app/api/users/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await query(`
      SELECT 
        u.*,
        m.id as ministry_id,
        m.name as ministry_name
      FROM users u
      LEFT JOIN ministries m ON u.id = m.cabinet_secretary
      WHERE u.id = $1
    `, [params.id]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { name, image, email, role, status, phone, ministry_id } = body;

    console.log('Updating user:', params.id, body);

    // Validate required fields
    if (!name || !email || !role) {
      return NextResponse.json(
        { error: 'Name, email, and role are required' },
        { status: 400 }
      );
    }

    // Check if email is already taken by another user
    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1 AND id != $2',
      [email.toLowerCase(), params.id]
    );

    if (existingUser.rows.length > 0) {
      return NextResponse.json(
        { error: 'Email is already taken by another user' },
        { status: 400 }
      );
    }

    // Update user
    const result = await query(
      `UPDATE users 
       SET name = $1, image = $2, email = $3, role = $4, status = $5, phone = $6, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $7 
       RETURNING id, name, email, role, status, phone, updated_at`,
      [name, image || null, email.toLowerCase(), role, status || 'active', phone || null, params.id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const updatedUser = result.rows[0];

    // Handle ministry assignment
    if (ministry_id) {
      // First, remove this user from any other ministry
      await query(
        'UPDATE ministries SET cabinet_secretary = NULL WHERE cabinet_secretary = $1',
        [params.id]
      );
      
      // Assign to new ministry
      await query(
        'UPDATE ministries SET cabinet_secretary = $1 WHERE id = $2',
        [params.id, ministry_id]
      );
    } else {
      // Remove from any ministry if no ministry_id provided
      await query(
        'UPDATE ministries SET cabinet_secretary = NULL WHERE cabinet_secretary = $1',
        [params.id]
      );
    }

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('Deleting user:', params.id);

    // Check if user exists
    const userCheck = await query(
      'SELECT id, name FROM users WHERE id = $1',
      [params.id]
    );

    if (userCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user is assigned to any ministry
    const ministryCheck = await query(
      'SELECT id, name FROM ministries WHERE cabinet_secretary = $1',
      [params.id]
    );

    // Remove user from any ministry assignments first
    if (ministryCheck.rows.length > 0) {
      await query(
        'UPDATE ministries SET cabinet_secretary = NULL WHERE cabinet_secretary = $1',
        [params.id]
      );
    }

    // Delete the user
    await query('DELETE FROM users WHERE id = $1', [params.id]);

    return NextResponse.json({ 
      message: `User ${userCheck.rows[0].name} deleted successfully`,
      removedFromMinistries: ministryCheck.rows.length
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}