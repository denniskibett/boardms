/**
 * Move agenda documents saved on local disk (public/uploads/agenda_documents, file_url "/uploads/…")
 * into the Supabase bucket `agenda-documents`, and point agenda_documents.file_url at the bucket.
 * Needed because Vercel's disk is temporary and the PowerPoint viewer needs a public https link.
 *
 *   pnpm tsx scripts/migrate-agenda-uploads.ts           # dry run
 *   pnpm tsx scripts/migrate-agenda-uploads.ts --apply   # upload + update rows (backup of rows in backups/)
 */
import 'dotenv/config';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { createClient } from '@supabase/supabase-js';

const apply = process.argv.includes('--apply');
const BUCKET = 'agenda-documents';
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
});

const MIME: Record<string, string> = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  csv: 'text/csv',
  txt: 'text/plain',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
};

async function main() {
  const { data: rows, error } = await db.from('agenda_documents').select('*').like('file_url', '/uploads/%');
  if (error) throw error;
  console.log(`${rows?.length ?? 0} documents still point at local disk.`);
  if (!rows?.length) return;

  if (apply) {
    mkdirSync('backups', { recursive: true });
    const f = `backups/agenda_documents-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    writeFileSync(f, JSON.stringify(rows, null, 2));
    console.log(`Backup written: ${f}`);
  }

  let moved = 0;
  for (const r of rows) {
    const local = join(process.cwd(), 'public', r.file_url);
    if (!existsSync(local)) {
      console.log(`  MISSING  #${r.id} ${r.file_url} — file not on this machine, skipped`);
      continue;
    }
    const fileName = r.file_url.split('/').pop()!;
    const path = `agenda/${r.agenda_id}/${fileName}`;
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    console.log(`  ${apply ? 'MOVE' : 'would move'}  #${r.id} ${fileName} → ${BUCKET}/${path}`);
    if (!apply) continue;

    const { error: up } = await db.storage
      .from(BUCKET)
      .upload(path, readFileSync(local), { contentType: MIME[ext] || 'application/octet-stream', upsert: true });
    if (up) {
      console.log(`    upload failed: ${up.message}`);
      continue;
    }
    const url = db.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
    let meta: Record<string, unknown> = {};
    try {
      meta = typeof r.metadata === 'string' ? JSON.parse(r.metadata) : r.metadata || {};
    } catch {}
    const { error: upd } = await db
      .from('agenda_documents')
      .update({ file_url: url, metadata: JSON.stringify({ ...meta, storage: { bucket: BUCKET, path } }) })
      .eq('id', r.id);
    if (upd) console.log(`    row update failed: ${upd.message}`);
    else moved++;
  }
  console.log(apply ? `\nMoved ${moved} of ${rows.length}.` : '\nDry run only. Re-run with --apply.');
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
