// app/api/memos/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await query(`
      SELECT 
        gm.*,
        u.name as submitted_by_name,
        u.ministry as submitted_by_ministry
      FROM gov_memos gm
      LEFT JOIN users u ON gm.submitted_by = u.id
      WHERE gm.id = $1
    `, [params.id]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Memo not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching memo:', error);
    return NextResponse.json(
      { error: 'Failed to fetch memo' },
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
    const { title, summary, body: memoBody, status, assignedCommittee, priority } = body;

    const result = await query(`
      UPDATE gov_memos 
      SET title = $1, summary = $2, body = $3, status = $4, 
          assigned_committee = $5, priority = $6, updated_at = CURRENT_TIMESTAMP
      WHERE id = $7
      RETURNING *
    `, [title, summary, memoBody, status, assignedCommittee, priority, params.id]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Memo not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating memo:', error);
    return NextResponse.json(
      { error: 'Failed to update memo' },
      { status: 500 }
    );
  }
}