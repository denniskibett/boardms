'use client';

import React, { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, File as FileIcon, Folder, FolderOpen, Loader2, Search } from 'lucide-react';
import { ActionsMenu } from '@/components/ui/kit';
import { useResources } from '@/hooks/useResources';
import { usePermissions } from '@/hooks/usePermissions';
import type { Resource, ResourceFile } from '@/lib/store/slices/resourcesSlice';
import { downloadFile, formatFileSize, openFile, typeLabel } from './resourceUtils';

interface Props {
  onUpload: (resource: Resource) => void;
  onEdit: (resource: Resource) => void;
  onDelete: (resource: Resource) => void;
  onDeleteFile: (resource: Resource, file: ResourceFile) => void;
}

/** Folder tree: resource type → year → resource → files (files load when a folder is opened). */
export default function ResourceExplorer({ onUpload, onEdit, onDelete, onDeleteFile }: Props) {
  const { resources, files, loading, fetchResourceFiles } = useResources();
  const { can } = usePermissions();
  const [open, setOpen] = useState<Set<string>>(new Set());
  const [loadingFiles, setLoadingFiles] = useState<Set<number>>(new Set());
  const [query, setQuery] = useState('');

  const tree = useMemo(() => {
    const q = query.trim().toLowerCase();
    const byType = new Map<string, Map<number, Resource[]>>();
    for (const r of resources) {
      if (q && ![r.display_name, r.name, r.resource_type_name, String(r.year)].some((v) => v?.toLowerCase().includes(q))) continue;
      const type = typeLabel(r.resource_type_name);
      if (!byType.has(type)) byType.set(type, new Map());
      const years = byType.get(type)!;
      if (!years.has(r.year)) years.set(r.year, []);
      years.get(r.year)!.push(r);
    }
    return [...byType.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([type, years]) => ({ type, years: [...years.entries()].sort(([a], [b]) => b - a) }));
  }, [resources, query]);

  const toggle = async (key: string, resource?: Resource) => {
    const next = new Set(open);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setOpen(next);
    if (resource && next.has(key) && !files[resource.id]) {
      setLoadingFiles((s) => new Set(s).add(resource.id));
      try {
        await fetchResourceFiles(resource.id);
      } catch {
        /* the files panel shows errors; the tree just stays empty */
      } finally {
        setLoadingFiles((s) => {
          const n = new Set(s);
          n.delete(resource.id);
          return n;
        });
      }
    }
  };

  // While searching, show everything expanded.
  const isOpen = (key: string) => !!query.trim() || open.has(key);

  const row = 'flex min-w-0 items-center gap-2 rounded-lg px-3 py-2 hover:bg-gray-50 dark:hover:bg-white/[0.03]';
  const chevron = (o: boolean) =>
    o ? <ChevronDown className="h-4 w-4 shrink-0 text-gray-400" /> : <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-800">
        <div className="relative sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search folders…"
            className="h-10 w-full rounded-lg border border-gray-300 bg-transparent py-2 pl-9 pr-3 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
          />
        </div>
      </div>

      <div className="p-2 sm:p-3">
        {loading && resources.length === 0 ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
          </div>
        ) : tree.length === 0 ? (
          <p className="py-12 text-center text-theme-sm text-gray-500 dark:text-gray-400">
            {query ? `No folders match “${query}”` : 'No resources yet'}
          </p>
        ) : (
          tree.map(({ type, years }) => {
            const typeKey = type;
            return (
              <div key={typeKey}>
                <button type="button" className={`${row} w-full text-left`} onClick={() => toggle(typeKey)}>
                  {chevron(isOpen(typeKey))}
                  <Folder className="h-4 w-4 shrink-0 text-brand-500" />
                  <span className="truncate text-sm font-medium capitalize text-gray-800 dark:text-white/90">{type.toLowerCase()}</span>
                </button>
                {isOpen(typeKey) &&
                  years.map(([year, list]) => {
                    const yearKey = `${type}/${year}`;
                    return (
                      <div key={yearKey} className="ml-4 border-l border-gray-100 pl-2 dark:border-gray-800">
                        <button type="button" className={`${row} w-full text-left`} onClick={() => toggle(yearKey)}>
                          {chevron(isOpen(yearKey))}
                          <Folder className="h-4 w-4 shrink-0 text-success-500" />
                          <span className="text-sm text-gray-800 dark:text-white/90">{year}</span>
                        </button>
                        {isOpen(yearKey) &&
                          list.map((r) => {
                            const key = `${yearKey}/${r.id}`;
                            const expanded = open.has(key);
                            const rFiles = files[r.id];
                            return (
                              <div key={key} className="ml-4 border-l border-gray-100 pl-2 dark:border-gray-800">
                                <div className={row}>
                                  <button type="button" className="flex min-w-0 flex-1 items-center gap-2 text-left" onClick={() => toggle(key, r)}>
                                    {chevron(expanded)}
                                    {expanded ? (
                                      <FolderOpen className="h-4 w-4 shrink-0 text-warning-500" />
                                    ) : (
                                      <Folder className="h-4 w-4 shrink-0 text-warning-500" />
                                    )}
                                    <span className="truncate text-sm text-gray-800 dark:text-white/90">{r.display_name}</span>
                                    <span className="hidden shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-theme-xs text-gray-600 dark:bg-white/5 dark:text-gray-400 sm:inline">
                                      {r.file_count ?? 0} files
                                    </span>
                                  </button>
                                  <ActionsMenu
                                    items={[
                                      { label: 'Upload file', onClick: () => onUpload(r), hidden: !can('resources', 'create') },
                                      { label: 'Edit', onClick: () => onEdit(r), hidden: !can('resources', 'edit') },
                                      { label: 'Delete', danger: true, separator: true, onClick: () => onDelete(r), hidden: !can('resources', 'delete') },
                                    ]}
                                  />
                                </div>
                                {expanded && (
                                  <div className="ml-6">
                                    {loadingFiles.has(r.id) && !rFiles ? (
                                      <p className="flex items-center gap-2 px-3 py-2 text-theme-sm text-gray-500">
                                        <Loader2 className="h-4 w-4 animate-spin" /> Loading files…
                                      </p>
                                    ) : !rFiles || rFiles.length === 0 ? (
                                      <p className="px-3 py-2 text-theme-sm text-gray-500 dark:text-gray-400">No files yet</p>
                                    ) : (
                                      rFiles.map((f) => (
                                        <div key={f.id} className={row}>
                                          <button
                                            type="button"
                                            className="flex min-w-0 flex-1 items-center gap-2 text-left"
                                            onClick={() => openFile(f)}
                                          >
                                            <FileIcon className="h-4 w-4 shrink-0 text-gray-400" />
                                            <span className="min-w-0">
                                              <span className="block truncate text-sm text-gray-800 dark:text-white/90">{f.display_name || f.name}</span>
                                              <span className="block truncate text-theme-xs text-gray-500 dark:text-gray-400">
                                                {f.ministry_name ? `${f.ministry_name} · ` : ''}
                                                {formatFileSize(f.file_size)}
                                              </span>
                                            </span>
                                          </button>
                                          <ActionsMenu
                                            items={[
                                              { label: 'Open', onClick: () => openFile(f) },
                                              { label: 'Download', onClick: () => downloadFile(f) },
                                              {
                                                label: 'Delete',
                                                danger: true,
                                                separator: true,
                                                onClick: () => onDeleteFile(r, f),
                                                hidden: !can('resources', 'delete'),
                                              },
                                            ]}
                                          />
                                        </div>
                                      ))
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                      </div>
                    );
                  })}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
