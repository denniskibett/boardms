import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const agenda = await prisma.agenda.findUnique({
      where: { id: params.id },
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
      }
    });

    if (!agenda) {
      return NextResponse.json(
        { error: 'Agenda not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(agenda);
  } catch (error) {
    console.error('Error fetching agenda:', error);
    return NextResponse.json(
      { error: 'Failed to fetch agenda' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    const agenda = await prisma.agenda.update({
      where: { id: params.id },
      data: body,
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.agenda.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting agenda:', error);
    return NextResponse.json(
      { error: 'Failed to delete agenda' },
      { status: 500 }
    );
  }
}