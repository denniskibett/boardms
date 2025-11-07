import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ministryId = searchParams.get('ministry_id');
    const principalSecretary = searchParams.get('principal_secretary');
    
    let sql = `
      SELECT 
        id,
        ministry_id,
        name,
        principal_secretary,
        location,
        website,
        email,
        phone,
        status,
        created_at,
        updated_at
      FROM state_departments 
      WHERE status = 'active'
    `;
    
    const params = [];
    let paramCount = 0;
    
    if (ministryId) {
      paramCount++;
      sql += ` AND ministry_id = $${paramCount}`;
      params.push(parseInt(ministryId));
    }
    
    if (principalSecretary) {
      paramCount++;
      sql += ` AND principal_secretary = $${paramCount}`;
      params.push(parseInt(principalSecretary));
    }
    
    sql += ` ORDER BY name`;
    
    const result = await query(sql, params);
    
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching state departments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch state departments' },
      { status: 500 }
    );
  }
}