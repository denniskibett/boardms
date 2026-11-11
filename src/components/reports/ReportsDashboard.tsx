'use client';

/** Reports: date-range filter, headline figures, breakdowns and the meetings list (CSV export). */

import React, { useCallback, useEffect, useState } from 'react';
import { BookOpen, Building2, CalendarDays, Download, FileText, Mail, Users } from 'lucide-react';
import { Btn, Card, DataTable, StatusBadge, toneForStatus, type Column } from '@/components/ui/kit';
import MetricCard, { MetricGrid } from '@/components/dashboard/MetricCard';
import { downloadCsv, filterInputCls } from './csv';

type Bucket = { label: string; count: number };
type Meeting = { id: number; name: string; type: string | null; status: string | null; start_at: string | null; location: string | null };
type Report = {
  range: { from: string | null; to: string | null };
  meetings: { total: number; byStatus: Bucket[]; byType: Bucket[]; byMonth: Bucket[]; list: Meeting[] } | null;
  agenda: { total: number; byStatus: Bucket[] } | null;
  memos: { total: number; byStatus: Bucket[]; byPriority: Bucket[] } | null;
  actionLetters: { total: number; byStatus: Bucket[] } | null;
  users: { total: number; byRole: Bucket[]; byStatus: Bucket[] } | null;
  mdas: { ministries: number; stateDepartments: number; agencies: number } | null;
};

const pretty = (s: string) => s.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());
const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
const monthLabel = (ym: string) => {
  const [y, m] = ym.split('-').map(Number);
  return new Date(y, (m || 1) - 1, 1).toLocaleString('en-GB', { month: 'short', year: 'numeric' });
};

function Breakdown({ title, rows, format = pretty }: { title: string; rows: Bucket[]; format?: (s: string) => string }) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <Card title={title}>
      {rows.length === 0 ? (
        <p className="text-theme-sm text-gray-500 dark:text-gray-400">No data for this period.</p>
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => (
            <li key={r.label}>
              <div className="mb-1 flex items-center justify-between gap-3 text-theme-sm">
                <span className="truncate text-gray-700 dark:text-gray-300">{format(r.label)}</span>
                <span className="font-medium text-gray-800 dark:text-white/90">{r.count}</span>
              </div>
              <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800">
                <div className="h-2 rounded-full bg-brand-500" style={{ width: `${(r.count / max) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

const meetingColumns: Column<Meeting>[] = [
  { key: 'name', header: 'Meeting', sortable: true, cell: (m) => <span className="font-medium text-gray-800 dark:text-white/90">{m.name}</span> },
  { key: 'start_at', header: 'Date', sortable: true, cell: (m) => <span className="whitespace-nowrap">{fmtDate(m.start_at)}</span> },
  { key: 'type', header: 'Type', sortable: true, hideBelow: 'md', cell: (m) => m.type ?? '—' },
  { key: 'location', header: 'Location', hideBelow: 'lg', cell: (m) => m.location ?? '—' },
  { key: 'status', header: 'Status', sortable: true, cell: (m) => <StatusBadge tone={toneForStatus(m.status)}>{m.status ?? '—'}</StatusBadge> },
];

export default function ReportsDashboard() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [data, setData] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (f: string, t: string) => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams();
      if (f) qs.set('from', f);
      if (t) qs.set('to', t);
      const res = await fetch(`/api/reports?${qs}`, { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to load reports');
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(from, to);
  }, [load, from, to]);

  const preset = (days: number | null) => {
    if (days == null) {
      setFrom('');
      setTo('');
      return;
    }
    const d = new Date();
    setTo(d.toISOString().slice(0, 10));
    d.setDate(d.getDate() - days);
    setFrom(d.toISOString().slice(0, 10));
  };

  const exportMeetings = () =>
    data?.meetings &&
    downloadCsv(
      `meetings${from ? `-from-${from}` : ''}${to ? `-to-${to}` : ''}.csv`,
      ['Meeting', 'Date', 'Type', 'Location', 'Status'],
      data.meetings.list.map((m) => [m.name, m.start_at, m.type, m.location, m.status]),
    );

  const v = (n: number | undefined) => (loading ? '…' : (n ?? '—'));

  return (
    <div className="space-y-6">
      <Card padded>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-wrap items-end gap-3">
            <label className="text-theme-sm text-gray-600 dark:text-gray-400">
              <span className="mb-1 block">From</span>
              <input type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} className={filterInputCls} />
            </label>
            <label className="text-theme-sm text-gray-600 dark:text-gray-400">
              <span className="mb-1 block">To</span>
              <input type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} className={filterInputCls} />
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            <Btn size="sm" variant="outline" onClick={() => preset(30)}>
              Last 30 days
            </Btn>
            <Btn size="sm" variant="outline" onClick={() => preset(90)}>
              Last 90 days
            </Btn>
            <Btn size="sm" variant="outline" onClick={() => preset(365)}>
              Last 12 months
            </Btn>
            <Btn size="sm" variant="ghost" onClick={() => preset(null)}>
              All time
            </Btn>
          </div>
        </div>
      </Card>

      {error && (
        <div className="rounded-xl border border-error-200 bg-error-50 px-4 py-3 text-theme-sm text-error-600 dark:border-error-500/30 dark:bg-error-500/15 dark:text-error-400">
          {error}
        </div>
      )}

      <MetricGrid>
        {data?.meetings !== null && <MetricCard icon={CalendarDays} label="Meetings" value={v(data?.meetings?.total)} />}
        {data?.agenda !== null && <MetricCard icon={BookOpen} label="Agenda items" value={v(data?.agenda?.total)} />}
        {data?.memos !== null && <MetricCard icon={FileText} label="Cabinet memos" value={v(data?.memos?.total)} />}
        {data?.actionLetters !== null && <MetricCard icon={Mail} label="Action letters" value={v(data?.actionLetters?.total)} />}
        {data?.users && <MetricCard icon={Users} label="Users" value={v(data.users.total)} hint="Not affected by the date range" />}
        {data?.mdas && (
          <MetricCard
            icon={Building2}
            label="Ministries"
            value={v(data.mdas.ministries)}
            hint={`${data.mdas.stateDepartments} state departments · ${data.mdas.agencies} agencies`}
          />
        )}
      </MetricGrid>

      {data && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {data.meetings && <Breakdown title="Meetings by month" rows={data.meetings.byMonth} format={monthLabel} />}
          {data.meetings && <Breakdown title="Meetings by status" rows={data.meetings.byStatus} />}
          {data.meetings && <Breakdown title="Meetings by type" rows={data.meetings.byType} />}
          {data.agenda && <Breakdown title="Agenda items by status" rows={data.agenda.byStatus} />}
          {data.memos && <Breakdown title="Memos by status" rows={data.memos.byStatus} />}
          {data.memos && <Breakdown title="Memos by priority" rows={data.memos.byPriority} />}
          {data.actionLetters && <Breakdown title="Action letters by status" rows={data.actionLetters.byStatus} />}
          {data.users && <Breakdown title="Users by role" rows={data.users.byRole} format={(s) => s} />}
          {data.users && <Breakdown title="Users by status" rows={data.users.byStatus} />}
        </div>
      )}

      {data?.meetings !== null && (
        <DataTable
          title="Meetings in period"
          rows={data?.meetings?.list ?? []}
          rowKey={(m) => m.id}
          columns={meetingColumns}
          loading={loading}
          searchKeys={(m) => [m.name, m.type, m.status, m.location]}
          initialSort={{ key: 'start_at', dir: 'desc' }}
          emptyTitle="No meetings in this period"
          toolbar={
            <Btn size="sm" variant="outline" onClick={exportMeetings} disabled={!data?.meetings?.list.length}>
              <Download className="h-4 w-4" /> Export CSV
            </Btn>
          }
        />
      )}
    </div>
  );
}
