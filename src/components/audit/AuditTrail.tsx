'use client';

/** Audit trail: filterable list of audit_logs with details in a slide-over and CSV export. */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import { Btn, DataTable, DetailList, SlideOver, StatusBadge, type Column, type Tone } from '@/components/ui/kit';
import { downloadCsv, filterInputCls } from '@/components/reports/csv';

type Entry = {
  id: number;
  createdAt: string | null;
  action: string;
  targetType: string | null;
  targetId: number | null;
  actor: string;
  actorEmail: string | null;
  actorRole: string | null;
  ipAddress: string | null;
  metadata: Record<string, unknown>;
};

const fmt = (d: string | null) =>
  d ? new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
const pretty = (s: string) => s.replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase());

function toneFor(action: string): Tone {
  if (/DELETE|SUSPEND/.test(action)) return 'error';
  if (/PASSWORD|ROLE/.test(action)) return 'warning';
  if (/CREATE/.test(action)) return 'success';
  return 'gray';
}

const columns: Column<Entry>[] = [
  { key: 'createdAt', header: 'When', sortable: true, cell: (e) => <span className="whitespace-nowrap">{fmt(e.createdAt)}</span> },
  {
    key: 'actor',
    header: 'User',
    sortable: true,
    cell: (e) => (
      <div className="min-w-[140px]">
        <p className="font-medium text-gray-800 dark:text-white/90">{e.actor}</p>
        {e.actorRole && <p className="text-theme-xs text-gray-500 dark:text-gray-400">{e.actorRole}</p>}
      </div>
    ),
  },
  { key: 'action', header: 'Action', sortable: true, cell: (e) => <StatusBadge tone={toneFor(e.action)}>{pretty(e.action)}</StatusBadge> },
  {
    key: 'target',
    header: 'Target',
    hideBelow: 'md',
    cell: (e) => {
      const t = (e.metadata.email ?? e.metadata.name ?? e.metadata.roleKey ?? e.metadata.target) as string | undefined;
      return (
        <span className="text-gray-600 dark:text-gray-400">
          {e.targetType ?? '—'}
          {t ? ` · ${t}` : e.targetId ? ` #${e.targetId}` : ''}
        </span>
      );
    },
  },
  { key: 'ipAddress', header: 'IP', hideBelow: 'lg', cell: (e) => e.ipAddress ?? '—' },
];

export default function AuditTrail() {
  const [rows, setRows] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [action, setAction] = useState('');
  const [selected, setSelected] = useState<Entry | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams();
      if (from) qs.set('from', from);
      if (to) qs.set('to', to);
      const res = await fetch(`/api/audit?${qs}`, { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to load the audit trail');
      setRows(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load the audit trail');
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    load();
  }, [load]);

  const actions = useMemo(() => Array.from(new Set(rows.map((r) => r.action))).sort(), [rows]);
  const visible = useMemo(() => (action ? rows.filter((r) => r.action === action) : rows), [rows, action]);

  const exportCsv = () =>
    downloadCsv(
      'audit-trail.csv',
      ['When', 'User', 'Email', 'Role', 'Action', 'Target type', 'Target id', 'IP', 'Details'],
      visible.map((e) => [e.createdAt, e.actor, e.actorEmail, e.actorRole, e.action, e.targetType, e.targetId, e.ipAddress, JSON.stringify(e.metadata)]),
    );

  return (
    <>
      <DataTable
        title="Activity"
        description="Changes to users, roles and settings are recorded here."
        rows={visible}
        rowKey={(e) => e.id}
        columns={columns}
        loading={loading}
        error={error}
        searchKeys={(e) => [e.actor, e.actorEmail, e.action, e.targetType, JSON.stringify(e.metadata)]}
        searchPlaceholder="Search activity…"
        initialSort={{ key: 'createdAt', dir: 'desc' }}
        pageSize={20}
        emptyTitle="No activity recorded"
        emptyDescription="Entries appear as people change users, roles and settings."
        onRowClick={setSelected}
        actions={(e) => [{ label: 'View details', onClick: () => setSelected(e) }]}
        toolbar={
          <>
            <input type="date" aria-label="From date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} className={filterInputCls} />
            <input type="date" aria-label="To date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} className={filterInputCls} />
            <select aria-label="Filter by action" value={action} onChange={(e) => setAction(e.target.value)} className={filterInputCls}>
              <option value="">All actions</option>
              {actions.map((a) => (
                <option key={a} value={a}>
                  {pretty(a)}
                </option>
              ))}
            </select>
            <Btn size="sm" variant="outline" onClick={exportCsv} disabled={!visible.length}>
              <Download className="h-4 w-4" /> Export
            </Btn>
          </>
        }
      />

      <SlideOver
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected ? pretty(selected.action) : ''}
        description={selected ? fmt(selected.createdAt) : undefined}
        footer={
          <Btn variant="outline" onClick={() => setSelected(null)}>
            Close
          </Btn>
        }
      >
        {selected && (
          <div className="space-y-5">
            <DetailList
              items={[
                { label: 'User', value: selected.actor },
                { label: 'Email', value: selected.actorEmail ?? '—' },
                { label: 'Role', value: selected.actorRole ?? '—' },
                { label: 'Target', value: `${selected.targetType ?? '—'}${selected.targetId ? ` #${selected.targetId}` : ''}` },
                { label: 'IP address', value: selected.ipAddress ?? '—' },
              ]}
            />
            <div>
              <h4 className="mb-2 text-sm font-semibold text-gray-800 dark:text-white/90">Details</h4>
              <pre className="max-h-96 overflow-auto rounded-lg bg-gray-50 p-4 text-theme-xs text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                {JSON.stringify(selected.metadata, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </SlideOver>
    </>
  );
}
