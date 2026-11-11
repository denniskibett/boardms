// Shared helpers for the /api/resources routes.
import { supabaseServer } from '@/lib/supabase/server';
import { lookup } from '../memos/_lib/helpers';

export const BUCKET = 'documents';

/** Adds resource_type_name, created_by_name and file_count to resource rows. */
export async function enrichResources<R extends { resource_type_id?: number | null; created_by?: number | null; resource_files?: { count: number }[] }>(
  rows: R[],
) {
  const [types, users] = await Promise.all([
    lookup<{ id: number; name: string }>('categories', rows.map((r) => r.resource_type_id)),
    lookup<{ id: number; name: string }>('users', rows.map((r) => r.created_by)),
  ]);
  return rows.map(({ resource_files, ...r }) => ({
    ...r,
    resource_type_name: r.resource_type_id ? types.get(r.resource_type_id)?.name ?? null : null,
    created_by_name: r.created_by ? users.get(r.created_by)?.name ?? null : null,
    file_count: resource_files?.[0]?.count ?? 0,
  }));
}

/** Adds ministry_name and uploaded_by_name to resource_files rows. */
export async function enrichFiles<F extends { ministry_id?: number | null; uploaded_by?: number | null }>(rows: F[]) {
  const [ministries, users] = await Promise.all([
    lookup<{ id: number; name: string }>('ministries', rows.map((r) => r.ministry_id)),
    lookup<{ id: number; name: string }>('users', rows.map((r) => r.uploaded_by)),
  ]);
  return rows.map((f) => ({
    ...f,
    ministry_name: f.ministry_id ? ministries.get(f.ministry_id)?.name ?? null : null,
    uploaded_by_name: f.uploaded_by ? users.get(f.uploaded_by)?.name ?? null : null,
  }));
}

/** Object path inside the bucket for a stored file (from metadata, else parsed from the public URL). */
export function storagePathOf(file: { file_url?: string | null; metadata?: { storagePath?: string } | null }): string | null {
  if (file.metadata?.storagePath) return file.metadata.storagePath;
  if (!file.file_url) return null;
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const i = file.file_url.indexOf(marker);
  return i === -1 ? null : decodeURIComponent(file.file_url.slice(i + marker.length));
}

/** "Cabinet Meeting Jan" → "CABINET-MEETING-JAN" (folder name). */
export function folderName(name: string) {
  return name.toUpperCase().trim().replace(/\s+/g, '-').replace(/[^A-Z0-9-]/g, '');
}

export function resourceFields(body: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  if (typeof body.name === 'string') out.name = folderName(body.name);
  if (typeof body.display_name === 'string') out.display_name = body.display_name.trim();
  if (body.resource_type_id !== undefined) out.resource_type_id = parseInt(String(body.resource_type_id), 10) || null;
  if (body.year !== undefined) out.year = parseInt(String(body.year), 10) || null;
  if (body.description !== undefined) out.description = body.description ? String(body.description).trim() : null;
  if (body.metadata !== undefined) out.metadata = body.metadata;
  return out;
}

export async function removeStoredFiles(paths: (string | null)[]) {
  const list = paths.filter((p): p is string => !!p);
  if (!list.length) return;
  const { error } = await supabaseServer().storage.from(BUCKET).remove(list);
  if (error) console.error('Could not remove files from storage:', error.message);
}
