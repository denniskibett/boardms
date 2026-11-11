'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import {
  Btn,
  ConfirmDialog,
  DataTable,
  PageHeader,
  SelectInput,
  StatusBadge,
  toneForStatus,
  type ActionItem,
  type Column,
} from '@/components/ui/kit';
import { usePermissions } from '@/hooks/usePermissions';
import MemoFormSlideOver from './MemoFormSlideOver';
import { MEMO_STATUSES, MEMO_TYPES, MEMO_PRIORITIES, api, formatDate, labelFor, priorityTone, type Memo } from './memoOptions';

interface Props {
  /** "my" = memos I created, "all" = every memo. */
  scope: 'my' | 'all';
}

export default function MemosTable({ scope }: Props) {
  const router = useRouter();
  const { can } = usePermissions();
  const [memos, setMemos] = useState<Memo[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [status, setStatus] = useState('');
  const [form, setForm] = useState<{ open: boolean; id: number | null }>({ open: false, id: null });
  const [toDelete, setToDelete] = useState<Memo | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const res = await api<{ data: Memo[] }>(`/api/memos?type=${scope}`);
      setMemos(res.data ?? []);
    } catch (e) {
      setLoadError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [scope]);

  useEffect(() => {
    load();
  }, [load]);

  const changeStatus = async (memo: Memo, next: string) => {
    setActionError(null);
    try {
      await api(`/api/memos/${memo.id}`, { method: 'PATCH', body: JSON.stringify({ status: next }) });
      await load();
    } catch (e) {
      setActionError((e as Error).message);
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    setActionError(null);
    try {
      await api(`/api/memos/${toDelete.id}`, { method: 'DELETE' });
      setMemos((list) => list.filter((m) => m.id !== toDelete.id));
      setToDelete(null);
    } catch (e) {
      setActionError((e as Error).message);
      setToDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  const canCreate = can('memos', 'create');
  const canEdit = can('memos', 'edit');
  const canApprove = can('memos', 'approve');
  const canDelete = can('memos', 'delete');
  const canManage = can('memos', 'manage');

  const entity = (m: Memo) => m.agency_name || m.state_department_name || m.ministry_name || '—';

  const columns: Column<Memo>[] = [
    {
      key: 'name',
      header: 'Memo',
      sortable: true,
      className: 'min-w-[220px] max-w-md',
      cell: (m) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-gray-800 dark:text-white/90">{m.name || 'Untitled memo'}</p>
          {m.summary && <p className="line-clamp-1 text-theme-xs text-gray-500 dark:text-gray-400">{m.summary}</p>}
        </div>
      ),
    },
    {
      key: 'entity',
      header: 'Submitting entity',
      hideBelow: 'md',
      sortValue: entity,
      sortable: true,
      cell: (m) => (
        <div>
          <p className="text-gray-800 dark:text-white/90">{entity(m)}</p>
          {(m.state_department_name || m.agency_name) && (
            <p className="text-theme-xs text-gray-500 dark:text-gray-400">{m.ministry_acronym || m.ministry_name}</p>
          )}
        </div>
      ),
    },
    { key: 'memo_type', header: 'Type', hideBelow: 'lg', sortable: true, cell: (m) => labelFor(MEMO_TYPES, m.memo_type) },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      cell: (m) => <StatusBadge tone={toneForStatus(m.status)}>{labelFor(MEMO_STATUSES, m.status)}</StatusBadge>,
    },
    {
      key: 'priority',
      header: 'Priority',
      hideBelow: 'md',
      sortable: true,
      cell: (m) => <StatusBadge tone={priorityTone(m.priority)}>{labelFor(MEMO_PRIORITIES, m.priority)}</StatusBadge>,
    },
    ...(scope === 'all'
      ? [{ key: 'creator_name', header: 'Created by', hideBelow: 'xl' as const, sortable: true, cell: (m: Memo) => m.creator_name || '—' }]
      : []),
    { key: 'created_at', header: 'Created', hideBelow: 'sm', sortable: true, cell: (m) => formatDate(m.created_at) },
  ];

  const actions = (m: Memo): ActionItem[] => {
    const editable = canEdit && (scope === 'my' || canApprove);
    return [
      { label: 'View', href: `/memos/${m.id}` },
      { label: 'Edit', onClick: () => setForm({ open: true, id: m.id }), hidden: !editable },
      { label: 'Submit for review', onClick: () => changeStatus(m, 'submitted'), hidden: !editable || m.status !== 'draft' },
      { label: 'Mark under review', separator: true, onClick: () => changeStatus(m, 'under_review'), hidden: !canApprove || m.status !== 'submitted' },
      { label: 'Approve', onClick: () => changeStatus(m, 'approved'), hidden: !canApprove || !['submitted', 'under_review'].includes(m.status) },
      { label: 'Reject', onClick: () => changeStatus(m, 'rejected'), hidden: !canApprove || !['submitted', 'under_review'].includes(m.status) },
      {
        label: 'Delete',
        danger: true,
        separator: true,
        onClick: () => setToDelete(m),
        hidden: !canDelete || (!canManage && (m.status !== 'draft' || scope !== 'my')),
      },
    ];
  };

  const rows = status ? memos.filter((m) => m.status === status) : memos;

  return (
    <>
      <PageHeader
        title={scope === 'my' ? 'My memos' : 'All memos'}
        description={
          scope === 'my'
            ? 'Memos you have drafted or submitted for cabinet consideration.'
            : 'Memos from every ministry, state department and agency.'
        }
        actions={
          canCreate && (
            <Btn onClick={() => setForm({ open: true, id: null })}>
              <Plus className="h-4 w-4" />
              New memo
            </Btn>
          )
        }
      />

      {actionError && (
        <div className="mb-4 flex items-start justify-between gap-3 rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-theme-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
          <span>{actionError}</span>
          <button type="button" className="shrink-0 font-medium underline" onClick={() => setActionError(null)}>
            Dismiss
          </button>
        </div>
      )}

      <DataTable
        rows={rows}
        columns={columns}
        rowKey={(m) => m.id}
        loading={loading}
        error={loadError}
        searchKeys={(m) => [m.name, m.summary, m.ministry_name, m.state_department_name, m.agency_name, m.creator_name, m.memo_type]}
        searchPlaceholder="Search memos…"
        toolbar={
          <div className="w-full sm:w-44">
            <SelectInput
              aria-label="Filter by status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              options={MEMO_STATUSES}
              placeholder="All statuses"
              className="!h-10"
            />
          </div>
        }
        actions={actions}
        onRowClick={(m) => router.push(`/memos/${m.id}`)}
        initialSort={{ key: 'created_at', dir: 'desc' }}
        emptyTitle={status ? 'No memos with this status' : scope === 'my' ? 'You have not created any memos yet' : 'No memos yet'}
        emptyDescription={canCreate && !status ? 'Use “New memo” to draft one.' : undefined}
      />

      <MemoFormSlideOver
        open={form.open}
        memoId={form.id}
        onClose={() => setForm({ open: false, id: null })}
        onSaved={load}
      />

      <ConfirmDialog
        open={!!toDelete}
        title="Delete memo?"
        message={toDelete ? <>“{toDelete.name}” will be permanently deleted. This cannot be undone.</> : null}
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </>
  );
}
