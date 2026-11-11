'use client';

import React, { useEffect, useState } from 'react';
import { Upload } from 'lucide-react';
import { Btn, ConfirmDialog, DataTable, SlideOver, type Column } from '@/components/ui/kit';
import { useResources } from '@/hooks/useResources';
import { usePermissions } from '@/hooks/usePermissions';
import type { Resource, ResourceFile } from '@/lib/store/slices/resourcesSlice';
import { downloadFile, formatFileSize, openFile, typeLabel } from './resourceUtils';

interface Props {
  resource: Resource | null;
  onClose: () => void;
  onUpload: (resource: Resource) => void;
}

/** Slide-over listing the files in one resource folder. */
export default function ResourceFiles({ resource, onClose, onUpload }: Props) {
  const { files, fetchResourceFiles, deleteFile } = useResources();
  const { can } = usePermissions();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<ResourceFile | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!resource) return;
    setLoading(true);
    setError(null);
    fetchResourceFiles(resource.id)
      .catch((e: Error) => setError(e.message || 'Could not load files'))
      .finally(() => setLoading(false));
  }, [resource, fetchResourceFiles]);

  const rows = resource ? files[resource.id] ?? [] : [];

  const confirmDelete = async () => {
    if (!resource || !toDelete) return;
    setDeleting(true);
    try {
      await deleteFile(resource.id, toDelete.id);
    } catch (e) {
      setError((e as Error).message || 'Could not delete the file');
    } finally {
      setDeleting(false);
      setToDelete(null);
    }
  };

  const columns: Column<ResourceFile>[] = [
    {
      key: 'display_name',
      header: 'File',
      sortable: true,
      className: 'min-w-[200px]',
      cell: (f) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-gray-800 dark:text-white/90">{f.display_name || f.name}</p>
          <p className="truncate text-theme-xs text-gray-500 dark:text-gray-400">
            {f.ministry_name ? `${f.ministry_name} · ` : ''}
            {formatFileSize(f.file_size)}
          </p>
        </div>
      ),
    },
    { key: 'file_type', header: 'Type', hideBelow: 'sm', cell: (f) => <span className="capitalize">{f.file_type || '—'}</span> },
    {
      key: 'uploaded_at',
      header: 'Uploaded',
      sortable: true,
      hideBelow: 'md',
      cell: (f) => (f.uploaded_at ? new Date(f.uploaded_at).toLocaleDateString() : '—'),
    },
  ];

  return (
    <>
      <SlideOver
        open={!!resource}
        onClose={onClose}
        size="xl"
        title={resource?.display_name ?? 'Files'}
        description={resource ? `${typeLabel(resource.resource_type_name)} · ${resource.year} · ${resource.name}` : undefined}
        footer={
          resource && can('resources', 'create') ? (
            <Btn onClick={() => onUpload(resource)}>
              <Upload className="h-4 w-4" />
              Upload file
            </Btn>
          ) : undefined
        }
      >
        <DataTable
          bare
          rows={rows}
          columns={columns}
          rowKey={(f) => f.id}
          loading={loading && rows.length === 0}
          error={error}
          searchKeys={(f) => [f.display_name, f.name, f.ministry_name, f.file_type]}
          searchPlaceholder="Search files…"
          onRowClick={openFile}
          actions={(f) => [
            { label: 'Open', onClick: () => openFile(f) },
            { label: 'Download', onClick: () => downloadFile(f) },
            { label: 'Delete', danger: true, separator: true, onClick: () => setToDelete(f), hidden: !can('resources', 'delete') },
          ]}
          initialSort={{ key: 'uploaded_at', dir: 'desc' }}
          emptyTitle="No files in this folder yet"
        />
      </SlideOver>
      <ConfirmDialog
        open={!!toDelete}
        title="Delete file?"
        message={toDelete ? <>“{toDelete.display_name || toDelete.name}” will be removed from storage. This cannot be undone.</> : null}
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </>
  );
}
