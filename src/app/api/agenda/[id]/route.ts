import { NextRequest, NextResponse } from 'next/server';
import { supabaseDb } from '@/lib/supabase-db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const agendaId = id;

    console.log('🔍 Fetching agenda item:', agendaId);

    // Use supabaseDb.select method
    const result = await supabaseDb.select('agenda', {
      select: '*',
      eq: {
        field: 'id',
        value: agendaId
      }
    });

    console.log('🔍 Query result:', result);

    if (result.rows.length === 0) {
      console.log('❌ Agenda item not found:', agendaId);
      return NextResponse.json(
        { error: 'Agenda item not found' },
        { status: 404 }
      );
    }

    const agenda = result.rows[0];
    console.log('✅ Agenda item fetched successfully:', agenda.id);

    // Get ministry name if ministry_id exists
    let ministry_name = null;
    if (agenda.ministry_id) {
      try {
        const ministryResult = await supabaseDb.select('ministries', {
          select: 'name',
          eq: {
            field: 'id',
            value: agenda.ministry_id
          }
        });
        if (ministryResult.rows.length > 0) {
          ministry_name = ministryResult.rows[0].name;
        }
      } catch (error) {
        console.error('Error fetching ministry name:', error);
      }
    }

    // Get presenter name if presenter_id exists
    let presenter_name = null;
    if (agenda.presenter_id) {
      try {
        const presenterResult = await supabaseDb.select('users', {
          select: 'name',
          eq: {
            field: 'id',
            value: agenda.presenter_id
          }
        });
        if (presenterResult.rows.length > 0) {
          presenter_name = presenterResult.rows[0].name;
        }
      } catch (error) {
        console.error('Error fetching presenter name:', error);
      }
    }

    return NextResponse.json({
      id: agenda.id,
      name: agenda.name,
      description: agenda.description || '',
      status: agenda.status,
      sort_order: agenda.sort_order,
      presenter_id: agenda.presenter_id,
      ministry_id: agenda.ministry_id,
      memo_id: agenda.memo_id,
      cabinet_approval_required: agenda.cabinet_approval_required,
      meeting_id: agenda.meeting_id,
      created_at: agenda.created_at,
      updated_at: agenda.updated_at,
      created_by: agenda.created_by,
      ministry_name: ministry_name,
      presenter_name: presenter_name
    });
  } catch (error: any) {
    console.error('❌ Error fetching agenda item:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch agenda item',
        details: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    // Check if agenda exists using supabaseDb
    const existingAgenda = await supabaseDb.select('agenda', {
      select: 'id',
      eq: {
        field: 'id',
        value: agendaId
      }
    });

    if (existingAgenda.rows.length === 0) {
      return NextResponse.json(
        { error: 'Agenda item not found' },
        { status: 404 }
      );
    }

    // FIX: Handle null/empty values properly
    // Convert empty strings to null for foreign keys
    const presenterId = agendaData.presenter_id === '' || agendaData.presenter_id === 'null' ? null : agendaData.presenter_id;
    const ministryId = agendaData.ministry_id === '' || agendaData.ministry_id === 'null' ? null : agendaData.ministry_id;

    // Prepare update data
    const updateData: any = {
      name: agendaData.name,
      description: agendaData.description || '',
      status: agendaData.status || 'draft',
      sort_order: agendaData.sort_order || 1,
      cabinet_approval_required: agendaData.cabinet_approval_required || false,
      updated_at: new Date().toISOString()
    };

    // Only include presenter_id and ministry_id if they have values
    if (presenterId !== null) {
      updateData.presenter_id = parseInt(presenterId);
    } else {
      updateData.presenter_id = null; // Explicitly set to null
    }

    if (ministryId !== null) {
      updateData.ministry_id = parseInt(ministryId);
    } else {
      updateData.ministry_id = null; // Explicitly set to null
    }

    console.log('🔄 Updating agenda with data:', updateData);

    // Update using supabaseDb
    const result = await supabaseDb.update('agenda', updateData, {
      field: 'id',
      value: agendaId
    });

    console.log('🔄 Update result:', result);

    if (!result.rows || result.rows.length === 0) {
      console.error('❌ No rows affected by update');
      throw new Error('Failed to update agenda item - no rows affected');
    }

    const updatedAgenda = result.rows[0];
    console.log('✅ Agenda item updated successfully:', updatedAgenda);

    // Get ministry and presenter names for the response
    let ministry_name = null;
    let presenter_name = null;

    if (updatedAgenda.ministry_id) {
      try {
        const ministryResult = await supabaseDb.select('ministries', {
          select: 'name',
          eq: {
            field: 'id',
            value: updatedAgenda.ministry_id
          }
        });
        if (ministryResult.rows.length > 0) {
          ministry_name = ministryResult.rows[0].name;
        }
      } catch (error) {
        console.error('Error fetching ministry name:', error);
      }
    }

    if (updatedAgenda.presenter_id) {
      try {
        const presenterResult = await supabaseDb.select('users', {
          select: 'name',
          eq: {
            field: 'id',
            value: updatedAgenda.presenter_id
          }
        });
        if (presenterResult.rows.length > 0) {
          presenter_name = presenterResult.rows[0].name;
        }
      } catch (error) {
        console.error('Error fetching presenter name:', error);
      }
    }

    return NextResponse.json({
      ...updatedAgenda,
      ministry_name,
      presenter_name
    });

  } catch (error: any) {
    console.error('❌ Error updating agenda item:', error);
    
    const errorResponse = {
      error: 'Failed to update agenda item',
      details: error.message,
      code: error.code || 'UNKNOWN_ERROR',
      timestamp: new Date().toISOString()
    };
    
    console.error('❌ Returning error response:', errorResponse);
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const agendaId = id;

    console.log('🗑️ Deleting agenda item:', agendaId);

    // Check if agenda exists using supabaseDb
    const existingAgenda = await supabaseDb.select('agenda', {
      select: 'id',
      eq: {
        field: 'id',
        value: agendaId
      }
    });

    if (existingAgenda.rows.length === 0) {
      return NextResponse.json(
        { error: 'Agenda item not found' },
        { status: 404 }
      );
    }

    // Delete using supabaseDb
    const result = await supabaseDb.delete('agenda', {
      field: 'id',
      value: agendaId
    });

    console.log('🗑️ Delete result:', result);

    console.log('✅ Agenda item deleted successfully:', agendaId);
    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('❌ Error deleting agenda item:', error);
    return NextResponse.json(
      { 
        error: 'Failed to delete agenda item',
        details: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}