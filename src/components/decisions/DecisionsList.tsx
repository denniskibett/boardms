'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Btn, DataTable, DetailList, PageHeader, SlideOver, StatusBadge, type ActionItem, type Column } from '@/components/ui/kit';
import { usePermissions } from '@/hooks/usePermissions';
import { api, formatDate } from '@/components/memos/memoOptions';
import ActionLetterFormSlideOver from '@/components/action-letters/ActionLetterFormSlideOver';

interface Decision {
  id: number;
  agenda_id: number | null;
  agenda_name: string | null;
  discussion_summary: string | null;
  recommendations: string | null;
  decision_type: string | null;
  decision_text: string | null;
  requires_president_signature: boolean | null;
  signed_by_name: string | null;
  signed_at: string | null;
  meeting_id: number | null;
  meeting_name: string | null;
  meeting_date: string | null;
  memo_id: number | null;
  memo_name: string | null;
  ministry_name: string | null;
  created_at: string;
}

const typeTone = (t?: string | null) => {
  const s = (t || '').toLowerCase();
  if (/approv|adopt|endorse/.test(s)) return 'success' as const;
  if (/reject|declin/.test(s)) return 'error' as const;
  if (/defer|refer|review/.test(s)) return 'warning' as const;
  return 'gray' as const;
};

const signature = (d: Decision) =>
  d.signed_at ? (
    <StatusBadge tone="success">Signed</StatusBadge>
  ) : d.requires_president_signature ? (
    <StatusBadge tone="warning">Awaiting signature</StatusBadge>
  ) : (
    <span className="text-gray-400">Not required</span>
  );

export default function DecisionsList() {
  const { can } = usePermissions();
  const [rows, setRows] = useState<Decision[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewing, setViewing] = useState<Decision | null>(null);
  const [letterFor, setLetterFor] = useState<Decision | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setRows(await api<Decision[]>('/api/decisions'));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const canIssue = can('actionLetters', 'create');
  const title = (d: Decision) => d.agenda_name || d.memo_name || `Decision #${d.id}`;

  const columns: Column<Decision>[] = [
    {
      key: 'title',
      header: 'Decision',
      sortable: true,
      sortValue: title,
      className: 'min-w-[220px] max-w-md',
      cell: (d) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-gray-800 dark:text-white/90">{title(d)}</p>
          {d.decision_text && <p className="line-clamp-1 text-theme-xs text-gray-500 dark:text-gray-400">{d.decision_text}</p>}
        </div>
      ),
    },
    {
      key: 'decision_type',
      header: 'Outcome',
      sortable: true,
      cell: (d) => (d.decision_type ? <StatusBadge tone={typeTone(d.decision_type)}>{d.decision_type.replace(/_/g, ' ')}</StatusBadge> : '—'),
    },
    { key: 'meeting_name', header: 'Meeting', sortable: true, hideBelow: 'lg', cell: (d) => d.meeting_name || '—' },
    { key: 'ministry_name', header: 'Ministry', sortable: true, hideBelow: 'xl', cell: (d) => d.ministry_name || '—' },
    { key: 'signature', header: 'Signature', hideBelow: 'md', cell: signature },
    {
      key: 'date',
      header: 'Date',
      sortable: true,
      hideBelow: 'sm',
      sortValue: (d) => d.meeting_date || d.created_at,
      cell: (d) => formatDate(d.meeting_date || d.created_at),
    },
  ];

  const actions = (d: Decision): ActionItem[] => [
    { label: 'View', onClick: () => setViewing(d) },
    { label: 'Open memo', href: d.memo_id ? `/memos/${d.memo_id}` : undefined, hidden: !d.memo_id || !can('memos', 'view') },
    { label: 'Issue action letter', onClick: () => setLetterFor(d), hidden: !canIssue },
  ];

  return (
    <>
      <PageHeader title="Cabinet decisions" description="Decisions recorded on agenda items during cabinet and committee meetings." />

      <DataTable
        rows={rows}
        columns={columns}
        rowKey={(d) => d.id}
        loading={loading}
        error={error}
        searchKeys={(d) => [d.agenda_name, d.memo_name, d.decision_text, d.decision_type, d.meeting_name, d.ministry_name]}
        searchPlaceholder="Search decisions…"
        actions={actions}
        onRowClick={setViewing}
        initialSort={{ key: 'date', dir: 'desc' }}
        emptyTitle="No decisions recorded yet"
        emptyDescription="Decisions appear here once deliberations are recorded on agenda items."
      />

      <SlideOver
        open={!!viewing}
        onClose={() => setViewing(null)}
        size="lg"
        title={viewing ? title(viewing) : 'Decision'}
        description={viewing?.meeting_name ? `${viewing.meeting_name} · ${formatDate(viewing.meeting_date)}` : undefined}
        footer={
          viewing && canIssue ? (
            <Btn
              onClick={() => {
                setLetterFor(viewing);
                setViewing(null);
              }}
            >
              Issue action letter
            </Btn>
          ) : undefined
        }
      >
        {viewing && (
          <div className="space-y-6">
            <DetailList
              items={[
                { label: 'Outcome', value: viewing.decision_type ? viewing.decision_type.replace(/_/g, ' ') : '—' },
                { label: 'Memo', value: viewing.memo_name || '—' },
                { label: 'Ministry', value: viewing.ministry_name || '—' },
                { label: 'Signature', value: signature(viewing) },
                { label: 'Signed by', value: viewing.signed_by_name ? `${viewing.signed_by_name} · ${formatDate(viewing.signed_at)}` : '—' },
              ]}
            />
            {[
              ['Decision', viewing.decision_text],
              ['Recommendations', viewing.recommendations],
              ['Discussion summary', viewing.discussion_summary],
            ].map(([label, text]) =>
              text ? (
                <div key={label}>
                  <h4 className="mb-2 text-sm font-semibold text-gray-800 dark:text-white/90">{label}</h4>
                  <p className="whitespace-pre-wrap break-words text-theme-sm text-gray-700 dark:text-gray-300">{text}</p>
                </div>
              ) : null,
            )}
          </div>
        )}
      </SlideOver>

      <ActionLetterFormSlideOver
        open={!!letterFor}
        decisionId={letterFor?.id}
        decisionSubject={letterFor ? title(letterFor) : null}
        onClose={() => setLetterFor(null)}
        onSaved={() => undefined}
      />
    </>
  );
}
