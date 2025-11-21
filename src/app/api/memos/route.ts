import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseServer, supabaseDb } from '@/lib/db';

// GET handler to fetch ALL memos
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'my' or 'all'

    console.log('Fetching memos for user:', session.user.id, 'type:', type);
    
    try {
      // Build the Supabase query
      let query = supabaseServer()
        .from('gov_memos')
        .select(`
          *,
          ministries(name),
          state_departments(name),
          agencies(name),
          users(name, email)
        `)
        .order('created_at', { ascending: false });

      // If type is 'my', only show memos created by current user
      if (type === 'my') {
        query = query.eq('created_by', session.user.id);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Supabase query error:', error);
        throw error;
      }

      console.log(`Found ${data?.length || 0} memos`);
      
      // Transform the data to match your expected format
      const transformedData = data?.map(memo => ({
        id: memo.id,
        name: memo.name,
        summary: memo.summary,
        memo_type: memo.memo_type,
        priority: memo.priority,
        status: memo.status,
        created_at: memo.created_at,
        updated_at: memo.updated_at,
        ministry_id: memo.ministry_id,
        state_department_id: memo.state_department_id,
        agency_id: memo.agency_id,
        created_by: memo.created_by,
        ministry_name: memo.ministries?.name,
        state_department_name: memo.state_departments?.name,
        agency_name: memo.agencies?.name,
        creator_name: memo.users?.name,
        creator_email: memo.users?.email
      })) || [];
      
      return NextResponse.json({
        success: true,
        data: transformedData,
        count: transformedData.length
      });
      
    } catch (error) {
      console.error('Error in memo query:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error fetching memos:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch memos',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST handler - you'll need to update this similarly
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    console.log('=== MEMO CREATION DEBUG INFO ===');
    console.log('Session User ID:', session.user.id);
    console.log('Received request body:', JSON.stringify(body, null, 2));
    
    const { 
      name, 
      summary, 
      body: memoBody, 
      memo_type, 
      priority, 
      ministry_id,
      state_department_id,
      agency_id,
      affected_entities = [],
      status,
      workflow
    } = body;

    // Validate required fields
    const missingFields = [];
    if (!name) missingFields.push('name');
    if (!summary) missingFields.push('summary');
    if (!memoBody) missingFields.push('body');
    if (!ministry_id) missingFields.push('ministry_id');

    if (missingFields.length > 0) {
      console.log('Missing required fields:', missingFields);
      return NextResponse.json(
        { 
          error: 'Missing required fields',
          missingFields
        },
        { status: 400 }
      );
    }

    // Use Supabase for insertion
    const supabase = supabaseServer();
    
    // Insert memo
    const { data: memo, error: memoError } = await supabase
      .from('gov_memos')
      .insert({
        name, 
        summary, 
        body: memoBody, 
        memo_type: memo_type || 'cabinet', 
        priority: priority || 'medium', 
        ministry_id: parseInt(ministry_id), 
        state_department_id: state_department_id ? parseInt(state_department_id) : null, 
        agency_id: agency_id ? parseInt(agency_id) : null,
        created_by: session.user.id,
        updated_by: session.user.id,
        status: status || 'draft',
        submitted_at: status === 'submitted' ? new Date().toISOString() : null
      })
      .select()
      .single();

    if (memoError) {
      console.error('Error creating memo:', memoError);
      throw memoError;
    }

    console.log('Successfully created memo with ID:', memo.id);

    // Handle affected entities if provided
    if (affected_entities && affected_entities.length > 0) {
      console.log('Processing affected entities:', affected_entities);
      
      const affectedEntitiesData = affected_entities.map((entityId: string) => {
        const [entityType, id] = entityId.split('_');
        const entityIdNum = parseInt(id);
        
        return {
          memo_id: memo.id,
          entity_type: entityType,
          ministry_id: entityType === 'ministry' ? entityIdNum : null,
          state_department_id: entityType === 'state_department' ? entityIdNum : null,
          agency_id: entityType === 'agency' ? entityIdNum : null
        };
      });

      const { error: entitiesError } = await supabase
        .from('memo_affected_entities')
        .insert(affectedEntitiesData);

      if (entitiesError) {
        console.error('Error inserting affected entities:', entitiesError);
        throw entitiesError;
      }
      console.log('Completed processing affected entities');
    }

    // Insert workflow information if provided
    if (workflow) {
      console.log('Inserting workflow data:', workflow);
      const { error: workflowError } = await supabase
        .from('memo_workflows')
        .insert({
          memo_id: memo.id,
          current_stage: workflow.current_stage,
          next_stage: workflow.next_stage,
          target_committee: workflow.target_committee
        });

      if (workflowError) {
        console.error('Error inserting workflow:', workflowError);
        throw workflowError;
      }
    }

    // Return success
    return NextResponse.json({
      success: true,
      memo,
      debug: {
        sessionUserId: session.user.id,
        receivedFields: Object.keys(body),
        timestamp: new Date().toISOString()
      }
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating memo:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create memo',
        debug: {
          message: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        }
      },
      { status: 500 }
    );
  }
}