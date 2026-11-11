// /api/agenda/documents — agenda item documents, stored in the Supabase bucket `agenda-documents`.
//
// Upload flow (works for large files; Vercel caps request bodies at ~4.5 MB):
//   1. POST { action: 'sign', agendaId, fileName }  → { path, token, signedUrl }   (needs agenda.create)
//   2. browser uploads the bytes straight to Storage with that signed URL
//   3. POST { action: 'record', agendaId, path, name, size, mimeType } → saved row
// `src/lib/agenda-documents.ts` wraps this for the UI. A multipart POST (file + agendaId) is still
// accepted for small files.
import { NextRequest, NextResponse } from 'next/server';
import { requireAccess } from '@/lib/auth/permissions';
import { supabaseServer } from '@/lib/supabase/server';

const BUCKET = 'agenda-documents';
const MAX_BYTES = 100 * 1024 * 1024;

const TYPE_BY_EXT: Record<string, string> = {
  pdf: 'pdf',
  doc: 'word',
  docx: 'word',
  ppt: 'powerpoint',
  pptx: 'powerpoint',
  xls: 'excel',
  xlsx: 'excel',
  csv: 'excel',
  txt: 'text',
  jpg: 'image',
  jpeg: 'image',
  png: 'image',
  gif: 'image',
  webp: 'image',
};

function ext(name: string) {
  return name.split('.').pop()?.toLowerCase() || '';
}

function storagePath(agendaId: number, fileName: string) {
  const safe = fileName.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-120);
  return `agenda/${agendaId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safe}`;
}

async function agendaExists(id: number) {
  const { data } = await supabaseServer().from('agenda').select('id').eq('id', id).maybeSingle();
  return !!data;
}

async function profileId(email: string) {
  const { data } = await supabaseServer().from('users').select('id').eq('email', email).maybeSingle();
  return data?.id ?? null;
}

async function record(opts: {
  agendaId: number;
  path: string;
  name: string;
  size: number;
  mimeType?: string;
  user: { email: string; name?: string | null };
}) {
  const db = supabaseServer();
  const { data: pub } = db.storage.from(BUCKET).getPublicUrl(opts.path);
  const e = ext(opts.name) || ext(opts.path);
  const { data, error } = await db
    .from('agenda_documents')
    .insert({
      agenda_id: opts.agendaId,
      name: opts.name,
      file_type: TYPE_BY_EXT[e] || 'other',
      file_url: pub.publicUrl,
      file_size: opts.size,
      uploaded_by: await profileId(opts.user.email),
      uploaded_at: new Date().toISOString(),
      metadata: JSON.stringify({
        storage: { bucket: BUCKET, path: opts.path },
        originalName: opts.name,
        mimeType: opts.mimeType,
        fileExtension: e,
        uploadedBy: opts.user.name || opts.user.email,
      }),
      created_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (error) {
    await db.storage.from(BUCKET).remove([opts.path]);
    throw error;
  }
  return data;
}

export async function POST(request: NextRequest) {
  const g = await requireAccess('agenda', 'create');
  if (g.error) return g.error;

  try {
    // Signed-upload flow
    if (request.headers.get('content-type')?.includes('application/json')) {
      const body = await request.json();
      const agendaId = Number(body.agendaId);
      if (!agendaId || !(await agendaExists(agendaId))) {
        return NextResponse.json({ error: 'Agenda not found' }, { status: 404 });
      }

      if (body.action === 'sign') {
        if (!body.fileName) return NextResponse.json({ error: 'fileName is required' }, { status: 400 });
        const path = storagePath(agendaId, String(body.fileName));
        const { data, error } = await supabaseServer().storage.from(BUCKET).createSignedUploadUrl(path);
        if (error) throw error;
        return NextResponse.json({ path, token: data.token, signedUrl: data.signedUrl });
      }

      if (body.action === 'record') {
        const path = String(body.path || '');
        if (!path.startsWith(`agenda/${agendaId}/`)) {
          return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
        }
        const doc = await record({
          agendaId,
          path,
          name: String(body.name || path.split('/').pop()),
          size: Number(body.size) || 0,
          mimeType: body.mimeType,
          user: g.user,
        });
        return NextResponse.json(doc);
      }

      return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }

    // Multipart (small files)
    const form = await request.formData();
    const file = form.get('file') as File | null;
    const agendaId = Number(form.get('agendaId'));
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    if (file.size > MAX_BYTES) return NextResponse.json({ error: 'File is larger than 100 MB' }, { status: 413 });
    if (!agendaId || !(await agendaExists(agendaId))) {
      return NextResponse.json({ error: 'Agenda not found' }, { status: 404 });
    }
    const path = storagePath(agendaId, file.name);
    const { error: upErr } = await supabaseServer()
      .storage.from(BUCKET)
      .upload(path, Buffer.from(await file.arrayBuffer()), { contentType: file.type || undefined });
    if (upErr) throw upErr;
    const doc = await record({
      agendaId,
      path,
      name: (form.get('name') as string) || file.name,
      size: file.size,
      mimeType: file.type,
      user: g.user,
    });
    return NextResponse.json(doc);
  } catch (error) {
    console.error('Agenda document upload failed:', error);
    return NextResponse.json({ error: 'Failed to upload document' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const g = await requireAccess('agenda', 'view');
  if (g.error) return g.error;

  const agendaId = Number(new URL(request.url).searchParams.get('agendaId'));
  if (!agendaId) return NextResponse.json({ error: 'Agenda ID is required' }, { status: 400 });

  const { data, error } = await supabaseServer()
    .from('agenda_documents')
    .select('*')
    .eq('agenda_id', agendaId)
    .order('uploaded_at', { ascending: false });
  if (error) return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function DELETE(request: NextRequest) {
  const g = await requireAccess('agenda', 'delete');
  if (g.error) return g.error;

  const id = Number(new URL(request.url).searchParams.get('documentId'));
  if (!id) return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });

  const db = supabaseServer();
  const { data: doc } = await db.from('agenda_documents').select('*').eq('id', id).maybeSingle();
  if (!doc) return NextResponse.json({ error: 'Document not found' }, { status: 404 });

  // Remove the stored file (new uploads record their storage path; older ones are bucket URLs).
  try {
    const meta = typeof doc.metadata === 'string' ? JSON.parse(doc.metadata) : doc.metadata;
    let path: string | undefined = meta?.storage?.path;
    if (!path && typeof doc.file_url === 'string') {
      const m = doc.file_url.match(new RegExp(`/object/public/${BUCKET}/(.+)$`));
      if (m) path = decodeURIComponent(m[1]);
    }
    if (path) await db.storage.from(BUCKET).remove([path]);
  } catch {
    // keep going — the row is what the UI shows
  }

  const { error } = await db.from('agenda_documents').delete().eq('id', id);
  if (error) return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 });
  return NextResponse.json({ success: true });
}
