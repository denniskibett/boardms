'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import {
  ActionsMenu,
  Btn,
  Card,
  ConfirmDialog,
  DetailList,
  PageHeader,
  StatusBadge,
  toneForStatus,
  type ActionItem,
} from '@/components/ui/kit';
import { useMemoDetail } from '@/hooks/useMemo';
import { usePermissions } from '@/hooks/usePermissions';
import MemoFormSlideOver from '@/components/memos/MemoFormSlideOver';
import { MEMO_PRIORITIES, MEMO_STATUSES, MEMO_TYPES, api, formatDate, labelFor, priorityTone } from '@/components/memos/memoOptions';

export default function MemoDetailPage() {
  const params = useParams();
  const router = useRouter();
  const memoId = params.id as string;
  const { memo, loading, error, refetch } = useMemoDetail(memoId);
  const { can } = usePermissions();
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const back = (
    <Link href="/memos" className="inline-flex items-center gap-1.5 text-theme-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
      <ArrowLeft className="h-4 w-4" />
      Back to memos
    </Link>
  );

  if (loading) {
    return (
      <Card>
        <div className="animate-pulse space-y-4">
          <div className="h-7 w-2/3 rounded bg-gray-100 dark:bg-gray-800" />
          <div className="h-4 w-1/3 rounded bg-gray-100 dark:bg-gray-800" />
          <div className="h-24 rounded bg-gray-100 dark:bg-gray-800" />
        </div>
      </Card>
    );
  }

  if (error || !memo) {
    return (
      <Card>
        <div className="py-10 text-center">
          <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">{error ? 'Could not load memo' : 'Memo not found'}</h3>
          <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">{error || 'The memo you are looking for does not exist.'}</p>
          <div className="mt-4 flex justify-center">{back}</div>
        </div>
      </Card>
    );
  }

  const setStatus = async (status: string) => {
    setActionError(null);
    try {
      await api(`/api/memos/${memo.id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
      await refetch();
    } catch (e) {
      setActionError((e as Error).message);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await api(`/api/memos/${memo.id}`, { method: 'DELETE' });
      router.push('/memos');
    } catch (e) {
      setActionError((e as Error).message);
      setConfirmDelete(false);
    } finally {
      setBusy(false);
    }
  };

  const canApprove = can('memos', 'approve');
  const reviewable = ['submitted', 'under_review'].includes(memo.status);
  const items: ActionItem[] = [
    { label: 'Submit for review', onClick: () => setStatus('submitted'), hidden: !can('memos', 'edit') || memo.status !== 'draft' },
    { label: 'Mark under review', onClick: () => setStatus('under_review'), hidden: !canApprove || memo.status !== 'submitted' },
    { label: 'Approve', onClick: () => setStatus('approved'), hidden: !canApprove || !reviewable },
    { label: 'Reject', onClick: () => setStatus('rejected'), hidden: !canApprove || !reviewable },
    {
      label: 'Delete',
      danger: true,
      separator: true,
      onClick: () => setConfirmDelete(true),
      hidden: !can('memos', 'delete') || (memo.status !== 'draft' && !can('memos', 'manage')),
    },
  ];

  return (
    <div className="space-y-6">
      {back}
      <PageHeader
        title={memo.name}
        description={
          <>
            {memo.ministry_name ? <>From {memo.ministry_name} · </> : null}
            Created {formatDate(memo.created_at)}
            {memo.creator_name ? <> by {memo.creator_name}</> : null}
          </>
        }
        actions={
          <>
            {can('memos', 'edit') && (
              <Btn variant="outline" size="sm" onClick={() => setEditing(true)}>
                Edit
              </Btn>
            )}
            <ActionsMenu items={items} />
          </>
        }
      />

      {actionError && (
        <div className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-theme-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
          {actionError}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="min-w-0 space-y-6 xl:col-span-2">
          <Card title="Executive summary">
            <p className="whitespace-pre-wrap break-words text-theme-sm text-gray-700 dark:text-gray-300">{memo.summary || '—'}</p>
          </Card>
          <Card title="Content">
            <div className="whitespace-pre-wrap break-words text-theme-sm text-gray-700 dark:text-gray-300">{memo.body || '—'}</div>
          </Card>
        </div>
        <Card title="Details" className="h-fit">
          <DetailList
            items={[
              { label: 'Status', value: <StatusBadge tone={toneForStatus(memo.status)}>{labelFor(MEMO_STATUSES, memo.status)}</StatusBadge> },
              { label: 'Priority', value: <StatusBadge tone={priorityTone(memo.priority)}>{labelFor(MEMO_PRIORITIES, memo.priority)}</StatusBadge> },
              { label: 'Type', value: labelFor(MEMO_TYPES, memo.memo_type) },
              { label: 'Ministry', value: memo.ministry_name ? `${memo.ministry_name}${memo.ministry_acronym ? ` (${memo.ministry_acronym})` : ''}` : '—' },
              { label: 'State dept.', value: memo.state_department_name || '—' },
              { label: 'Agency', value: memo.agency_name || '—' },
              { label: 'Submitted', value: formatDate(memo.submitted_at) },
              { label: 'Updated', value: formatDate(memo.updated_at) },
            ]}
          />
        </Card>
      </div>

      <MemoFormSlideOver open={editing} memoId={memo.id} onClose={() => setEditing(false)} onSaved={refetch} />
      <ConfirmDialog
        open={confirmDelete}
        title="Delete memo?"
        message={<>“{memo.name}” will be permanently deleted. This cannot be undone.</>}
        busy={busy}
        onConfirm={remove}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}
