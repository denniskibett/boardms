import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    const agendaId = id;

    console.log('🔍 Fetching agenda item:', agendaId);

    const result = await query(
      `
      SELECT 
        a.*,
        m.name as ministry_name,
        u.id as presenter_id
      FROM agenda a
      LEFT JOIN ministries m ON a.ministry_id = m.id
      LEFT JOIN users u ON a.presenter_id = u.id
      WHERE a.id = $1
      `,
      [agendaId]
    );

    if (result.rows.length === 0) {
      console.log('❌ Agenda item not found:', agendaId);
      return NextResponse.json(
        { error: 'Agenda item not found' },
        { status: 404 }
      );
    }

    const agenda = result.rows[0];
    console.log('✅ Agenda item fetched successfully:', agenda.id);

    return NextResponse.json(agenda);
  } catch (error) {
    console.error('❌ Error fetching agenda item:', error);
    return NextResponse.json(
      { error: 'Failed to fetch agenda item' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    const agendaId = id;
    const agendaData = await request.json();

    console.log('📝 Updating agenda item:', { agendaId, agendaData });

    // Validate required fields
    if (!agendaData.name) {
      return NextResponse.json(
        { 
          error: 'Missing required field',
          details: 'name is required',
          received: agendaData
        },
        { status: 400 }
      );
    }

    // Check if agenda exists
    const existingAgenda = await query(
      'SELECT id FROM agenda WHERE id = $1',
      [agendaId]
    );

    if (existingAgenda.rows.length === 0) {
      return NextResponse.json(
        { error: 'Agenda item not found' },
        { status: 404 }
      );
    }

    // Handle both presenter_id and presenter_id
    const updateData = {
      name: agendaData.name,
      description: agendaData.description || '',
      status: agendaData.status || 'draft',
      sort_order: agendaData.sort_order || 1,
      presenter_id: agendaData.presenter_id || null,
      ministry_id: agendaData.ministry_id || null,
      cabinet_approval_required: agendaData.cabinet_approval_required || false
    };

    console.log('🔄 Updating agenda with data:', updateData);

    // Update the agenda item with both presenter fields
    const result = await query(
      `
      UPDATE agenda SET
        name = $1,
        description = $2,
        status = $3,
        sort_order = $4,
        presenter_id = $5,
        ministry_id = $6,
        cabinet_approval_required = $7,
        updated_at = NOW()
      WHERE id = $8
      RETURNING *
      `,
      [
        updateData.name,
        updateData.description,
        updateData.status,
        updateData.sort_order,
        updateData.presenter_id,
        updateData.ministry_id,
        updateData.cabinet_approval_required,
        agendaId
      ]
    );

    if (result.rows.length === 0) {
      throw new Error('Failed to update agenda item - no rows affected');
    }

    const updatedAgenda = result.rows[0];
    console.log('✅ Agenda item updated successfully:', updatedAgenda);

    return NextResponse.json(updatedAgenda);

  } catch (error: any) {
    console.error('❌ Error updating agenda item:', error);
    
    const errorResponse = {
      error: 'Failed to update agenda item',
      details: error.message,
      code: error.code,
      timestamp: new Date().toISOString()
    };
    
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    const agendaId = id;

    console.log('🗑️ Deleting agenda item:', agendaId);

    // Check if agenda exists
    const existingAgenda = await query(
      'SELECT id FROM agenda WHERE id = $1',
      [agendaId]
    );

    if (existingAgenda.rows.length === 0) {
      return NextResponse.json(
        { error: 'Agenda item not found' },
        { status: 404 }
      );
    }

    // Delete the agenda item
    await query(
      'DELETE FROM agenda WHERE id = $1',
      [agendaId]
    );

    console.log('✅ Agenda item deleted successfully:', agendaId);
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('❌ Error deleting agenda item:', error);
    return NextResponse.json(
      { error: 'Failed to delete agenda item' },
      { status: 500 }
    );
  }
}