'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { ListTree, Plus, Table2 } from 'lucide-react';
import { Btn, ConfirmDialog, DataTable, PageHeader, SelectInput, type ActionItem, type Column } from '@/components/ui/kit';
import { useResources } from '@/hooks/useResources';
import { usePermissions } from '@/hooks/usePermissions';
import type { Resource, ResourceFile } from '@/lib/store/slices/resourcesSlice';
import ResourceForm from './ResourceForm';
import ResourceExplorer from './ResourceExplorer';
import ResourceFiles from './ResourceFiles';
import UploadFileSlideOver from './UploadFileSlideOver';
import { typeLabel } from './resourceUtils';

type View = 'table' | 'folders';

export default function ResourcesManager({ initialView = 'table' }: { initialView?: View }) {
  const { resources, categories, loading, error, fetchResources, fetchCategories, deleteResource, deleteFile } = useResources();
  const { can } = usePermissions();
  const [view, setView] = useState<View>(initialView);
  const [typeFilter, setTypeFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [form, setForm] = useState<{ open: boolean; resource: Resource | null }>({ open: false, resource: null });
  const [filesOf, setFilesOf] = useState<Resource | null>(null);
  const [uploadTo, setUploadTo] = useState<Resource | null>(null);
  const [toDelete, setToDelete] = useState<Resource | null>(null);
  const [fileToDelete, setFileToDelete] = useState<{ resource: Resource; file: ResourceFile } | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    fetchResources();
    fetchCategories();
  }, [fetchResources, fetchCategories]);

  const years = useMemo(() => [...new Set(resources.map((r) => r.year))].sort((a, b) => b - a), [resources]);
  const rows = resources.filter(
    (r) => (!typeFilter || String(r.resource_type_id) === typeFilter) && (!yearFilter || String(r.year) === yearFilter),
  );

  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    setActionError(null);
    try {
      await fn();
    } catch (e) {
      setActionError((e as Error).message || 'Something went wrong');
    } finally {
      setBusy(false);
      setToDelete(null);
      setFileToDelete(null);
    }
  };

  const columns: Column<Resource>[] = [
    {
      key: 'display_name',
      header: 'Resource',
      sortable: true,
      className: 'min-w-[200px] max-w-md',
      cell: (r) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-gray-800 dark:text-white/90">{r.display_name}</p>
          <p className="truncate text-theme-xs text-gray-500 dark:text-gray-400">{r.name}</p>
        </div>
      ),
    },
    {
      key: 'resource_type_name',
      header: 'Type',
      sortable: true,
      hideBelow: 'md',
      cell: (r) => <span className="capitalize">{typeLabel(r.resource_type_name).toLowerCase()}</span>,
    },
    { key: 'year', header: 'Year', sortable: true, cell: (r) => r.year },
    { key: 'file_count', header: 'Files', sortable: true, hideBelow: 'sm', cell: (r) => r.file_count ?? 0 },
    { key: 'created_by_name', header: 'Created by', sortable: true, hideBelow: 'lg', cell: (r) => r.created_by_name || '—' },
  ];

  const actions = (r: Resource): ActionItem[] => [
    { label: 'View files', onClick: () => setFilesOf(r) },
    { label: 'Upload file', onClick: () => setUploadTo(r), hidden: !can('resources', 'create') },
    { label: 'Edit', onClick: () => setForm({ open: true, resource: r }), hidden: !can('resources', 'edit') },
    { label: 'Delete', danger: true, separator: true, onClick: () => setToDelete(r), hidden: !can('resources', 'delete') },
  ];

  const toggleBtn = (v: View, icon: React.ReactNode, label: string) => (
    <button
      type="button"
      onClick={() => setView(v)}
      aria-pressed={view === v}
      className={`inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm font-medium transition ${
        view === v
          ? 'bg-white text-gray-900 shadow-theme-xs dark:bg-gray-800 dark:text-white'
          : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
      }`}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <>
      <PageHeader
        title="Resources"
        description="Cabinet documents organised by type and year. Files are stored in Supabase Storage."
        actions={
          <>
            <div className="inline-flex rounded-lg bg-gray-100 p-0.5 dark:bg-gray-900">
              {toggleBtn('table', <Table2 className="h-4 w-4" />, 'Table')}
              {toggleBtn('folders', <ListTree className="h-4 w-4" />, 'Folders')}
            </div>
            {can('resources', 'create') && (
              <Btn onClick={() => setForm({ open: true, resource: null })}>
                <Plus className="h-4 w-4" />
                New resource
              </Btn>
            )}
          </>
        }
      />

      {actionError && (
        <div className="mb-4 rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-theme-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
          {actionError}
        </div>
      )}

      {view === 'table' ? (
        <DataTable
          rows={rows}
          columns={columns}
          rowKey={(r) => r.id}
          loading={loading && resources.length === 0}
          error={error}
          searchKeys={(r) => [r.display_name, r.name, r.resource_type_name, r.year, r.description]}
          searchPlaceholder="Search resources…"
          toolbar={
            <>
              <div className="w-[calc(50%-6px)] sm:w-40">
                <SelectInput
                  aria-label="Filter by type"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  options={categories.map((c) => ({ value: c.id, label: typeLabel(c.name) }))}
                  placeholder="All types"
                  className="!h-10"
                />
              </div>
              <div className="w-[calc(50%-6px)] sm:w-32">
                <SelectInput
                  aria-label="Filter by year"
                  value={yearFilter}
                  onChange={(e) => setYearFilter(e.target.value)}
                  options={years.map((y) => ({ value: y, label: String(y) }))}
                  placeholder="All years"
                  className="!h-10"
                />
              </div>
            </>
          }
          actions={actions}
          onRowClick={setFilesOf}
          initialSort={{ key: 'year', dir: 'desc' }}
          emptyTitle="No resources yet"
          emptyDescription={can('resources', 'create') ? 'Use “New resource” to create a folder, then upload files into it.' : undefined}
        />
      ) : (
        <ResourceExplorer
          onUpload={setUploadTo}
          onEdit={(r) => setForm({ open: true, resource: r })}
          onDelete={setToDelete}
          onDeleteFile={(resource, file) => setFileToDelete({ resource, file })}
        />
      )}

      <ResourceForm open={form.open} resource={form.resource} onClose={() => setForm({ open: false, resource: null })} />
      <ResourceFiles resource={filesOf} onClose={() => setFilesOf(null)} onUpload={setUploadTo} />
      <UploadFileSlideOver open={!!uploadTo} resource={uploadTo} onClose={() => setUploadTo(null)} />

      <ConfirmDialog
        open={!!toDelete}
        title="Delete resource?"
        message={toDelete ? <>“{toDelete.display_name}” and all of its files will be permanently deleted. This cannot be undone.</> : null}
        busy={busy}
        onConfirm={() => toDelete && run(() => deleteResource(toDelete.id))}
        onCancel={() => setToDelete(null)}
      />
      <ConfirmDialog
        open={!!fileToDelete}
        title="Delete file?"
        message={fileToDelete ? <>“{fileToDelete.file.display_name || fileToDelete.file.name}” will be removed from storage. This cannot be undone.</> : null}
        busy={busy}
        onConfirm={() => fileToDelete && run(() => deleteFile(fileToDelete.resource.id, fileToDelete.file.id))}
        onCancel={() => setFileToDelete(null)}
      />
    </>
  );
}
