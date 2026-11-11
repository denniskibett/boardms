// src/app/api/resources/[id]/files/route.ts — files of a resource, stored in the public Supabase Storage bucket "documents".
import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { requireAccess } from '@/lib/auth/permissions';
import { dbUserId, errorMessage, toInt } from '../../../memos/_lib/helpers';
import { BUCKET, enrichFiles, removeStoredFiles, storagePathOf } from '../../_lib';

type Ctx = { params: Promise<{ id: string }> };

const MAX_BYTES = 50 * 1024 * 1024;

/** POST multipart/form-data { file, displayName?, ministryId? } — upload a file into the resource folder. */
export async function POST(request: NextRequest, { params }: Ctx) {
  const g = await requireAccess('resources', 'create');
  if (g.error) return g.error;

  const resourceId = toInt((await params).id);
  if (!resourceId) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const ministryId = toInt(formData.get('ministryId'));
    const displayName = String(formData.get('displayName') ?? '').trim();

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'File size must be less than 50MB' }, { status: 400 });
    }

    const supabase = supabaseServer();
    const { data: resource } = await supabase.from('resources').select('id, name, year, resource_type_id').eq('id', resourceId).maybeSingle();
    if (!resource) return NextResponse.json({ error: 'Resource not found' }, { status: 404 });

    const [{ data: type }, { data: ministry }] = await Promise.all([
      resource.resource_type_id
        ? supabase.from('categories').select('name').eq('id', resource.resource_type_id).maybeSingle()
        : Promise.resolve({ data: null }),
      ministryId ? supabase.from('ministries').select('name').eq('id', ministryId).maybeSingle() : Promise.resolve({ data: null }),
    ]);
    const typeName = safeSegment(type?.name ?? 'UNCATEGORIZED');

    const ext = (file.name.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '');
    const uniqueFileName = `${Date.now()}-${Math.random().toString(36).slice(2, 12)}.${ext}`;
    const folderPath = `resources/${typeName}/${resource.year}/${safeSegment(resource.name)}`;
    const filePath = `${folderPath}/${uniqueFileName}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(filePath, Buffer.from(await file.arrayBuffer()), { contentType: file.type || undefined, upsert: false });
    if (uploadError) {
      return NextResponse.json({ error: 'Failed to upload file to storage: ' + uploadError.message }, { status: 500 });
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET).getPublicUrl(filePath);

    const { data: saved, error: dbError } = await supabase
      .from('resource_files')
      .insert({
        resource_id: resourceId,
        name: standardFileName(file.name, ministry?.name ?? null),
        display_name: displayName || file.name,
        file_type: fileType(ext),
        file_url: publicUrl,
        file_size: file.size,
        ministry_id: ministryId,
        uploaded_by: await dbUserId(g.user),
        metadata: {
          originalName: file.name,
          uploadedAt: new Date().toISOString(),
          mimeType: file.type,
          ministryName: ministry?.name ?? null,
          resourceType: type?.name ?? null,
          year: resource.year,
          resourceName: resource.name,
          folderStructure: folderPath,
          uniqueFileName,
          storagePath: filePath,
        },
      })
      .select()
      .single();

    if (dbError) {
      await removeStoredFiles([filePath]);
      return NextResponse.json({ error: 'Failed to save file record: ' + dbError.message }, { status: 500 });
    }

    const [formatted] = await enrichFiles([saved]);
    return NextResponse.json(formatted, { status: 201 });
  } catch (error) {
    console.error('Error uploading resource file:', error);
    return NextResponse.json({ error: 'Failed to upload resource file: ' + errorMessage(error) }, { status: 500 });
  }
}

/** GET — list the resource's files. */
export async function GET(_request: NextRequest, { params }: Ctx) {
  const g = await requireAccess('resources', 'view');
  if (g.error) return g.error;

  const resourceId = toInt((await params).id);
  if (!resourceId) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const { data, error } = await supabaseServer()
    .from('resource_files')
    .select('*')
    .eq('resource_id', resourceId)
    .order('uploaded_at', { ascending: false });
  if (error) return NextResponse.json({ error: 'Failed to fetch files: ' + error.message }, { status: 500 });
  return NextResponse.json(await enrichFiles(data ?? []));
}

/** DELETE ?fileId=… — remove one file (storage object + record). */
export async function DELETE(request: NextRequest, { params }: Ctx) {
  const g = await requireAccess('resources', 'delete');
  if (g.error) return g.error;

  const resourceId = toInt((await params).id);
  const fileId = toInt(new URL(request.url).searchParams.get('fileId'));
  if (!resourceId || !fileId) return NextResponse.json({ error: 'Resource id and fileId are required' }, { status: 400 });

  const supabase = supabaseServer();
  const { data: existing } = await supabase
    .from('resource_files')
    .select('id, file_url, metadata')
    .eq('id', fileId)
    .eq('resource_id', resourceId)
    .maybeSingle();
  if (!existing) return NextResponse.json({ error: 'File not found' }, { status: 404 });

  await removeStoredFiles([storagePathOf(existing)]);

  const { error } = await supabase.from('resource_files').delete().eq('id', fileId).eq('resource_id', resourceId);
  if (error) return NextResponse.json({ error: 'Failed to delete file record: ' + error.message }, { status: 500 });
  return NextResponse.json({ success: true, deletedFileId: fileId, resourceId });
}

function safeSegment(s: string) {
  return s.trim().replace(/[^A-Za-z0-9_-]+/g, '_') || 'UNNAMED';
}

/** "Budget memo.pdf" + "Ministry of X" → "MINISTRY_OF_X_BUDGET_MEMO.pdf" */
function standardFileName(originalName: string, ministryName: string | null) {
  const dot = originalName.lastIndexOf('.');
  const ext = dot > 0 ? originalName.slice(dot + 1) : '';
  const base = (dot > 0 ? originalName.slice(0, dot) : originalName).toUpperCase().replace(/[^A-Z0-9]/g, '_');
  const prefix = ministryName ? `${ministryName.toUpperCase().replace(/[^A-Z0-9]/g, '_')}_` : '';
  return ext ? `${prefix}${base}.${ext}` : `${prefix}${base}`;
}

function fileType(ext: string): string {
  const map: Record<string, string> = {
    pdf: 'pdf', doc: 'word', docx: 'word', ppt: 'powerpoint', pptx: 'powerpoint', xls: 'excel', xlsx: 'excel',
    txt: 'text', jpg: 'image', jpeg: 'image', png: 'image', gif: 'image', zip: 'archive', rar: 'archive', '7z': 'archive',
  };
  return map[ext] || 'other';
}
