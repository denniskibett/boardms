// app/api/resources/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Add this to your existing app/api/resources/[id]/route.ts
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const resource = await query(
      `SELECT 
        r.*,
        c.name as resource_type_name,
        u.name as created_by_name
       FROM resources r
       LEFT JOIN categories c ON r.resource_type_id = c.id
       LEFT JOIN users u ON r.created_by = u.id
       WHERE r.id = $1`,
      [parseInt(params.id)]
    );

    if (resource.rows.length === 0) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
    }

    return NextResponse.json(resource.rows[0]);
  } catch (error: any) {
    console.error('Error fetching resource:', error);
    return NextResponse.json(
      { error: 'Failed to fetch resource' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, display_name, resource_type_id, year, description, metadata } = await request.json();

    // Generate folder name in uppercase
    const folderName = name.toUpperCase().replace(/ /g, '-').replace(/[^A-Z0-9-]/g, '');

    const result = await query(
      `UPDATE resources 
       SET name = $1, display_name = $2, resource_type_id = $3, year = $4, 
           description = $5, metadata = $6, updated_at = NOW()
       WHERE id = $7
       RETURNING *`,
      [folderName, display_name, resource_type_id, year, description, metadata, parseInt(params.id)]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error updating resource:', error);
    return NextResponse.json(
      { error: 'Failed to update resource' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // First, delete all files associated with this resource
    await query('DELETE FROM resource_files WHERE resource_id = $1', [parseInt(params.id)]);

    // Then delete the resource
    const result = await query('DELETE FROM resources WHERE id = $1 RETURNING *', [parseInt(params.id)]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting resource:', error);
    return NextResponse.json(
      { error: 'Failed to delete resource' },
      { status: 500 }
    );
  }
}