// src/app/api/annotations/route.ts
// Annotations are not persisted yet (no table). The previous handler returned fabricated rows;
// it now reports that honestly instead of pretending to save.
import { NextResponse } from 'next/server';
import { requireAccess } from '@/lib/auth/permissions';

export async function POST() {
  const g = await requireAccess('agenda', 'create');
  if (g.error) return g.error;
  return NextResponse.json({ error: 'Annotations are not available yet' }, { status: 501 });
}

export async function DELETE() {
  const g = await requireAccess('agenda', 'delete');
  if (g.error) return g.error;
  return NextResponse.json({ error: 'Annotations are not available yet' }, { status: 501 });
}
