// app/api/resources/route.ts (Complete version)
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');
    const type = searchParams.get('type');

    let queryStr = `
      SELECT 
        r.*,
        c.name as resource_type_name,
        u.name as created_by_name,
        COUNT(rf.id) as file_count
      FROM resources r
      LEFT JOIN categories c ON r.resource_type_id = c.id
      LEFT JOIN users u ON r.created_by = u.id
      LEFT JOIN resource_files rf ON r.id = rf.resource_id
    `;

    const params: any[] = [];
    const conditions: string[] = [];

    if (year) {
      params.push(parseInt(year));
      conditions.push(`r.year = $${params.length}`);
    }

    if (type) {
      params.push(type);
      conditions.push(`c.name = $${params.length}`);
    }

    if (conditions.length > 0) {
      queryStr += ` WHERE ${conditions.join(' AND ')}`;
    }

    queryStr += ` GROUP BY r.id, c.name, u.name 
                  ORDER BY r.year DESC, r.created_at DESC`;

    const resources = await query(queryStr, params);
    
    return NextResponse.json(resources.rows);
  } catch (error: any) {
    console.error('Error fetching resources:', error);
    return NextResponse.json(
      { error: 'Failed to fetch resources' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, display_name, resource_type_id, year, description, metadata } = await request.json();

    // Validate required fields
    if (!name || !display_name || !resource_type_id || !year) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate folder name in uppercase
    const folderName = name.toUpperCase().replace(/ /g, '-').replace(/[^A-Z0-9-]/g, '');

    const result = await query(
      `INSERT INTO resources 
       (name, display_name, resource_type_id, year, description, metadata, created_by, created_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW()) 
       RETURNING *`,
      [folderName, display_name, resource_type_id, year, description, metadata, session.user.id]
    );

    return NextResponse.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error creating resource:', error);
    return NextResponse.json(
      { error: 'Failed to create resource' },
      { status: 500 }
    );
  }
}