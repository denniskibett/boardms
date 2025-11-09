// app/api/annotations/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const body = await request.json();
  
  const newAnnotation = {
    id: Math.random().toString(36).substr(2, 9),
    ...body,
    created_at: new Date().toISOString(),
    author: "Current User" // Get from auth
  };

  return NextResponse.json(newAnnotation, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const annotationId = searchParams.get('id');

  // Delete annotation logic
  return NextResponse.json({ success: true });
}