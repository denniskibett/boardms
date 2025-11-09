import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Calculate next sort order if not provided
    let sort_order = body.sort_order;
    if (!sort_order) {
      const lastAgenda = await prisma.agenda.findFirst({
        where: { meeting_id: body.meeting_id },
        orderBy: { sort_order: 'desc' }
      });
      sort_order = lastAgenda ? lastAgenda.sort_order + 1 : 1;
    }
    
    const agenda = await prisma.agenda.create({
      data: {
        meeting_id: body.meeting_id,
        name: body.name,
        ministry_id: body.ministry_id || null,
        presenter_name: body.presenter_name || '',
        sort_order: sort_order,
        description: body.description || '',
        status: body.status || 'draft',
        cabinet_approval_required: body.cabinet_approval_required || false,
        created_by: body.created_by || 'system', // Replace with actual user from auth
      },
      include: {
        documents: true,
        ministry: true,
      }
    });

    return NextResponse.json(agenda);
  } catch (error) {
    console.error('Error creating agenda:', error);
    return NextResponse.json(
      { error: 'Failed to create agenda' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const meetingId = searchParams.get('meetingId');

    if (!meetingId) {
      // Return all agendas if no meetingId provided
      const agendas = await prisma.agenda.findMany({
        include: {
          documents: true,
          ministry: true,
          meeting: {
            select: {
              id: true,
              name: true,
              start_at: true,
              location: true
            }
          }
        },
        orderBy: { created_at: 'desc' }
      });
      return NextResponse.json(agendas);
    }

    const agendas = await prisma.agenda.findMany({
      where: { meeting_id: meetingId },
      include: {
        documents: true,
        ministry: true,
      },
      orderBy: { sort_order: 'asc' }
    });

    return NextResponse.json(agendas);
  } catch (error) {
    console.error('Error fetching agendas:', error);
    return NextResponse.json(
      { error: 'Failed to fetch agendas' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Agenda ID is required' },
        { status: 400 }
      );
    }

    const agenda = await prisma.agenda.update({
      where: { id },
      data: updateData,
      include: {
        documents: true,
        ministry: true,
      }
    });

    return NextResponse.json(agenda);
  } catch (error) {
    console.error('Error updating agenda:', error);
    return NextResponse.json(
      { error: 'Failed to update agenda' },
      { status: 500 }
    );
  }
}