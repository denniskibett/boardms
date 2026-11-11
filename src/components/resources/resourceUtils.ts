// Small helpers shared by the resource components.
import type { ResourceFile } from '@/lib/store/slices/resourcesSlice';

export function formatFileSize(bytes?: number | null): string {
  if (!bytes) return '—';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  return `${parseFloat((bytes / Math.pow(1024, i)).toFixed(1))} ${units[i]}`;
}

export const typeLabel = (name?: string | null) => (name ? name.replace(/_/g, ' ') : 'Uncategorised');

export function openFile(file: ResourceFile) {
  window.open(file.file_url, '_blank', 'noopener,noreferrer');
}

/** Downloads with the stored file name (the public URL is cross-origin, so fetch it as a blob). */
export async function downloadFile(file: ResourceFile) {
  try {
    const res = await fetch(file.file_url);
    if (!res.ok) throw new Error('Download failed');
    const url = URL.createObjectURL(await res.blob());
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name || file.display_name || 'download';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch {
    openFile(file);
  }
}
