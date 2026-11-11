'use client';

import React, { useEffect, useRef, useState } from 'react';
import { FileText, Upload } from 'lucide-react';
import { Btn, Field, FormGrid, SelectInput, SlideOver, TextInput } from '@/components/ui/kit';
import { useResources } from '@/hooks/useResources';
import type { Resource } from '@/lib/store/slices/resourcesSlice';
import { formatFileSize, typeLabel } from './resourceUtils';

interface Props {
  open: boolean;
  resource: Resource | null;
  onClose: () => void;
  onUploaded?: () => void;
}

const MAX_BYTES = 50 * 1024 * 1024;

/** Uploads a file into a resource folder. The API route stores it in the Supabase Storage bucket "documents". */
export default function UploadFileSlideOver({ open, resource, onClose, onUploaded }: Props) {
  const { uploadFile } = useResources();
  const [file, setFile] = useState<File | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [ministryId, setMinistryId] = useState('');
  const [ministries, setMinistries] = useState<{ id: number; name: string }[]>([]);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setFile(null);
    setDisplayName('');
    setMinistryId('');
    setError(null);
    fetch('/api/ministries')
      .then((r) => (r.ok ? r.json() : []))
      .then(setMinistries)
      .catch(() => setMinistries([]));
  }, [open]);

  const pick = (f?: File | null) => {
    if (!f) return;
    if (f.size > MAX_BYTES) {
      setError('File size must be less than 50MB');
      return;
    }
    setError(null);
    setFile(f);
    if (!displayName) setDisplayName(f.name.replace(/\.[^/.]+$/, ''));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resource) return;
    if (!file) return setError('Choose a file to upload');
    if (!displayName.trim()) return setError('Enter a display name');
    setUploading(true);
    setError(null);
    try {
      await uploadFile(resource.id, file, ministryId ? parseInt(ministryId, 10) : undefined, displayName.trim());
      onUploaded?.();
      onClose();
    } catch (err) {
      setError((err as Error).message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <SlideOver
      open={open}
      onClose={onClose}
      busy={uploading}
      title="Upload file"
      description={resource ? `${resource.display_name} · ${typeLabel(resource.resource_type_name)} · ${resource.year}` : undefined}
      footer={
        <>
          <Btn variant="outline" onClick={onClose} disabled={uploading}>
            Cancel
          </Btn>
          <Btn type="submit" form="upload-form" loading={uploading} disabled={!file}>
            <Upload className="h-4 w-4" />
            Upload
          </Btn>
        </>
      }
    >
      <form id="upload-form" onSubmit={submit} className="space-y-5">
        {error && (
          <div className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-theme-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
            {error}
          </div>
        )}
        <div
          role="button"
          tabIndex={0}
          onClick={() => !uploading && inputRef.current?.click()}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            pick(e.dataTransfer.files?.[0]);
          }}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-8 text-center transition ${
            dragging
              ? 'border-brand-400 bg-brand-50 dark:bg-brand-500/10'
              : 'border-gray-300 hover:border-gray-400 dark:border-gray-700 dark:hover:border-gray-600'
          }`}
        >
          <input ref={inputRef} type="file" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
          {file ? (
            <>
              <FileText className="mb-2 h-8 w-8 text-brand-500" />
              <p className="max-w-full truncate text-sm font-medium text-gray-800 dark:text-white/90">{file.name}</p>
              <p className="text-theme-xs text-gray-500 dark:text-gray-400">{formatFileSize(file.size)} · click to change</p>
            </>
          ) : (
            <>
              <Upload className="mb-2 h-8 w-8 text-gray-400" />
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">Drop a file here or click to browse</p>
              <p className="text-theme-xs text-gray-500 dark:text-gray-400">PDF, Word, Excel, PowerPoint or images, up to 50MB</p>
            </>
          )}
        </div>
        <FormGrid>
          <Field label="Display name" required>
            <TextInput value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="A descriptive name for the file" />
          </Field>
          <Field label="Ministry" hint="Optional — tags the file with the ministry it relates to.">
            <SelectInput
              value={ministryId}
              onChange={(e) => setMinistryId(e.target.value)}
              options={ministries.map((m) => ({ value: m.id, label: m.name }))}
              placeholder="None"
            />
          </Field>
        </FormGrid>
      </form>
    </SlideOver>
  );
}
