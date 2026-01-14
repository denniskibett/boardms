// src/app/api/agenda/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseDb } from '@/lib/supabase-db';

export async function POST(request: NextRequest) {
  try {
    console.log('📝 POST /api/agenda called');
    
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

    // Prepare data - REMOVE created_at and updated_at since Supabase handles them
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
      // DO NOT include created_at/updated_at - Supabase handles them
    };

    console.log('🔄 Inserting agenda with data:', insertData);

    // Use supabaseDb.insert method
    const result = await supabaseDb.insert('agenda', insertData);

    console.log('🔄 Insert result:', result);

    if (!result.rows || result.rows.length === 0) {
      console.error('❌ No rows returned from INSERT');
      throw new Error('Failed to create agenda item - no data returned');
    }

    const newAgenda = result.rows[0];
    console.log('✅ Agenda item created successfully:', newAgenda);

    return NextResponse.json(newAgenda);

  } catch (error: any) {
    console.error('❌ Error creating agenda item:', error);
    
    const errorResponse = {
      error: 'Failed to create agenda item',
      details: error.message,
      code: error.code || 'UNKNOWN_ERROR',
      timestamp: new Date().toISOString()
    };
    
    console.error('❌ Returning error response:', errorResponse);
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('📝 GET /api/agenda called');
    
    const { searchParams } = new URL(request.url);
    const meetingId = searchParams.get('meetingId');

    console.log('🔄 Meeting ID:', meetingId);

    if (!meetingId) {
      return NextResponse.json(
        { error: 'meetingId parameter is required' },
        { status: 400 }
      );
    }

    // First, let's try a simpler query without the join to debug
    const result = await supabaseDb.select('agenda', {
      select: '*',
      eq: {
        field: 'meeting_id',
        value: meetingId
      },
      order: {
        field: 'sort_order',
        ascending: true
      }
    });

    console.log('🔄 Query result:', result);

    // Transform the data to match expected format
    const agendaItems = result.rows.map((item: any) => ({
      id: item.id,
      name: item.name,
      description: item.description || '',
      status: item.status,
      sort_order: item.sort_order,
      presenter_id: item.presenter_id,
      ministry_id: item.ministry_id,
      memo_id: item.memo_id,
      cabinet_approval_required: item.cabinet_approval_required,
      meeting_id: item.meeting_id,
      created_at: item.created_at,
      updated_at: item.updated_at,
      created_by: item.created_by,
      // We'll add ministry_name separately if needed
      ministry_name: null // Temporary - we'll fix this later
    }));

    console.log(`✅ Fetched ${agendaItems.length} agenda items for meeting ${meetingId}`);

    return NextResponse.json(agendaItems);

  } catch (error: any) {
    console.error('❌ Error fetching agenda items:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch agenda items',
        details: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}