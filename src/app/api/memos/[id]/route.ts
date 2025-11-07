import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";

/**
 * =========================
 * GET /api/memos/[id]
 * =========================
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await query(
      `
      SELECT 
        gm.*,
        m.name AS ministry_name,
        m.acronym AS ministry_acronym,
        sd.name AS state_department_name,
        a.name AS agency_name,
        u.name AS creator_name,
        u.email AS creator_email
      FROM gov_memos gm
      LEFT JOIN ministries m ON gm.ministry_id = m.id
      LEFT JOIN state_departments sd ON gm.state_department_id = sd.id
      LEFT JOIN agencies a ON gm.agency_id = a.id
      LEFT JOIN users u ON gm.created_by = u.id
      WHERE gm.id = $1
      `,
      [params.id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Memo not found" }, { status: 404 });
    }

    // Fetch affected entities
    const affectedEntities = await query(
      `
      SELECT 
        entity_type,
        COALESCE(ministry_id, state_department_id, agency_id) AS entity_id
      FROM memo_affected_entities 
      WHERE memo_id = $1
      `,
      [params.id]
    );

    const memo = {
      ...result.rows[0],
      affected_entities: affectedEntities.rows.map(
        (row) => `${row.entity_type}_${row.entity_id}`
      ),
    };

    return NextResponse.json(memo);
  } catch (error: any) {
    console.error("❌ Error fetching memo:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch memo" },
      { status: 500 }
    );
  }
}

/**
 * =========================
 * PUT /api/memos/[id]
 * =========================
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    console.log("🟢 Update request body:", body);
    console.log("🟢 Authenticated user:", session.user);

    const {
      name,
      summary,
      body: memoBody,
      status,
      memo_type,
      priority,
      ministry_id,
      state_department_id,
      agency_id,
      affected_entities = [],
    } = body;

    // Check if memo exists
    const existingMemo = await query(
      "SELECT created_by FROM gov_memos WHERE id = $1",
      [params.id]
    );

    if (existingMemo.rows.length === 0) {
      return NextResponse.json({ error: "Memo not found" }, { status: 404 });
    }

    // Only allow creator or admin
    if (
      existingMemo.rows[0].created_by !== session.user.id &&
      session.user.role !== "admin"
    ) {
      return NextResponse.json(
        { error: "Unauthorized to update this memo" },
        { status: 403 }
      );
    }

    const result = await query(
      `
      UPDATE gov_memos 
      SET 
        name = COALESCE($1, name), 
        summary = COALESCE($2, summary), 
        body = COALESCE($3, body), 
        status = COALESCE($4, status), 
        memo_type = COALESCE($5, memo_type), 
        priority = COALESCE($6, priority),
        ministry_id = $7,
        state_department_id = $8,
        agency_id = $9,
        updated_at = CURRENT_TIMESTAMP,
        submitted_at = CASE 
          WHEN $4 = 'submitted' AND submitted_at IS NULL THEN CURRENT_TIMESTAMP 
          ELSE submitted_at 
        END
      WHERE id = $10
      RETURNING *
      `,
      [
        name || null,
        summary || null,
        memoBody || null,
        status || null,
        memo_type || null,
        priority || null,
        ministry_id ? parseInt(ministry_id) : null,
        state_department_id ? parseInt(state_department_id) : null,
        agency_id ? parseInt(agency_id) : null,
        params.id,
      ]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Memo not found" }, { status: 404 });
    }

    // Update affected entities
    await query("DELETE FROM memo_affected_entities WHERE memo_id = $1", [
      params.id,
    ]);

    for (const entity of affected_entities) {
      const [entityType, id] = entity.split("_");
      const entityIdNum = parseInt(id);

      if (entityType === "ministry") {
        await query(
          `
          INSERT INTO memo_affected_entities (memo_id, ministry_id, entity_type)
          VALUES ($1, $2, 'ministry')
          `,
          [params.id, entityIdNum]
        );
      } else if (entityType === "state_department") {
        await query(
          `
          INSERT INTO memo_affected_entities (memo_id, state_department_id, entity_type)
          VALUES ($1, $2, 'state_department')
          `,
          [params.id, entityIdNum]
        );
      } else if (entityType === "agency") {
        await query(
          `
          INSERT INTO memo_affected_entities (memo_id, agency_id, entity_type)
          VALUES ($1, $2, 'agency')
          `,
          [params.id, entityIdNum]
        );
      }
    }

    return NextResponse.json({
      message: "✅ Memo updated successfully",
      memo: result.rows[0],
    });
  } catch (error: any) {
    console.error("❌ Error updating memo:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update memo" },
      { status: 500 }
    );
  }
}

/**
 * =========================
 * DELETE /api/memos/[id]
 * =========================
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existingMemo = await query(
      "SELECT created_by, status FROM gov_memos WHERE id = $1",
      [params.id]
    );

    if (existingMemo.rows.length === 0) {
      return NextResponse.json({ error: "Memo not found" }, { status: 404 });
    }

    const memo = existingMemo.rows[0];

    // Only delete draft memos created by user
    if (memo.status !== "draft" || memo.created_by !== session.user.id) {
      return NextResponse.json(
        { error: "Can only delete draft memos that you created" },
        { status: 403 }
      );
    }

    const result = await query(
      "DELETE FROM gov_memos WHERE id = $1 RETURNING *",
      [params.id]
    );

    return NextResponse.json({
      message: "🗑️ Memo deleted successfully",
      memo: result.rows[0],
    });
  } catch (error: any) {
    console.error("❌ Error deleting memo:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete memo" },
      { status: 500 }
    );
  }
}
