import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from "@/lib/db"

// GET handler to fetch ALL memos
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'my' or 'all'
    const client = await pool.connect();
    
    try {
      console.log('Fetching memos for user:', session.user.id, 'type:', type);
      
      let query = `
        SELECT 
          gm.id,
          gm.name,
          gm.summary,
          gm.memo_type,
          gm.priority,
          gm.status,
          gm.created_at,
          gm.updated_at,
          gm.ministry_id,
          gm.state_department_id,
          gm.agency_id,
          gm.created_by,
          m.name as ministry_name,
          sd.name as state_department_name,
          a.name as agency_name,
          u.name as creator_name,
          u.email as creator_email
        FROM gov_memos gm
        LEFT JOIN ministries m ON gm.ministry_id = m.id
        LEFT JOIN state_departments sd ON gm.state_department_id = sd.id
        LEFT JOIN agencies a ON gm.agency_id = a.id
        LEFT JOIN users u ON gm.created_by = u.id
      `;
      
      const queryParams: any[] = [];

      // If type is 'my', only show memos created by current user
      if (type === 'my') {
        query += ` WHERE gm.created_by = $1`;
        queryParams.push(session.user.id);
      }

      query += ` ORDER BY gm.created_at DESC`;

      console.log('Executing query:', query);
      const result = await client.query(query, queryParams);

      console.log(`Found ${result.rows.length} memos`);
      
      return NextResponse.json({
        success: true,
        data: result.rows, // Wrap in data property
        count: result.rows.length
      });
      
    } finally {
      client.release();
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

// POST handler for creating memos (your existing code)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Enhanced debugging - log everything received
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

    // Validate required fields with specific error messages
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
          missingFields,
          receivedData: {
            name: !!name,
            summary: !!summary,
            body: !!memoBody,
            ministry_id: !!ministry_id,
            state_department_id: !!state_department_id,
            agency_id: !!agency_id
          }
        },
        { status: 400 }
      );
    }

    // Start transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      console.log('Inserting memo into database...');
      
      // Insert memo with new schema including updated_by
      const memoResult = await client.query(`
        INSERT INTO gov_memos (
          name, summary, body, memo_type, priority, 
          ministry_id, state_department_id, agency_id,
          created_by, updated_by, status, submitted_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *
      `, [
        name, 
        summary, 
        memoBody, 
        memo_type || 'cabinet', 
        priority || 'medium', 
        parseInt(ministry_id), 
        state_department_id ? parseInt(state_department_id) : null, 
        agency_id ? parseInt(agency_id) : null,
        session.user.id,
        session.user.id, // updated_by same as created_by initially
        status || 'draft',
        status === 'submitted' ? new Date() : null
      ]);

      const memo = memoResult.rows[0];
      console.log('Successfully created memo with ID:', memo.id);

      // Handle affected entities if provided
      if (affected_entities && affected_entities.length > 0) {
        console.log('Processing affected entities:', affected_entities);
        
        for (const entityId of affected_entities) {
          const [entityType, id] = entityId.split('_');
          const entityIdNum = parseInt(id);
          
          console.log(`Processing entity: ${entityType} with ID: ${entityIdNum}`);

          if (entityType === 'ministry') {
            await client.query(`
              INSERT INTO memo_affected_entities (
                memo_id, ministry_id, entity_type
              ) VALUES ($1, $2, 'ministry')
            `, [memo.id, entityIdNum]);
          } else if (entityType === 'state_department') {
            await client.query(`
              INSERT INTO memo_affected_entities (
                memo_id, state_department_id, entity_type
              ) VALUES ($1, $2, 'state_department')
            `, [memo.id, entityIdNum]);
          } else if (entityType === 'agency') {
            await client.query(`
              INSERT INTO memo_affected_entities (
                memo_id, agency_id, entity_type
              ) VALUES ($1, $2, 'agency')
            `, [memo.id, entityIdNum]);
          }
        }
        console.log('Completed processing affected entities');
      }

      // Insert workflow information if provided
      if (workflow) {
        console.log('Inserting workflow data:', workflow);
        await client.query(`
          INSERT INTO memo_workflows (
            memo_id, current_stage, next_stage, target_committee
          ) VALUES ($1, $2, $3, $4)
        `, [memo.id, workflow.current_stage, workflow.next_stage, workflow.target_committee]);
      }

      await client.query('COMMIT');
      console.log('Transaction committed successfully');
      
      // Return success with debug info
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
      await client.query('ROLLBACK');
      console.error('Transaction error:', error);
      throw error;
    } finally {
      client.release();
    }
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