'use client';
// Upload an agenda document straight to Supabase Storage (no 4.5 MB Vercel limit).
// Usage: const doc = await uploadAgendaDocument(file, agendaId, { name, onProgress });

export interface UploadedAgendaDocument {
  id: number;
  agenda_id: number;
  name: string;
  file_type: string;
  file_url: string;
  file_size: number;
  uploaded_at: string;
}

async function post<T>(body: unknown): Promise<T> {
  const res = await fetch('/api/agenda/documents', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Upload failed (HTTP ${res.status})`);
  return data as T;
}

export async function uploadAgendaDocument(
  file: File,
  agendaId: number | string,
  opts: { name?: string; onProgress?: (fraction: number) => void } = {},
): Promise<UploadedAgendaDocument> {
  const { path, signedUrl } = await post<{ path: string; signedUrl: string }>({
    action: 'sign',
    agendaId,
    fileName: file.name,
  });

  // PUT the bytes to the signed URL, with progress.
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', signedUrl);
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
    xhr.setRequestHeader('x-upsert', 'false');
    xhr.upload.onprogress = (e) => e.lengthComputable && opts.onProgress?.(e.loaded / e.total);
    xhr.onload = () => (xhr.status < 300 ? resolve() : reject(new Error(`Storage upload failed (HTTP ${xhr.status})`)));
    xhr.onerror = () => reject(new Error('Network error while uploading'));
    xhr.send(file);
  });

  return post<UploadedAgendaDocument>({
    action: 'record',
    agendaId,
    path,
    name: opts.name || file.name,
    size: file.size,
    mimeType: file.type,
  });
}
