// app/api/memos/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const committee = searchParams.get('committee');
    
    let whereClause = '';
    const params: any[] = [];
    
    if (status) {
      whereClause += 'WHERE gm.status = $1';
      params.push(status);
    }
    
    if (committee) {
      whereClause += whereClause ? ' AND gm.assigned_committee = $2' : 'WHERE gm.assigned_committee = $1';
      params.push(committee);
    }

    const memos = await query(`
      SELECT 
        gm.*,
        u.name as submitted_by_name,
        u.ministry as submitted_by_ministry
      FROM gov_memos gm
      LEFT JOIN users u ON gm.submitted_by = u.id
      ${whereClause}
      ORDER BY gm.created_at DESC
    `, params);

    return NextResponse.json(memos.rows);
  } catch (error) {
    console.error('Error fetching memos:', error);
    return NextResponse.json(
      { error: 'Failed to fetch memos' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, summary, body: memoBody, submittedBy, assignedCommittee, priority } = body;

    const result = await query(`
      INSERT INTO gov_memos (title, summary, body, submitted_by, assigned_committee, priority, status)
      VALUES ($1, $2, $3, $4, $5, $6, 'draft')
      RETURNING *
    `, [title, summary, memoBody, submittedBy, assignedCommittee, priority]);

    // Log the action
    await query(`
      INSERT INTO audit_logs (user_id, action, target_type, target_id, metadata)
      VALUES ($1, 'CREATE_MEMO', 'gov_memo', $2, $3)
    `, [submittedBy, result.rows[0].id, { title }]);

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Error creating memo:', error);
    return NextResponse.json(
      { error: 'Failed to create memo' },
      { status: 500 }
    );
  }
}