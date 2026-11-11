// Server helpers for meeting books. Cover overrides are stored as JSON in Storage
// (agenda-documents/books/<meetingId>/cover.json) so no schema change is needed.
import { supabaseServer } from '@/lib/supabase/server';
import type { BookCover, MeetingBookData, BookSection } from './types';

const BUCKET = 'agenda-documents';
const coverPath = (meetingId: number) => `books/${meetingId}/cover.json`;

export async function readCover(meetingId: number): Promise<BookCover> {
  const { data } = await supabaseServer().storage.from(BUCKET).download(coverPath(meetingId));
  if (!data) return {};
  try {
    return JSON.parse(await data.text()) as BookCover;
  } catch {
    return {};
  }
}

export async function writeCover(meetingId: number, cover: BookCover) {
  const clean: BookCover = {};
  for (const k of ['title', 'subtitle', 'reference', 'classification', 'preparedBy', 'note'] as const) {
    const v = cover[k];
    if (typeof v === 'string' && v.trim()) clean[k] = v.trim().slice(0, 500);
  }
  const { error } = await supabaseServer()
    .storage.from(BUCKET)
    .upload(coverPath(meetingId), JSON.stringify(clean), { contentType: 'application/json', upsert: true });
  if (error) throw error;
  return clean;
}

export async function loadMeetingBook(meetingId: number): Promise<MeetingBookData | null> {
  const db = supabaseServer();
  const { data: m } = await db.from('meetings').select('*').eq('id', meetingId).maybeSingle();
  if (!m) return null;

  const [{ data: agenda }, { data: settings }, cover, chair] = await Promise.all([
    db.from('agenda').select('*').eq('meeting_id', meetingId).order('sort_order', { ascending: true }),
    db.from('system_settings').select('name, slogan, logo, logo_primary').order('id', { ascending: false }).limit(1).maybeSingle(),
    readCover(meetingId),
    m.chair_id ? db.from('users').select('name').eq('id', m.chair_id).maybeSingle() : Promise.resolve({ data: null }),
  ]);

  const items = agenda ?? [];
  const ids = items.map((a) => a.id);
  const ministryIds = [...new Set(items.map((a) => a.ministry_id).filter(Boolean))];
  const presenterIds = [...new Set(items.map((a) => a.presenter_id).filter(Boolean))];

  const [{ data: docs }, { data: ministries }, { data: presenters }] = await Promise.all([
    ids.length
      ? db.from('agenda_documents').select('id, agenda_id, name, file_type, file_url, file_size, uploaded_at').in('agenda_id', ids).order('uploaded_at', { ascending: true })
      : Promise.resolve({ data: [] as never[] }),
    ministryIds.length ? db.from('ministries').select('id, name').in('id', ministryIds) : Promise.resolve({ data: [] as never[] }),
    presenterIds.length ? db.from('users').select('id, name').in('id', presenterIds) : Promise.resolve({ data: [] as never[] }),
  ]);

  const ministryName = new Map((ministries ?? []).map((x: { id: number; name: string }) => [String(x.id), x.name]));
  const presenterName = new Map((presenters ?? []).map((x: { id: number; name: string }) => [String(x.id), x.name]));

  const sections: BookSection[] = items.map((a, i) => ({
    id: a.id,
    order: i + 1,
    title: a.name,
    description: a.description,
    status: a.status,
    approvalRequired: !!a.cabinet_approval_required,
    ministry: a.ministry_id ? ministryName.get(String(a.ministry_id)) ?? null : null,
    presenter: a.presenter_id ? presenterName.get(String(a.presenter_id)) ?? null : null,
    documents: (docs ?? [])
      .filter((d: { agenda_id: number }) => d.agenda_id === a.id)
      .map((d: { id: number; name: string; file_type: string; file_url: string; file_size: number }) => ({
        id: d.id,
        name: d.name,
        file_type: d.file_type,
        file_url: d.file_url,
        file_size: d.file_size,
      })),
  }));

  return {
    meeting: {
      id: Number(m.id),
      name: m.name,
      type: m.type,
      start_at: m.start_at,
      end_at: m.actual_end,
      location: m.location,
      status: m.status,
      description: m.description,
      chair: (chair as { data: { name?: string } | null }).data?.name ?? null,
    },
    org: {
      name: settings?.name || 'Cabinet Office',
      slogan: settings?.slogan,
      logo: settings?.logo_primary || settings?.logo || null,
    },
    cover,
    sections,
    updatedAt: new Date().toISOString(),
  };
}
