'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import {
  Btn,
  ConfirmDialog,
  DataTable,
  DetailList,
  PageHeader,
  SelectInput,
  SlideOver,
  StatusBadge,
  toneForStatus,
  type ActionItem,
  type Column,
} from '@/components/ui/kit';
import { usePermissions } from '@/hooks/usePermissions';
import { api, formatDate, labelFor } from '@/components/memos/memoOptions';
import ActionLetterFormSlideOver, { LETTER_STATUSES, type ActionLetter } from './ActionLetterFormSlideOver';

const isOverdue = (l: ActionLetter) =>
  !!l.due_date && !['completed'].includes(l.status ?? '') && new Date(l.due_date).getTime() < Date.now() - 86_400_000;

export default function ActionLettersList() {
  const { can } = usePermissions();
  const [letters, setLetters] = useState<ActionLetter[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [status, setStatus] = useState('');
  const [form, setForm] = useState<{ open: boolean; letter: ActionLetter | null }>({ open: false, letter: null });
  const [viewing, setViewing] = useState<ActionLetter | null>(null);
  const [toDelete, setToDelete] = useState<ActionLetter | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      setLetters(await api<ActionLetter[]>('/api/action-letters'));
    } catch (e) {
      setLoadError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const setLetterStatus = async (l: ActionLetter, next: string) => {
    setActionError(null);
    try {
      await api(`/api/action-letters/${l.id}`, { method: 'PUT', body: JSON.stringify({ status: next }) });
      await load();
    } catch (e) {
      setActionError((e as Error).message);
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await api(`/api/action-letters/${toDelete.id}`, { method: 'DELETE' });
      setLetters((list) => list.filter((l) => l.id !== toDelete.id));
    } catch (e) {
      setActionError((e as Error).message);
    } finally {
      setDeleting(false);
      setToDelete(null);
    }
  };

  const canEdit = can('actionLetters', 'edit');

  const columns: Column<ActionLetter>[] = [
    {
      key: 'subject',
      header: 'Letter',
      sortable: true,
      className: 'min-w-[220px] max-w-md',
      cell: (l) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-gray-800 dark:text-white/90">{l.subject || 'Untitled letter'}</p>
          <p className="text-theme-xs text-gray-500 dark:text-gray-400">REF CAB/ACT/{l.id}</p>
        </div>
      ),
    },
    { key: 'ministry_name', header: 'To', sortable: true, hideBelow: 'md', cell: (l) => l.ministry_name || '—' },
    {
      key: 'decision_text',
      header: 'Decision',
      hideBelow: 'xl',
      cell: (l) => <span className="line-clamp-1 max-w-xs">{l.decision_text || '—'}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      cell: (l) =>
        isOverdue(l) ? (
          <StatusBadge tone="error">Overdue</StatusBadge>
        ) : (
          <StatusBadge tone={toneForStatus(l.status)}>{labelFor(LETTER_STATUSES, l.status)}</StatusBadge>
        ),
    },
    { key: 'due_date', header: 'Due', sortable: true, hideBelow: 'sm', cell: (l) => formatDate(l.due_date) },
    { key: 'created_at', header: 'Issued', sortable: true, hideBelow: 'lg', cell: (l) => formatDate(l.created_at) },
  ];

  const actions = (l: ActionLetter): ActionItem[] => [
    { label: 'View', onClick: () => setViewing(l) },
    { label: 'Edit', onClick: () => setForm({ open: true, letter: l }), hidden: !canEdit },
    { label: 'Mark as sent', onClick: () => setLetterStatus(l, 'sent'), hidden: !canEdit || l.status !== 'pending' },
    { label: 'Mark acknowledged', onClick: () => setLetterStatus(l, 'acknowledged'), hidden: !canEdit || l.status !== 'sent' },
    {
      label: 'Mark completed',
      onClick: () => setLetterStatus(l, 'completed'),
      hidden: !canEdit || ['completed', 'pending'].includes(l.status ?? ''),
    },
    { label: 'Delete', danger: true, separator: true, onClick: () => setToDelete(l), hidden: !can('actionLetters', 'delete') },
  ];

  const rows = status ? letters.filter((l) => (status === 'overdue' ? isOverdue(l) : l.status === status)) : letters;

  return (
    <>
      <PageHeader
        title="Action letters"
        description="Letters instructing ministries to implement cabinet decisions."
        actions={
          can('actionLetters', 'create') && (
            <Btn onClick={() => setForm({ open: true, letter: null })}>
              <Plus className="h-4 w-4" />
              New action letter
            </Btn>
          )
        }
      />

      {actionError && (
        <div className="mb-4 rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-theme-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
          {actionError}
        </div>
      )}

      <DataTable
        rows={rows}
        columns={columns}
        rowKey={(l) => l.id}
        loading={loading}
        error={loadError}
        searchKeys={(l) => [l.subject, l.ministry_name, l.decision_text, `CAB/ACT/${l.id}`]}
        searchPlaceholder="Search letters…"
        toolbar={
          <div className="w-full sm:w-44">
            <SelectInput
              aria-label="Filter by status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              options={LETTER_STATUSES}
              placeholder="All statuses"
              className="!h-10"
            />
          </div>
        }
        actions={actions}
        onRowClick={setViewing}
        initialSort={{ key: 'created_at', dir: 'desc' }}
        emptyTitle="No action letters yet"
      />

      <SlideOver
        open={!!viewing}
        onClose={() => setViewing(null)}
        title={viewing?.subject || 'Action letter'}
        description={viewing ? `REF CAB/ACT/${viewing.id}` : undefined}
        footer={
          viewing && canEdit ? (
            <Btn
              variant="outline"
              onClick={() => {
                setForm({ open: true, letter: viewing });
                setViewing(null);
              }}
            >
              Edit
            </Btn>
          ) : undefined
        }
      >
        {viewing && (
          <div className="space-y-6">
            <DetailList
              items={[
                { label: 'To', value: viewing.ministry_name || '—' },
                { label: 'Status', value: <StatusBadge tone={toneForStatus(viewing.status)}>{labelFor(LETTER_STATUSES, viewing.status)}</StatusBadge> },
                { label: 'Due date', value: formatDate(viewing.due_date) },
                { label: 'Sent', value: formatDate(viewing.sent_at) },
                { label: 'Acknowledged', value: formatDate(viewing.acknowledged_at) },
                { label: 'Decision', value: viewing.decision_text || '—' },
              ]}
            />
            <div>
              <h4 className="mb-2 text-sm font-semibold text-gray-800 dark:text-white/90">Content</h4>
              <p className="whitespace-pre-wrap break-words text-theme-sm text-gray-700 dark:text-gray-300">{viewing.content || '—'}</p>
            </div>
          </div>
        )}
      </SlideOver>

      <ActionLetterFormSlideOver
        open={form.open}
        letter={form.letter}
        onClose={() => setForm({ open: false, letter: null })}
        onSaved={load}
      />

      <ConfirmDialog
        open={!!toDelete}
        title="Delete action letter?"
        message={toDelete ? <>“{toDelete.subject}” will be permanently deleted. This cannot be undone.</> : null}
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </>
  );
}
