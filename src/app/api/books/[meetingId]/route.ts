// GET  /api/books/:meetingId  — everything needed to read or print the meeting book (books.view)
// PUT  /api/books/:meetingId  — save cover details { title, subtitle, reference, classification, preparedBy, note } (books.edit)
import { NextRequest, NextResponse } from 'next/server';
import { requireAccess } from '@/lib/auth/permissions';
import { loadMeetingBook, writeCover } from '@/lib/books/server';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ meetingId: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const g = await requireAccess('books', 'view');
  if (g.error) return g.error;
  const id = Number((await params).meetingId);
  if (!id) return NextResponse.json({ error: 'Invalid meeting' }, { status: 400 });
  const book = await loadMeetingBook(id);
  if (!book) return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
  return NextResponse.json(book);
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  const g = await requireAccess('books', 'edit');
  if (g.error) return g.error;
  const id = Number((await params).meetingId);
  if (!id) return NextResponse.json({ error: 'Invalid meeting' }, { status: 400 });
  try {
    const cover = await writeCover(id, await req.json());
    return NextResponse.json({ cover });
  } catch (e) {
    console.error('Saving book cover failed:', e);
    return NextResponse.json({ error: 'Could not save the cover' }, { status: 500 });
  }
}
