'use client';

/**
 * TailAdmin data table: card, toolbar (title, search, filters, primary action),
 * sortable columns, row "…" actions, pagination, loading & empty states.
 *
 *   <DataTable
 *     title="Meetings"
 *     rows={meetings}
 *     rowKey={(m) => m.id}
 *     columns={[
 *       { key: 'title', header: 'Title', sortable: true, cell: (m) => m.title },
 *       { key: 'date', header: 'Date', sortable: true, sortValue: (m) => m.start, cell: (m) => fmt(m.start) },
 *     ]}
 *     searchKeys={(m) => [m.title, m.location]}
 *     actions={(m) => [{ label: 'Edit', onClick: () => edit(m) }]}
 *     toolbar={<Button onClick={create}>New meeting</Button>}
 *     onRowClick={(m) => router.push(`/meetings/${m.id}`)}
 *   />
 */

import React, { useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import ActionsMenu, { type ActionItem } from './ActionsMenu';

export interface Column<T> {
  key: string;
  header: React.ReactNode;
  cell: (row: T) => React.ReactNode;
  sortable?: boolean;
  /** Value used for sorting; defaults to row[key]. */
  sortValue?: (row: T) => string | number | Date | null | undefined;
  className?: string;
  headerClassName?: string;
  /** Hide below this breakpoint to keep tables readable on phones. */
  hideBelow?: 'sm' | 'md' | 'lg' | 'xl';
}

export interface DataTableProps<T> {
  rows: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string | number;
  title?: React.ReactNode;
  description?: React.ReactNode;
  /** Right side of the toolbar — filters, primary button, etc. */
  toolbar?: React.ReactNode;
  /** Return strings to match against the search box; omit to hide search. */
  searchKeys?: (row: T) => (string | number | null | undefined)[];
  searchPlaceholder?: string;
  actions?: (row: T) => ActionItem[];
  onRowClick?: (row: T) => void;
  loading?: boolean;
  error?: string | null;
  emptyTitle?: string;
  emptyDescription?: React.ReactNode;
  pageSize?: number;
  initialSort?: { key: string; dir: 'asc' | 'desc' };
  /** Render without the outer card (e.g. inside another card). */
  bare?: boolean;
}

const HIDE: Record<NonNullable<Column<unknown>['hideBelow']>, string> = {
  sm: 'hidden sm:table-cell',
  md: 'hidden md:table-cell',
  lg: 'hidden lg:table-cell',
  xl: 'hidden xl:table-cell',
};

function normalise(v: unknown): string | number {
  if (v == null) return '';
  if (v instanceof Date) return v.getTime();
  if (typeof v === 'number') return v;
  const s = String(v);
  const t = Date.parse(s);
  // Treat ISO-ish dates as dates, everything else as case-insensitive text.
  return /^\d{4}-\d{2}-\d{2}/.test(s) && !Number.isNaN(t) ? t : s.toLowerCase();
}

export default function DataTable<T>({
  rows,
  columns,
  rowKey,
  title,
  description,
  toolbar,
  searchKeys,
  searchPlaceholder = 'Search…',
  actions,
  onRowClick,
  loading,
  error,
  emptyTitle = 'Nothing here yet',
  emptyDescription,
  pageSize = 10,
  initialSort,
  bare = false,
}: DataTableProps<T>) {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState(initialSort);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(pageSize);

  const filtered = useMemo(() => {
    if (!searchKeys || !query.trim()) return rows;
    const q = query.trim().toLowerCase();
    return rows.filter((r) => searchKeys(r).some((v) => v != null && String(v).toLowerCase().includes(q)));
  }, [rows, query, searchKeys]);

  const sorted = useMemo(() => {
    if (!sort) return filtered;
    const col = columns.find((c) => c.key === sort.key);
    if (!col) return filtered;
    const get = col.sortValue ?? ((r: T) => (r as Record<string, unknown>)[col.key] as string);
    const dir = sort.dir === 'asc' ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const x = normalise(get(a));
      const y = normalise(get(b));
      return x < y ? -dir : x > y ? dir : 0;
    });
  }, [filtered, sort, columns]);

  const pages = Math.max(1, Math.ceil(sorted.length / perPage));
  useEffect(() => setPage(1), [query, perPage, rows]);
  const current = sorted.slice((page - 1) * perPage, page * perPage);
  const from = sorted.length ? (page - 1) * perPage + 1 : 0;
  const to = Math.min(page * perPage, sorted.length);

  const toggleSort = (key: string) =>
    setSort((s) => (s?.key !== key ? { key, dir: 'asc' } : s.dir === 'asc' ? { key, dir: 'desc' } : undefined));

  const colCount = columns.length + (actions ? 1 : 0);

  const body = (
    <>
      {(title || toolbar || searchKeys) && (
        <div className="flex flex-col gap-3 border-b border-gray-200 px-5 py-4 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            {title && <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">{title}</h3>}
            {description && <p className="mt-0.5 text-theme-sm text-gray-500 dark:text-gray-400">{description}</p>}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {searchKeys && (
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="h-10 w-full rounded-lg border border-gray-300 bg-transparent py-2 pl-9 pr-3 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 sm:w-64"
                />
              </div>
            )}
            {toolbar}
          </div>
        </div>
      )}

      <div className="max-w-full overflow-x-auto">
        <table className="min-w-full">
          <thead className="border-b border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-white/[0.02]">
            <tr>
              {columns.map((c) => (
                <th
                  key={c.key}
                  scope="col"
                  className={`px-5 py-3 text-left text-theme-xs font-medium text-gray-500 dark:text-gray-400 ${c.hideBelow ? HIDE[c.hideBelow] : ''} ${c.headerClassName ?? ''}`}
                >
                  {c.sortable ? (
                    <button
                      type="button"
                      onClick={() => toggleSort(c.key)}
                      className="inline-flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-200"
                    >
                      {c.header}
                      {sort?.key === c.key &&
                        (sort.dir === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
                    </button>
                  ) : (
                    c.header
                  )}
                </th>
              ))}
              {actions && (
                <th scope="col" className="w-16 px-5 py-3 text-right text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                  <span className="sr-only">Actions</span>
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {loading ? (
              Array.from({ length: Math.min(perPage, 5) }, (_, i) => (
                <tr key={i}>
                  {Array.from({ length: colCount }, (_, j) => (
                    <td key={j} className="px-5 py-4">
                      <div className="h-4 w-3/4 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
                    </td>
                  ))}
                </tr>
              ))
            ) : error ? (
              <tr>
                <td colSpan={colCount} className="px-5 py-12 text-center text-theme-sm text-error-600 dark:text-error-400">
                  {error}
                </td>
              </tr>
            ) : current.length === 0 ? (
              <tr>
                <td colSpan={colCount} className="px-5 py-14 text-center">
                  <p className="text-theme-sm font-medium text-gray-700 dark:text-gray-300">
                    {query ? `No results for “${query}”` : emptyTitle}
                  </p>
                  {!query && emptyDescription && (
                    <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">{emptyDescription}</p>
                  )}
                </td>
              </tr>
            ) : (
              current.map((row) => (
                <tr
                  key={rowKey(row)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={`transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.02] ${onRowClick ? 'cursor-pointer' : ''}`}
                >
                  {columns.map((c) => (
                    <td
                      key={c.key}
                      className={`px-5 py-3.5 text-theme-sm text-gray-700 dark:text-gray-300 ${c.hideBelow ? HIDE[c.hideBelow] : ''} ${c.className ?? ''}`}
                    >
                      {c.cell(row)}
                    </td>
                  ))}
                  {actions && (
                    <td className="px-5 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                      <ActionsMenu items={actions(row)} />
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!loading && sorted.length > 0 && (
        <div className="flex flex-col gap-3 border-t border-gray-200 px-5 py-3 text-theme-sm text-gray-500 dark:border-gray-800 dark:text-gray-400 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <span>
              Showing {from}–{to} of {sorted.length}
            </span>
            <select
              value={perPage}
              onChange={(e) => setPerPage(Number(e.target.value))}
              className="rounded-md border border-gray-300 bg-transparent px-2 py-1 text-theme-xs dark:border-gray-700 dark:bg-gray-900"
              aria-label="Rows per page"
            >
              {[10, 25, 50, 100].map((n) => (
                <option key={n} value={n}>
                  {n} / page
                </option>
              ))}
            </select>
          </div>
          {pages > 1 && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-40 dark:border-gray-700 dark:hover:bg-white/5"
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {pageNumbers(page, pages).map((n, i) =>
                n === '…' ? (
                  <span key={`e${i}`} className="px-1">
                    …
                  </span>
                ) : (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setPage(n)}
                    className={`flex h-8 min-w-8 items-center justify-center rounded-lg px-2 ${
                      n === page
                        ? 'bg-brand-500 text-white'
                        : 'hover:bg-gray-100 dark:hover:bg-white/5'
                    }`}
                  >
                    {n}
                  </button>
                ),
              )}
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
                disabled={page === pages}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-40 dark:border-gray-700 dark:hover:bg-white/5"
                aria-label="Next page"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );

  if (bare) return <div>{body}</div>;
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      {body}
    </div>
  );
}

function pageNumbers(page: number, pages: number): (number | '…')[] {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);
  const out: (number | '…')[] = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(pages - 1, page + 1);
  if (start > 2) out.push('…');
  for (let i = start; i <= end; i++) out.push(i);
  if (end < pages - 1) out.push('…');
  out.push(pages);
  return out;
}
