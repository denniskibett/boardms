import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'my' or 'all'

    let queryStr = `
      SELECT 
        cc.id,
        cc.name,
        cc.cluster_id,
        cc.chair_title,
        cc.description,
        cc.status,
        cc.created_at,
        cc.updated_at,
        c.name as cluster_name,
        COUNT(DISTINCT m.id) as active_meetings,
        COUNT(DISTINCT a.id) as active_memos
      FROM cabinet_committees cc
      LEFT JOIN clusters c ON cc.cluster_id = c.id
      LEFT JOIN meetings m ON m.committee_id = cc.id AND m.status IN ('scheduled', 'in_progress')
      LEFT JOIN agenda ag ON ag.meeting_id = m.id
      LEFT JOIN gov_memos gm ON ag.memo_id = gm.id AND gm.status IN ('submitted', 'under_review')
      LEFT JOIN agenda a ON a.meeting_id = m.id
    `;

    const params: any[] = [];

    // For "my" committees, we would join with user assignments
    // This is a simplified version - you'd need a user_committees table
    if (type === 'my') {
      queryStr += ` WHERE cc.id IN (
        SELECT committee_id FROM user_committees WHERE user_id = $1
      )`;
      // params.push(userId); // You'd get this from session
    }

    queryStr += `
      GROUP BY cc.id, c.name
      ORDER BY 
        CASE cc.chair_title
          WHEN 'President' THEN 1
          WHEN 'Deputy President' THEN 2
          ELSE 3
        END,
        cc.name
    `;

    const committees = await query(queryStr, params);

    return NextResponse.json(committees.rows);
    
  } catch (error: unknown) {
    console.error('Error fetching committees:', error);
    return NextResponse.json(
      { error: 'Failed to fetch committees' }, 
      { status: 500 }
    );
  }
}