// Dashboard list cards (server-renderable, no client state).
import React from 'react';
import Link from 'next/link';
import { CalendarDays, MapPin } from 'lucide-react';
import { Card, StatusBadge } from '@/components/ui/kit';
import { toneForStatus } from '@/components/ui/kit/status';

export type MeetingRow = { id: number; name: string; type: string | null; start_at: string | null; location: string | null; status: string | null };
export type MemoRow = { id: number; name: string; status: string | null; priority: string | null; updated_at: string | null; created_at: string | null };
export type AgendaRow = { id: number; name: string; status: string | null; meeting_id: number | null; updated_at: string | null; created_at: string | null };
export type ActivityRow = { id: number; action: string; target_type: string | null; metadata: Record<string, unknown> | null; created_at: string | null };

const fmt = (d: string | null, time = false) =>
  d
    ? new Date(d).toLocaleString('en-GB', {
        day: 'numeric',
        month: 'short',
        ...(time ? { hour: '2-digit', minute: '2-digit' } : { year: 'numeric' }),
      })
    : '—';

const label = (s: string | null) => (s ? s.replace(/_/g, ' ') : '—');

function ViewAll({ href }: { href: string }) {
  return (
    <Link href={href} className="text-theme-sm font-medium text-brand-500 hover:text-brand-600 dark:text-brand-400">
      View all
    </Link>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="py-6 text-center text-theme-sm text-gray-500 dark:text-gray-400">{children}</p>;
}

export function UpcomingMeetingsList({ rows }: { rows: MeetingRow[] }) {
  return (
    <Card title="Upcoming meetings" actions={<ViewAll href="/meetings" />} padded={false}>
      {rows.length === 0 ? (
        <Empty>No meetings scheduled.</Empty>
      ) : (
        <ul className="divide-y divide-gray-100 dark:divide-gray-800">
          {rows.map((m) => (
            <li key={m.id}>
              <Link href={`/meetings/${m.id}`} className="flex items-start gap-4 px-5 py-4 hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800">
                  <span className="text-theme-xs uppercase text-gray-500 dark:text-gray-400">
                    {m.start_at ? new Date(m.start_at).toLocaleString('en-GB', { month: 'short' }) : '—'}
                  </span>
                  <span className="text-base font-semibold leading-none text-gray-800 dark:text-white/90">
                    {m.start_at ? new Date(m.start_at).getDate() : ''}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-theme-sm font-medium text-gray-800 dark:text-white/90">{m.name}</p>
                  <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-theme-xs text-gray-500 dark:text-gray-400">
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays className="h-3.5 w-3.5" /> {fmt(m.start_at, true)}
                    </span>
                    {m.location && (
                      <span className="inline-flex min-w-0 items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">{m.location}</span>
                      </span>
                    )}
                  </p>
                </div>
                <StatusBadge tone={toneForStatus(m.status)}>{label(m.status)}</StatusBadge>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function SimpleList<T extends { id: number; name: string; status: string | null; updated_at: string | null; created_at: string | null }>({
  title,
  href,
  itemHref,
  rows,
  empty,
}: {
  title: string;
  href: string;
  itemHref: (r: T) => string;
  rows: T[];
  empty: string;
}) {
  return (
    <Card title={title} actions={<ViewAll href={href} />} padded={false}>
      {rows.length === 0 ? (
        <Empty>{empty}</Empty>
      ) : (
        <ul className="divide-y divide-gray-100 dark:divide-gray-800">
          {rows.map((r) => (
            <li key={r.id}>
              <Link href={itemHref(r)} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-theme-sm font-medium text-gray-800 dark:text-white/90">{r.name}</p>
                  <p className="mt-0.5 text-theme-xs text-gray-500 dark:text-gray-400">Updated {fmt(r.updated_at ?? r.created_at)}</p>
                </div>
                <StatusBadge tone={toneForStatus(r.status)}>{label(r.status)}</StatusBadge>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export function MemoList({ rows }: { rows: MemoRow[] }) {
  return <SimpleList title="Recent memos" href="/memos" itemHref={(m) => `/memos/${m.id}`} rows={rows} empty="No memos yet." />;
}

export function AgendaList({ rows }: { rows: AgendaRow[] }) {
  return <SimpleList title="Recent agenda items" href="/agenda" itemHref={(a) => `/agenda/${a.id}`} rows={rows} empty="No agenda items yet." />;
}

export function ActivityList({ rows }: { rows: ActivityRow[] }) {
  return (
    <Card title="Recent activity" actions={<ViewAll href="/audit" />} padded={false}>
      {rows.length === 0 ? (
        <Empty>No activity recorded yet.</Empty>
      ) : (
        <ul className="divide-y divide-gray-100 dark:divide-gray-800">
          {rows.map((a) => (
            <li key={a.id} className="flex items-center gap-4 px-5 py-3.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-theme-sm text-gray-800 dark:text-white/90">
                  <span className="font-medium">{String(a.metadata?.actor ?? 'System')}</span>{' '}
                  <span className="text-gray-500 dark:text-gray-400">{label(a.action).toLowerCase()}</span>
                </p>
                <p className="mt-0.5 text-theme-xs text-gray-500 dark:text-gray-400">{fmt(a.created_at, true)}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
