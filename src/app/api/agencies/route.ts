import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const stateDepartmentId = searchParams.get('state_department_id');
    const ministryId = searchParams.get('ministry_id');
    
    let sql = `
      SELECT 
        id,
        name,
        ministry_id,
        state_department_id,
        director,
        location,
        website,
        email,
        phone,
        status,
        created_at,
        updated_at
      FROM agencies 
      WHERE status = 'active'
    `;
    
    const params = [];
    let paramCount = 0;
    
    if (ministryId) {
      paramCount++;
      sql += ` AND ministry_id = $${paramCount}`;
      params.push(parseInt(ministryId));
    }
    
    if (stateDepartmentId) {
      paramCount++;
      sql += ` AND state_department_id = $${paramCount}`;
      params.push(parseInt(stateDepartmentId));
    }
    
    sql += ` ORDER BY name`;
    
    const result = await query(sql, params);
    
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching agencies:', error);
    return NextResponse.json(
      { error: 'Failed to fetch agencies' },
      { status: 500 }
    );
  }
}