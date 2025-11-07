import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const cabinetSecretary = searchParams.get('cabinet_secretary');
    
    let sql = `
      SELECT 
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
      FROM ministries 
      WHERE status = 'active'
    `;
    
    const params = [];
    
    if (cabinetSecretary) {
      sql += ` AND cabinet_secretary = $1`;
      params.push(parseInt(cabinetSecretary));
    }
    
    sql += ` ORDER BY name`;
    
    const result = await query(sql, params);
    
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching ministries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ministries' },
      { status: 500 }
    );
  }
}