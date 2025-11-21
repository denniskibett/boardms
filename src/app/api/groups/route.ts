import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

/* -------------------------------------------------------------
   GET /api/groups  → returns groups with users & mandatory status
---------------------------------------------------------------- */
export async function GET() {
  try {
    const groups = await query(`
      SELECT g.id, g.name, g.created_at, g.updated_at,
        COALESCE(
          json_agg(
            json_build_object(
              'user_id', pu.user_id,
              'mandatory_id', pu.mandatory_id,
              'mandatory_status', c.name
            )
          ) FILTER (WHERE pu.user_id IS NOT NULL),
        '[]') AS users
      FROM groups g
      LEFT JOIN groups_users_pivot pu ON g.id = pu.group_id
      LEFT JOIN categories c ON c.id = pu.mandatory_id AND c.type = 'participation_status'
      GROUP BY g.id
      ORDER BY g.name;
    `);

    return NextResponse.json(groups.rows);
  } catch (error) {
    console.error('Error fetching groups:', error);
    return NextResponse.json({ error: 'Failed to fetch groups' }, { status: 500 });
  }
}

/* -------------------------------------------------------------
   POST /api/groups  → create new group (+ add users)
   BODY:
   {
     "name": "Finance Committee",
     "users": [
       { "user_id": 1, "mandatory_id": 5 },
       { "user_id": 3, "mandatory_id": 6 }
     ]
   }
---------------------------------------------------------------- */
export async function POST(req: Request) {
  try {
    const { name, users } = await req.json();

    // 1. Create group
    const result = await query(
      `INSERT INTO groups (name) VALUES ($1) RETURNING id`,
      [name]
    );
    const groupId = result.rows[0].id;

    // 2. Insert into pivot table
    if (Array.isArray(users) && users.length > 0) {
      const values = users
        .map(
          (u, index) =>
            `($1, $${index * 2 + 2}, $${index * 2 + 3})`
        )
        .join(',');

      const params = [
        groupId,
        ...users.flatMap((u) => [u.user_id, u.mandatory_id]),
      ];

      await query(
        `
        INSERT INTO groups_users_pivot (group_id, user_id, mandatory_id)
        VALUES ${values}
      `,
        params
      );
    }

    return NextResponse.json({ message: 'Group created', groupId });
  } catch (error) {
    console.error('Error creating group:', error);
    return NextResponse.json(
      { error: 'Failed to create group' },
      { status: 500 }
    );
  }
}
