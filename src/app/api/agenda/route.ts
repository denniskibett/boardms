import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const agendaData = await request.json();
    
    console.log('📝 Creating new agenda item - Received data:', agendaData);

    // Validate required fields
    if (!agendaData.name || !agendaData.meeting_id) {
      console.error('❌ Missing required fields:', agendaData);
      return NextResponse.json(
        { 
          error: 'Missing required fields',
          details: 'name and meeting_id are required',
          received: agendaData
        },
        { status: 400 }
      );
    }

    // Prepare data - handle presenter_id vs presenter_id
    const insertData = {
      name: agendaData.name,
      description: agendaData.description || '',
      status: agendaData.status || 'draft',
      sort_order: agendaData.sort_order || 1,
      meeting_id: agendaData.meeting_id,
      presenter_id: agendaData.presenter_id || null,
      ministry_id: agendaData.ministry_id || null,
      cabinet_approval_required: agendaData.cabinet_approval_required || false,
      memo_id: agendaData.memo_id || null,
      created_by: agendaData.created_by || null
    };

    console.log('🔄 Inserting agenda with data:', insertData);

    // Insert with both presenter_id and presenter_id support
    const result = await query(
      `
      INSERT INTO agenda (
        name, 
        description, 
        status,
        sort_order, 
        meeting_id, 
        presenter_id,
        ministry_id,
        cabinet_approval_required,
        memo_id,
        created_by,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
      RETURNING *
      `,
      [
        insertData.name,
        insertData.description,
        insertData.status,
        insertData.sort_order,
        insertData.meeting_id,
        insertData.presenter_id,
        insertData.ministry_id,
        insertData.cabinet_approval_required,
        insertData.memo_id,
        insertData.created_by
      ]
    );

    if (result.rows.length === 0) {
      console.error('❌ No rows returned from INSERT');
      throw new Error('Failed to create agenda item - no data returned');
    }

    const newAgenda = result.rows[0];
    console.log('✅ Agenda item created successfully:', newAgenda);

    return NextResponse.json(newAgenda);

  } catch (error: any) {
    console.error('❌ Error creating agenda item:', error);
    
    // Provide detailed error information
    const errorResponse = {
      error: 'Failed to create agenda item',
      details: error.message,
      code: error.code,
      timestamp: new Date().toISOString()
    };
    
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const meetingId = searchParams.get('meetingId');

    if (!meetingId) {
      return NextResponse.json(
        { error: 'meetingId parameter is required' },
        { status: 400 }
      );
    }

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
        m.name AS ministry_name
      FROM agenda a
      LEFT JOIN ministries m ON a.ministry_id = m.id
      WHERE a.meeting_id = $1
      ORDER BY a.sort_order ASC
      `,
      [meetingId]
    );

    // Ensure descriptions are returned as plain text
    const agendaItems = agendaResult.rows.map(item => ({
      ...item,
      description: item.description 
    }));

    return NextResponse.json(agendaItems);

  } catch (error) {
    console.error('❌ Error fetching agenda items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch agenda items' },
      { status: 500 }
    );
  }
}