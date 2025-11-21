import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// Define types for the route parameters
interface RouteParams {
  params: {
    id: string;
  };
}

// Define types for the user in the pivot table
interface PivotUser {
  user_id: number;
  mandatory_id: number;
}

// Define types for the request body
interface UpdateGroupRequestBody {
  name: string;
  users: PivotUser[];
}

/* -------------------------------------------------------------
   GET /api/groups/[id]
---------------------------------------------------------------- */
export async function GET(req: Request, { params }: RouteParams) {
  const { id } = params;

  try {
    const group = await query(
      `
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
      WHERE g.id = $1
      GROUP BY g.id;
    `,
      [id]
    );

    return NextResponse.json(group.rows[0] || {});
  } catch (error) {
    console.error('Error fetching group:', error);
    return NextResponse.json(
      { error: 'Failed to fetch group' },
      { status: 500 }
    );
  }
}

/* -------------------------------------------------------------
   PUT /api/groups/[id] → update group + pivot
   BODY:
   {
     "name": "Updated Name",
     "users": [
       { "user_id": 1, "mandatory_id": 3 },
       { "user_id": 8, "mandatory_id": 5 }
     ]
   }
---------------------------------------------------------------- */
export async function PUT(req: Request, { params }: RouteParams) {
  const { id } = params;

  try {
    const { name, users } = await req.json() as UpdateGroupRequestBody;

    if (!name) {
      return NextResponse.json(
        { error: 'Group name is required' },
        { status: 400 }
      );
    }

    // 1. Update name
    await query(`UPDATE groups SET name = $1, updated_at = NOW() WHERE id = $2`, [name, id]);

    // 2. Clear old pivot items
    await query(`DELETE FROM groups_users_pivot WHERE group_id = $1`, [id]);

    // 3. Insert new pivot entries
    if (Array.isArray(users) && users.length > 0) {
      // Validate users array
      const validUsers = users.filter(user => 
        user.user_id && user.mandatory_id
      );

      if (validUsers.length > 0) {
        const values = validUsers
          .map((_, index) => `($1, $${index * 2 + 2}, $${index * 2 + 3})`)
          .join(',');

        const paramsArray = [
          id,
          ...validUsers.flatMap((u) => [u.user_id, u.mandatory_id]),
        ];

        await query(
          `INSERT INTO groups_users_pivot (group_id, user_id, mandatory_id) VALUES ${values}`,
          paramsArray
        );
      }
    }

    return NextResponse.json({ message: 'Group updated successfully' });
  } catch (error) {
    console.error('Error updating group:', error);
    return NextResponse.json(
      { error: 'Failed to update group' },
      { status: 500 }
    );
  }
}

/* -------------------------------------------------------------
   DELETE /api/groups/[id]
---------------------------------------------------------------- */
export async function DELETE(req: Request, { params }: RouteParams) {
  const { id } = params;

  try {
    await query("BEGIN");

    // Check if group exists
    const groupExists = await query('SELECT id FROM groups WHERE id = $1', [id]);
    
    if (groupExists.rows.length === 0) {
      await query("ROLLBACK");
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      );
    }

    await query(`DELETE FROM groups_users_pivot WHERE group_id = $1`, [id]);
    await query(`DELETE FROM groups WHERE id = $1`, [id]);

    await query("COMMIT");

    return NextResponse.json({ message: "Group deleted successfully" });
  } catch (error) {
    await query("ROLLBACK");
    console.error("Error deleting group:", error);
    return NextResponse.json(
      { error: "Failed to delete group" },
      { status: 500 }
    );
  }
}