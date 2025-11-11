import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // ✅ FIX: Await params for Next.js 13+
    const { id } = await params;
    const meetingId = id;
    
    console.log('🔍 Fetching meeting with ID:', meetingId);

    // Fetch meeting details
    const meetingResult = await query(
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
        approved_by_user.name AS approved_by_name
      FROM meetings m
      LEFT JOIN users chair ON m.chair_id = chair.id
      LEFT JOIN users created_by_user ON m.created_by = created_by_user.id
      LEFT JOIN users approved_by_user ON m.approved_by = approved_by_user.id
      WHERE m.id = $1
      `,
      [meetingId]
    );

    if (meetingResult.rows.length === 0) {
      console.log('❌ Meeting not found:', meetingId);
      return NextResponse.json(
        { error: 'Meeting not found' },
        { status: 404 }
      );
    }

    const meeting = meetingResult.rows[0];
    console.log('✅ Meeting found:', meeting.id, meeting.name);

    // Fetch participants for this meeting
    const participantsResult = await query(
      `
      SELECT 
        u.id,
        u.name,
        u.email,
        u.role
      FROM meeting_participants mp
      JOIN users u ON mp.user_id = u.id
      WHERE mp.meeting_id = $1
      `,
      [meetingId]
    );

    console.log('✅ Participants fetched:', participantsResult.rows.length);

    // ✅ Fetch agenda items
    console.log('🔄 Starting agenda fetch...');
    
    try {
      // Full agenda query
      const agendaResult = await query(
        `
        SELECT 
          a.id,
          a.name,
          a.description,
          a.status,
          a.sort_order,
          a.presenter_id,
          a.ministry_id,
          a.memo_id,
          a.cabinet_approval_required,
          a.meeting_id,
          a.created_at,
          a.updated_at,
          a.created_by,
          m.name AS ministry_name
        FROM agenda a
        LEFT JOIN ministries m ON a.ministry_id = m.id
        WHERE a.meeting_id = $1
        ORDER BY a.sort_order ASC
        `,
        [meetingId]
      );

      console.log(`📋 Found ${agendaResult.rows.length} agenda items for meeting ${meetingId}`);

      // ✅ Fetch documents for each agenda - FIXED: Use file_url consistently
      const agendaWithDocuments = await Promise.all(
        agendaResult.rows.map(async (agendaItem) => {
          console.log('🔄 Fetching documents for agenda:', agendaItem.id);
          
          const documentsResult = await query(
            `
            SELECT 
              id,
              agenda_id,
              name,
              file_url,
              file_type,
              file_size,
              uploaded_by,
              uploaded_at,
              metadata
            FROM agenda_documents
            WHERE agenda_id = $1
            ORDER BY uploaded_at DESC
            `,
            [agendaItem.id]
          );

          console.log(`📄 Found ${documentsResult.rows.length} documents for agenda ${agendaItem.id}`);

          return {
            ...agendaItem,
            documents: documentsResult.rows.map(doc => ({
              ...doc,
              // Use file_url directly - no fallback to file_path
              file_url: doc.file_url
            })) || [],
            ministry: agendaItem.ministry_name
              ? { id: agendaItem.ministry_id, name: agendaItem.ministry_name }
              : null,
          };
        })
      );

      console.log('✅ All agenda documents fetched successfully');

      // ✅ Combine all data
      const meetingData = {
        ...meeting,
        participants: participantsResult.rows || [],
        agenda: agendaWithDocuments || [],
      };

      console.log('✅ Meeting fetched successfully:', {
        id: meetingData.id,
        name: meetingData.name,
        participants: meetingData.participants.length,
        agenda: meetingData.agenda.length,
      });

      return NextResponse.json(meetingData);

    } catch (agendaError) {
      console.error('❌ Error in agenda section:', agendaError);
      
      // Return meeting data without agenda if agenda fails
      const meetingDataWithoutAgenda = {
        ...meeting,
        participants: participantsResult.rows || [],
        agenda: [], // Empty agenda array
      };
      
      console.log('⚠️ Returning meeting without agenda due to error');
      return NextResponse.json(meetingDataWithoutAgenda);
    }

  } catch (error) {
    console.error('❌ Error fetching meeting:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch meeting',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
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
    const { id } = await params;
    const meetingId = id;
    const meetingData = await request.json();
    
    console.log('📝 Updating meeting:', { id: meetingId, ...meetingData });

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
      [meetingId]
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
        meetingData.period || 60,
        meetingData.actual_end || null,
        meetingData.location,
        meetingData.chair_id || null,
        meetingData.status,
        meetingData.description || '',
        meetingData.colour || '#3b82f6',
        meetingData.approved_by || null,
        meetingId
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
    const { id } = await params;
    const meetingId = id;
    
    console.log('🗑️ Deleting meeting:', meetingId);

    // Check if meeting exists
    const existingMeeting = await query(
      'SELECT id FROM meetings WHERE id = $1',
      [meetingId]
    );

    if (existingMeeting.rows.length === 0) {
      return NextResponse.json(
        { error: 'Meeting not found' },
        { status: 404 }
      );
    }

    // Delete meeting
    await query(
      'DELETE FROM meetings WHERE id = $1',
      [meetingId]
    );

    console.log('✅ Meeting deleted successfully:', meetingId);
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('❌ Error deleting meeting:', error);
    return NextResponse.json(
      { error: 'Failed to delete meeting' },
      { status: 500 }
    );
  }
}