import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

/**
 * GET /api/meetings/[meetingId]/participants
 * Fetch participants for a specific meeting
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const meetingId = parseInt(params.id);


    if (isNaN(meetingId)) {
      console.error('❌ Invalid meetingId:', params.id);
      return NextResponse.json({ error: 'Invalid meeting ID' }, { status: 400 });
    }

    console.log('🔍 Fetching participants for meeting ID:', meetingId);

    const participants = await query(
      `
      SELECT 
        mp.id,
        mp.meeting_id,
        mp.user_id,
        mp.group_id,
        mp.created_at,
        mp.rsvp_id,

        -- Joined User Data
        u.id AS user_id,
        u.name AS user_name,
        u.email AS user_email,
        u.role AS user_role,
        u.phone AS user_phone,
        u.image AS user_image,
        u.status AS user_status,

        -- Joined Group Data
        g.name AS group_name,

        -- Joined RSVP Status
        c.name AS rsvp_status

      FROM meeting_participants mp
      LEFT JOIN users u ON mp.user_id = u.id
      LEFT JOIN groups g ON mp.group_id = g.id
      LEFT JOIN categories c ON mp.rsvp_id = c.id
      WHERE mp.meeting_id = $1
      ORDER BY 
        CASE 
          WHEN u.role = 'President' THEN 1
          WHEN u.role = 'Deputy President' THEN 2
          WHEN u.role = 'Cabinet Secretary' THEN 3
          WHEN u.role = 'Principal Secretary' THEN 4
          ELSE 5
        END,
        u.name ASC
      `,
      [meetingId]
    );

    if (!participants?.rows?.length) {
      console.warn('⚠️ No participants found for meeting:', meetingId);
    }

    const transformed = participants.rows.map((row) => ({
      id: row.id,
      meeting_id: row.meeting_id,
      user_id: row.user_id,
      group_id: row.group_id,
      created_at: row.created_at,
      rsvp_id: row.rsvp_id,
      user: {
        id: row.user_id,
        name: row.user_name,
        email: row.user_email,
        role: row.user_role,
        phone: row.user_phone,
        image: row.user_image,
        status: row.user_status,
      },
      rsvp_status: row.rsvp_status,
      group_name: row.group_name,
    }));

    console.log(`✅ Found ${transformed.length} participant(s)`);

    return NextResponse.json(transformed);
  } catch (error: any) {
    console.error('❌ Error fetching participants:', error.message);
    console.error('📄 Stack:', error.stack);

    // PostgreSQL-specific errors (more granular debug)
    if (error.code) {
      console.error('🧩 Postgres error code:', error.code);
      console.error('📘 Detail:', error.detail);
      console.error('📗 Hint:', error.hint);
      console.error('📙 Position:', error.position);
    }

    return NextResponse.json(
      { error: 'Failed to fetch participants', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/meetings/[meetingId]/participants
 * Add multiple participants to a meeting
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const meetingId = parseInt(params.id);
    const { user_ids, group_id, rsvp_id } = await request.json();

    if (isNaN(meetingId)) {
      console.error('❌ Invalid meetingId:', params.id);
      return NextResponse.json(
        { error: 'Invalid meeting ID' },
        { status: 400 }
      );
    }

    console.log('➕ Adding participants:', { meetingId, user_ids, group_id, rsvp_id });

    const addedParticipants = [];

    for (const user_id of user_ids) {
      const insert = await query(
        `
        INSERT INTO meeting_participants (meeting_id, user_id, group_id, rsvp_id, created_at)
        VALUES ($1, $2, $3, $4, NOW())
        RETURNING id
      `,
        [meetingId, user_id, group_id || null, rsvp_id || null]
      );

      const newId = insert.rows[0].id;

      const complete = await query(
        `
        SELECT 
          mp.id,
          mp.meeting_id,
          mp.user_id,
          mp.group_id,
          mp.created_at,
          mp.rsvp_id,
          u.name AS user_name,
          u.email AS user_email,
          u.role AS user_role,
          u.phone AS user_phone,
          u.image AS user_image,
          u.status AS user_status,
          g.name AS group_name,
          c.name AS rsvp_status
        FROM meeting_participants mp
        LEFT JOIN users u ON mp.user_id = u.id
        LEFT JOIN groups g ON mp.group_id = g.id
        LEFT JOIN categories c ON mp.rsvp_id = c.id
        WHERE mp.id = $1
      `,
        [newId]
      );

      addedParticipants.push(complete.rows[0]);
      console.log(`✅ Added participant: ${complete.rows[0].user_name}`);
    }

    console.log(`✅ Successfully added ${addedParticipants.length} participant(s)`);
    return NextResponse.json(addedParticipants);
  } catch (error: any) {
    console.error('❌ Error adding participants:', error.message);
    return NextResponse.json(
      { error: 'Failed to add participants', details: error.message },
      { status: 500 }
    );
  }
}

