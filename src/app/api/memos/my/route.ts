// app/api/memos/my/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const type = searchParams.get('type');

    let queryStr = `
      SELECT 
        gm.*,
        m.name as ministry_name,
        m.acronym as ministry_acronym,
        sd.name as state_department_name,
        a.name as agency_name
      FROM gov_memos gm
      LEFT JOIN ministries m ON gm.ministry_id = m.id
      LEFT JOIN state_departments sd ON gm.state_department_id = sd.id
      LEFT JOIN agencies a ON gm.agency_id = a.id
      WHERE gm.created_by = $1
    `;

    const params: any[] = [session.user.id];
    let paramCount = 1;

    if (status && status !== 'all') {
      paramCount++;
      queryStr += ` AND gm.status = $${paramCount}`;
      params.push(status);
    }

    if (type && type !== 'all') {
      paramCount++;
      queryStr += ` AND gm.memo_type = $${paramCount}`;
      params.push(type);
    }

    queryStr += ' ORDER BY gm.created_at DESC';

    const memos = await query(queryStr, params);

    return NextResponse.json(memos.rows);
  } catch (error) {
    console.error('Error fetching user memos:', error);
    return NextResponse.json(
      { error: 'Failed to fetch memos' },
      { status: 500 }
    );
  }
}