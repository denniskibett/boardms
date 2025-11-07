// app/api/meetings/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'Meeting ID is required' },
        { status: 400 }
      );
    }

    console.log('🔍 Fetching meeting with ID:', id);

    const meeting = await query(
      `
      SELECT 
        m.id,
        m.name,
        m.type,
        m.start_at,
        m.period,
        m.actual_end,
        m.location,
        m.chair_id,
        m.status,
        m.created_at,
        m.updated_at,
        m.approved_by,
        m.created_by,
        m.description,
        m.colour,
        chair.name AS chair_name,
        chair.email AS chair_email,
        chair.role AS chair_role,
        created_by_user.name AS created_by_name,
        approved_by_user.name AS approved_by_name,
        ARRAY_AGG(
          DISTINCT jsonb_build_object(
            'id', mp.user_id,
            'name', participant.name,
            'email', participant.email,
            'role', participant.role
          )
        ) FILTER (WHERE mp.user_id IS NOT NULL) AS participants
      FROM meetings m
      LEFT JOIN users chair ON m.chair_id = chair.id
      LEFT JOIN users created_by_user ON m.created_by = created_by_user.id
      LEFT JOIN users approved_by_user ON m.approved_by = approved_by_user.id
      LEFT JOIN meeting_participants mp ON m.id = mp.meeting_id
      LEFT JOIN users participant ON mp.user_id = participant.id
      WHERE m.id = $1
      GROUP BY 
        m.id, m.name, m.type, m.start_at, m.location, m.chair_id, m.status,
        m.created_at, m.updated_at, m.approved_by, m.created_by, m.description,
        m.period, m.actual_end, m.colour,
        chair.name, chair.email, chair.role, created_by_user.name, approved_by_user.name
      `,
      [id]
    );

    if (meeting.rows.length === 0) {
      return NextResponse.json(
        { error: 'Meeting not found' },
        { status: 404 }
      );
    }

    console.log('✅ Meeting found:', meeting.rows[0].id);
    return NextResponse.json(meeting.rows[0]);

  } catch (error) {
    console.error('❌ Error fetching meeting:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch meeting',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Meeting ID is required' },
        { status: 400 }
      );
    }

    const meetingData = await request.json();
    
    console.log('📝 Updating meeting:', { id, ...meetingData });

    // Validate required fields
    if (!meetingData.name || !meetingData.type || !meetingData.start_at || !meetingData.location || !meetingData.status) {
      return NextResponse.json(
        { error: 'Missing required fields: name, type, start_at, location, status' },
        { status: 400 }
      );
    }

    // Check if meeting exists
    const existingMeeting = await query(
      'SELECT id FROM meetings WHERE id = $1',
      [id]
    );

    if (existingMeeting.rows.length === 0) {
      return NextResponse.json(
        { error: 'Meeting not found' },
        { status: 404 }
      );
    }

    // Update the meeting
    const result = await query(
      `
      UPDATE meetings SET
        name = $1,
        type = $2,
        start_at = $3,
        period = $4,
        actual_end = $5,
        location = $6,
        chair_id = $7,
        status = $8,
        description = $9,
        colour = $10,
        approved_by = $11,
        updated_at = NOW()
      WHERE id = $12
      RETURNING *
      `,
      [
        meetingData.name,
        meetingData.type,
        meetingData.start_at,
        meetingData.period || '60',
        meetingData.actual_end || null,
        meetingData.location,
        meetingData.chair_id || null,
        meetingData.status,
        meetingData.description || '',
        meetingData.colour || '#3b82f6',
        meetingData.approved_by || null,
        id
      ]
    );

    if (result.rows.length === 0) {
      throw new Error('Failed to update meeting');
    }

    const updatedMeeting = result.rows[0];
    console.log('✅ Meeting updated successfully:', updatedMeeting.id);

    return NextResponse.json(updatedMeeting);

  } catch (error) {
    console.error('❌ Error updating meeting:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update meeting',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'Meeting ID is required' },
        { status: 400 }
      );
    }

    console.log('🗑️ Deleting meeting:', id);

    // Check if meeting exists
    const existingMeeting = await query(
      'SELECT id FROM meetings WHERE id = $1',
      [id]
    );

    if (existingMeeting.rows.length === 0) {
      return NextResponse.json(
        { error: 'Meeting not found' },
        { status: 404 }
      );
    }

    // Delete meeting participants first (due to foreign key constraint)
    await query(
      'DELETE FROM meeting_participants WHERE meeting_id = $1',
      [id]
    );

    // Delete the meeting
    const result = await query(
      'DELETE FROM meetings WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      throw new Error('Failed to delete meeting');
    }

    console.log('✅ Meeting deleted successfully:', id);
    return NextResponse.json({ 
      success: true, 
      message: 'Meeting deleted successfully',
      deletedMeeting: result.rows[0]
    });

  } catch (error) {
    console.error('❌ Error deleting meeting:', error);
    return NextResponse.json(
      { 
        error: 'Failed to delete meeting',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}