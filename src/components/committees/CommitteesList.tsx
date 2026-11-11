'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import {
  Btn,
  ConfirmDialog,
  DataTable,
  Field,
  FormGrid,
  PageHeader,
  SelectInput,
  SlideOver,
  StatusBadge,
  TextArea,
  TextInput,
  toneForStatus,
  type ActionItem,
  type Column,
} from '@/components/ui/kit';
import { usePermissions } from '@/hooks/usePermissions';
import { api, formatDate } from '@/components/memos/memoOptions';

interface Committee {
  id: number;
  name: string;
  cluster_id: number | null;
  cluster_name: string | null;
  chair_title: string | null;
  description: string | null;
  status: string | null;
  created_at: string;
}

const CHAIRS = ['President', 'Deputy President', 'Prime Cabinet Secretary', 'Cabinet Secretary'];
const blank = { name: '', cluster_id: '', chair_title: 'Deputy President', description: '', status: 'active' };

export default function CommitteesList() {
  const { can } = usePermissions();
  const [rows, setRows] = useState<Committee[]>([]);
  const [clusters, setClusters] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Committee | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(blank);
  const [formError, setFormError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState<Committee | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      setRows(await api<Committee[]>('/api/committees'));
    } catch (e) {
      setLoadError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openForm = (c: Committee | null) => {
    setEditing(c);
    setForm(
      c
        ? {
            name: c.name,
            cluster_id: c.cluster_id ? String(c.cluster_id) : '',
            chair_title: c.chair_title ?? '',
            description: c.description ?? '',
            status: c.status ?? 'active',
          }
        : blank,
    );
    setFormError(null);
    setNameError(null);
    setFormOpen(true);
    if (!clusters.length) api<{ id: number; name: string }[]>('/api/committees/clusters').then(setClusters).catch(() => undefined);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setNameError('Name is required');
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      await api(editing ? `/api/committees/${editing.id}` : '/api/committees', {
        method: editing ? 'PUT' : 'POST',
        body: JSON.stringify(form),
      });
      setFormOpen(false);
      await load();
    } catch (err) {
      setFormError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await api(`/api/committees/${toDelete.id}`, { method: 'DELETE' });
      setRows((list) => list.filter((c) => c.id !== toDelete.id));
    } catch (e) {
      setActionError((e as Error).message);
    } finally {
      setDeleting(false);
      setToDelete(null);
    }
  };

  const set = (k: keyof typeof blank) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    if (k === 'name') setNameError(null);
  };

  const columns: Column<Committee>[] = [
    {
      key: 'name',
      header: 'Committee',
      sortable: true,
      className: 'min-w-[220px] max-w-md',
      cell: (c) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-gray-800 dark:text-white/90">{c.name}</p>
          {c.description && <p className="line-clamp-1 text-theme-xs text-gray-500 dark:text-gray-400">{c.description}</p>}
        </div>
      ),
    },
    { key: 'chair_title', header: 'Chair', sortable: true, hideBelow: 'sm', cell: (c) => c.chair_title || '—' },
    { key: 'cluster_name', header: 'Cluster', sortable: true, hideBelow: 'md', cell: (c) => c.cluster_name || '—' },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      cell: (c) => <StatusBadge tone={toneForStatus(c.status)}>{c.status === 'inactive' ? 'Inactive' : 'Active'}</StatusBadge>,
    },
    { key: 'created_at', header: 'Created', sortable: true, hideBelow: 'lg', cell: (c) => formatDate(c.created_at) },
  ];

  const actions = (c: Committee): ActionItem[] => [
    { label: 'Edit', onClick: () => openForm(c), hidden: !can('committees', 'edit') },
    { label: 'Delete', danger: true, onClick: () => setToDelete(c), hidden: !can('committees', 'delete') },
  ];

  return (
    <>
      <PageHeader
        title="Cabinet committees"
        description="Standing committees of cabinet and the clusters they serve."
        actions={
          can('committees', 'create') && (
            <Btn onClick={() => openForm(null)}>
              <Plus className="h-4 w-4" />
              New committee
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
        rowKey={(c) => c.id}
        loading={loading}
        error={loadError}
        searchKeys={(c) => [c.name, c.chair_title, c.cluster_name, c.description]}
        searchPlaceholder="Search committees…"
        actions={actions}
        onRowClick={can('committees', 'edit') ? (c) => openForm(c) : undefined}
        emptyTitle="No committees yet"
      />

      <SlideOver
        open={formOpen}
        onClose={() => setFormOpen(false)}
        busy={saving}
        title={editing ? 'Edit committee' : 'New committee'}
        footer={
          <>
            <Btn variant="outline" onClick={() => setFormOpen(false)} disabled={saving}>
              Cancel
            </Btn>
            <Btn type="submit" form="committee-form" loading={saving}>
              {editing ? 'Save changes' : 'Create committee'}
            </Btn>
          </>
        }
      >
        <form id="committee-form" onSubmit={save} className="space-y-5">
          {formError && (
            <div className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-theme-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
              {formError}
            </div>
          )}
          <FormGrid>
            <Field label="Name" required error={nameError}>
              <TextInput value={form.name} onChange={set('name')} placeholder="e.g. Infrastructure & Energy Committee" />
            </Field>
            <Field label="Chair" span={1}>
              <SelectInput
                value={form.chair_title}
                onChange={set('chair_title')}
                options={[...new Set([...CHAIRS, form.chair_title].filter(Boolean))].map((c) => ({ value: c, label: c }))}
                placeholder="Select chair"
              />
            </Field>
            <Field label="Cluster" span={1}>
              <SelectInput
                value={form.cluster_id}
                onChange={set('cluster_id')}
                options={clusters.map((c) => ({ value: c.id, label: c.name }))}
                placeholder="None"
              />
            </Field>
            <Field label="Status" span={1}>
              <SelectInput
                value={form.status}
                onChange={set('status')}
                options={[
                  { value: 'active', label: 'Active' },
                  { value: 'inactive', label: 'Inactive' },
                ]}
              />
            </Field>
            <Field label="Description">
              <TextArea value={form.description} onChange={set('description')} rows={4} placeholder="Mandate of the committee" />
            </Field>
          </FormGrid>
        </form>
      </SlideOver>

      <ConfirmDialog
        open={!!toDelete}
        title="Delete committee?"
        message={toDelete ? <>“{toDelete.name}” will be permanently deleted. This cannot be undone.</> : null}
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </>
  );
}
