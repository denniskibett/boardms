// app/api/meetings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const type = searchParams.get('type');

    const whereConditions: string[] = [];
    const params: any[] = [];
    let paramCount = 0;

    if (date) {
      paramCount++;
      whereConditions.push(`DATE(m.start_at) = $${paramCount}`);
      params.push(date);
    }

    if (type) {
      paramCount++;
      whereConditions.push(`m.type = $${paramCount}`);
      params.push(type);
    }

    const whereClause =
      whereConditions.length > 0
        ? `WHERE ${whereConditions.join(' AND ')}`
        : '';

    console.log('Fetching meetings with query...', whereClause, params);

    const meetings = await query(
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
        created_by_user.name AS created_by_name,
        approved_by_user.name AS approved_by_name,
        COUNT(mp.user_id) AS attendees_count
      FROM meetings m
      LEFT JOIN users chair ON m.chair_id = chair.id
      LEFT JOIN users created_by_user ON m.created_by = created_by_user.id
      LEFT JOIN users approved_by_user ON m.approved_by = approved_by_user.id
      LEFT JOIN meeting_participants mp ON m.id = mp.meeting_id
      ${whereClause}
      GROUP BY 
        m.id, m.name, m.type, m.start_at, m.location, m.chair_id, m.status,
        m.created_at, m.updated_at, m.approved_by, m.created_by, m.description,
        m.period, m.actual_end, m.colour,
        chair.name, chair.email, created_by_user.name, approved_by_user.name
      ORDER BY m.start_at DESC
      `,
      params
    );

    console.log(`✅ Found ${meetings.rows.length} meetings`);
    return NextResponse.json(meetings.rows || []);
  } catch (error) {
    console.error('❌ Error fetching meetings:', error);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.meeting_id) {
      return NextResponse.json(
        { error: 'Meeting ID is required' },
        { status: 400 }
      );
    }

    if (!body.name || body.name.trim() === '') {
      return NextResponse.json(
        { error: 'Agenda name is required' },
        { status: 400 }
      );
    }

    // Ensure data types are correct
    const meetingId = Number(body.meeting_id);
    const name = String(body.name).trim();
    
    if (isNaN(meetingId)) {
      return NextResponse.json(
        { error: 'Invalid meeting ID' },
        { status: 400 }
      );
    }

    // Calculate next sort order
    let sort_order = Number(body.sort_order) || 0;
    if (!sort_order) {
      const lastAgenda = await prisma.agenda.findFirst({
        where: { meeting_id: meetingId },
        orderBy: { sort_order: 'desc' }
      });
      sort_order = lastAgenda ? lastAgenda.sort_order + 1 : 1;
    }
    
    const agenda = await prisma.agenda.create({
      data: {
        meeting_id: meetingId,
        name: name,
        ministry_id: body.ministry_id ? Number(body.ministry_id) : null,
        presenter_name: body.presenter_name ? String(body.presenter_name) : '',
        sort_order: sort_order,
        description: body.description ? String(body.description) : '',
        status: body.status || 'draft',
        cabinet_approval_required: Boolean(body.cabinet_approval_required),
        created_by: body.created_by ? Number(body.created_by) : 1,
      },
      include: {
        documents: true,
        ministry: true,
      }
    });

    return NextResponse.json(agenda);
  } catch (error) {
    console.error('Error creating agenda:', error);
    return NextResponse.json(
      { error: 'Failed to create agenda' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
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