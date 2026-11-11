'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Users, UserCheck, UserX, Clock } from 'lucide-react';
import { Btn, DataTable, StatusBadge, toneForStatus, type Column } from '@/components/ui/kit';
import MetricCard, { MetricGrid } from '@/components/dashboard/MetricCard';
import Notice, { type NoticeState } from './Notice';
import { Avatar, STATUS_OPTIONS, fmtDate, useUserActions, type UserRecord } from './useUserActions';

const filterCls =
  'h-10 rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-700 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300';

export default function UsersList() {
  const router = useRouter();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<NoticeState>(null);
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch('/api/users', { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to load users');
      setUsers(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const ua = useUserActions({
    setNotice,
    onChanged: (saved) => {
      if (saved?.id) {
        setUsers((list) => (list.some((u) => u.id === saved.id) ? list.map((u) => (u.id === saved.id ? saved : u)) : [saved, ...list]));
      } else load();
    },
    onDeleted: (u) => setUsers((list) => list.filter((x) => x.id !== u.id)),
  });

  const roles = useMemo(() => Array.from(new Set(users.map((u) => u.role).filter(Boolean))).sort(), [users]);
  const rows = useMemo(
    () => users.filter((u) => (!roleFilter || u.role === roleFilter) && (!statusFilter || (u.status ?? '') === statusFilter)),
    [users, roleFilter, statusFilter],
  );
  const count = (s: string) => users.filter((u) => u.status === s).length;

  const columns = useMemo<Column<UserRecord>[]>(
    () => [
      {
        key: 'name',
        header: 'User',
        sortable: true,
        cell: (u) => (
          <div className="flex min-w-[200px] items-center gap-3">
            <Avatar name={u.name} image={u.image} />
            <div className="min-w-0">
              <p className="truncate font-medium text-gray-800 dark:text-white/90">{u.name}</p>
              <p className="truncate text-theme-xs text-gray-500 dark:text-gray-400">{u.email}</p>
            </div>
          </div>
        ),
      },
      { key: 'role', header: 'Role', sortable: true, cell: (u) => <span className="whitespace-nowrap">{u.role}</span> },
      {
        key: 'status',
        header: 'Status',
        sortable: true,
        cell: (u) => <StatusBadge tone={toneForStatus(u.status)}>{u.status ?? '—'}</StatusBadge>,
      },
      { key: 'phone', header: 'Phone', hideBelow: 'lg', cell: (u) => u.phone || '—' },
      {
        key: 'last_login',
        header: 'Last sign-in',
        sortable: true,
        hideBelow: 'md',
        cell: (u) => <span className="whitespace-nowrap">{fmtDate(u.last_login)}</span>,
      },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      <MetricGrid>
        <MetricCard icon={Users} label="Total users" value={loading ? '…' : users.length} />
        <MetricCard icon={UserCheck} label="Active" value={loading ? '…' : count('active')} />
        <MetricCard icon={Clock} label="Pending" value={loading ? '…' : count('pending')} />
        <MetricCard icon={UserX} label="Suspended or inactive" value={loading ? '…' : count('suspended') + count('inactive')} />
      </MetricGrid>

      <Notice notice={notice} onClose={() => setNotice(null)} />

      <DataTable
        title="Users"
        rows={rows}
        rowKey={(u) => u.id}
        columns={columns}
        loading={loading}
        error={error}
        searchKeys={(u) => [u.name, u.email, u.role, u.phone]}
        searchPlaceholder="Search name, email, role…"
        initialSort={{ key: 'name', dir: 'asc' }}
        emptyTitle="No users found"
        onRowClick={(u) => router.push(`/users/${u.id}`)}
        actions={ua.items}
        toolbar={
          <>
            <select aria-label="Filter by role" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className={filterCls}>
              <option value="">All roles</option>
              {roles.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <select aria-label="Filter by status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={filterCls}>
              <option value="">All statuses</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            {ua.canCreate && (
              <Btn size="sm" onClick={ua.openCreate}>
                <Plus className="h-4 w-4" /> Add user
              </Btn>
            )}
          </>
        }
      />
      {ua.element}
    </div>
  );
}
