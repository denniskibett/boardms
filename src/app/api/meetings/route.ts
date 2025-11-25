// app/api/meetings/route.ts - UPDATED for your supabaseDb wrapper
import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const type = searchParams.get('type');

    console.log('🔍 Fetching meetings with filters:', { date, type });

    // Use the actual Supabase client directly
    const supabase = supabaseServer();
    
    let query = supabase
      .from('meetings')
      .select(`
        *,
        chair:chair_id (id, name, email, role),
        created_by_user:created_by (id, name),
        approved_by_user:approved_by (id, name),
        meeting_participants (user_id)
      `)
      .order('start_at', { ascending: false });

    // Apply filters
    if (date) {
      query = query.eq('start_at', date); // You might need to adjust this for date range
    }

    if (type) {
      query = query.eq('type', type);
    }

    const { data: meetings, error } = await query;

    if (error) {
      console.error('❌ Supabase error fetching meetings:', error);
      return NextResponse.json([], { status: 500 });
    }

    // Transform the data to match your expected format
    const transformedMeetings = (meetings || []).map(meeting => ({
      id: meeting.id,
      name: meeting.name,
      type: meeting.type,
      start_at: meeting.start_at,
      period: meeting.period,
      actual_end: meeting.actual_end,
      location: meeting.location,
      chair_id: meeting.chair_id,
      status: meeting.status,
      created_at: meeting.created_at,
      updated_at: meeting.updated_at,
      approved_by: meeting.approved_by,
      created_by: meeting.created_by,
      description: meeting.description,
      colour: meeting.colour,
      chair_name: meeting.chair?.name,
      chair_email: meeting.chair?.email,
      created_by_name: meeting.created_by_user?.name,
      approved_by_name: meeting.approved_by_user?.name,
      attendees_count: meeting.meeting_participants?.length || 0
    }));

    console.log(`✅ Found ${transformedMeetings.length} meetings`);
    return NextResponse.json(transformedMeetings);

  } catch (error) {
    console.error('❌ Error fetching meetings:', error);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const meetingData = await request.json();
    
    console.log('📝 Creating new meeting - Received data:', meetingData);

    // Validate required fields
    if (!meetingData.name || !meetingData.type || !meetingData.start_at || !meetingData.location || !meetingData.status) {
      return NextResponse.json(
        { 
          error: 'Missing required fields',
          details: 'name, type, start_at, location, and status are required',
          received: meetingData
        },
        { status: 400 }
      );
    }

    // Calculate actual_end if not provided
    let actual_end = meetingData.actual_end;
    if (!actual_end && meetingData.period) {
      const startDate = new Date(meetingData.start_at);
      const endDate = new Date(startDate.getTime() + (meetingData.period * 60 * 1000));
      actual_end = endDate.toISOString();
    }

    // Prepare insert data
    const insertData = {
      name: meetingData.name,
      type: meetingData.type,
      start_at: meetingData.start_at,
      period: meetingData.period || 60,
      location: meetingData.location,
      chair_id: meetingData.chair_id || null,
      status: meetingData.status,
      description: meetingData.description || '',
      colour: meetingData.colour || '#3b82f6',
      actual_end: actual_end,
      created_by: meetingData.created_by || 1,
      approved_by: meetingData.approved_by || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('🔄 Inserting meeting with data:', insertData);

    // Use the actual Supabase client directly
    const supabase = supabaseServer();
    
    const { data: newMeeting, error } = await supabase
      .from('meetings')
      .insert([insertData])
      .select(`
        *,
        chair:chair_id (id, name, email, role),
        created_by_user:created_by (id, name),
        approved_by_user:approved_by (id, name)
      `)
      .single();

    if (error) {
      console.error('❌ Supabase error creating meeting:', error);
      throw new Error(`Database error: ${error.message}`);
    }

    if (!newMeeting) {
      throw new Error('Failed to create meeting - no data returned');
    }

    console.log('✅ Meeting created successfully:', newMeeting.id);
    return NextResponse.json(newMeeting);

  } catch (error: any) {
    console.error('❌ Error creating meeting:', error);
    
    const errorResponse = {
      error: 'Failed to create meeting',
      details: error.message,
      timestamp: new Date().toISOString()
    };
    
    return NextResponse.json(errorResponse, { status: 500 });
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

    // Calculate actual_end if period is provided
    let actual_end = meetingData.actual_end;
    if (!actual_end && meetingData.period) {
      const startDate = new Date(meetingData.start_at);
      const endDate = new Date(startDate.getTime() + (meetingData.period * 60 * 1000));
      actual_end = endDate.toISOString();
    }

    // Prepare update data
    const updateData = {
      name: meetingData.name,
      type: meetingData.type,
      start_at: meetingData.start_at,
      period: meetingData.period || 60,
      actual_end: actual_end,
      location: meetingData.location,
      chair_id: meetingData.chair_id || null,
      status: meetingData.status,
      description: meetingData.description || '',
      colour: meetingData.colour || '#3b82f6',
      approved_by: meetingData.approved_by || null,
      updated_at: new Date().toISOString()
    };

    // Use the actual Supabase client directly
    const supabase = supabaseServer();
    
    const { data: updatedMeeting, error } = await supabase
      .from('meetings')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        chair:chair_id (id, name, email, role),
        created_by_user:created_by (id, name),
        approved_by_user:approved_by (id, name)
      `)
      .single();

    if (error) {
      console.error('❌ Supabase error updating meeting:', error);
      throw new Error(`Database error: ${error.message}`);
    }

    if (!updatedMeeting) {
      return NextResponse.json(
        { error: 'Meeting not found' },
        { status: 404 }
      );
    }

    console.log('✅ Meeting updated successfully:', updatedMeeting.id);
    return NextResponse.json(updatedMeeting);

  } catch (error: any) {
    console.error('❌ Error updating meeting:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update meeting',
        details: error.message
      }, 
      { status: 500 }
    );
  }
}