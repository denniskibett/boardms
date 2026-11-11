'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Building2, Landmark, Network, Plus } from 'lucide-react';
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
  TextInput,
  toneForStatus,
  type ActionItem,
  type Column,
} from '@/components/ui/kit';
import { usePermissions } from '@/hooks/usePermissions';
import { api } from '@/components/memos/memoOptions';

type MDAType = 'ministry' | 'department' | 'agency';

interface MDA {
  id: number;
  name: string;
  acronym?: string | null;
  status?: string | null;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  location?: string | null;
  headquarters?: string | null;
  principal_secretary?: string | null;
  director_general?: string | null;
  chairperson?: string | null;
  ministry_id?: number | null;
  state_department_id?: number | null;
  ministries?: { id: number; name: string; acronym: string | null } | null;
  state_departments?: { id: number; name: string; ministry_id: number | null; ministries?: { id: number; name: string; acronym: string | null } | null } | null;
}

type FieldDef = { key: keyof MDA & string; label: string; required?: boolean; span?: 1 | 2; type?: string; select?: 'ministry' | 'department' };

const TYPES: { key: MDAType; label: string; singular: string; icon: React.ReactNode; fields: FieldDef[] }[] = [
  {
    key: 'ministry',
    label: 'Ministries',
    singular: 'ministry',
    icon: <Landmark className="h-5 w-5" />,
    fields: [
      { key: 'name', label: 'Name', required: true },
      { key: 'acronym', label: 'Acronym', span: 1 },
      { key: 'headquarters', label: 'Headquarters', span: 1 },
      { key: 'email', label: 'Email', span: 1, type: 'email' },
      { key: 'phone', label: 'Phone', span: 1, type: 'tel' },
      { key: 'website', label: 'Website', type: 'url' },
    ],
  },
  {
    key: 'department',
    label: 'State departments',
    singular: 'state department',
    icon: <Building2 className="h-5 w-5" />,
    fields: [
      { key: 'name', label: 'Name', required: true },
      { key: 'ministry_id', label: 'Ministry', required: true, select: 'ministry' },
      { key: 'principal_secretary', label: 'Principal Secretary', span: 1 },
      { key: 'location', label: 'Location', span: 1 },
      { key: 'email', label: 'Email', span: 1, type: 'email' },
      { key: 'phone', label: 'Phone', span: 1, type: 'tel' },
      { key: 'website', label: 'Website', type: 'url' },
    ],
  },
  {
    key: 'agency',
    label: 'Agencies',
    singular: 'agency',
    icon: <Network className="h-5 w-5" />,
    fields: [
      { key: 'name', label: 'Name', required: true },
      { key: 'acronym', label: 'Acronym', span: 1 },
      { key: 'state_department_id', label: 'State department', required: true, span: 1, select: 'department' },
      { key: 'director_general', label: 'Director General', span: 1 },
      { key: 'chairperson', label: 'Chairperson', span: 1 },
      { key: 'location', label: 'Location', span: 1 },
      { key: 'phone', label: 'Phone', span: 1, type: 'tel' },
      { key: 'email', label: 'Email', span: 1, type: 'email' },
      { key: 'website', label: 'Website', span: 1, type: 'url' },
    ],
  },
];

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

const withAcronym = (m: { name: string; acronym?: string | null }) => (m.acronym ? `${m.name} (${m.acronym})` : m.name);

export default function MDAsManager() {
  const { can } = usePermissions();
  const [tab, setTab] = useState<MDAType>('ministry');
  const [data, setData] = useState<Record<MDAType, MDA[]>>({ ministry: [], department: [], agency: [] });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [form, setForm] = useState<{ open: boolean; type: MDAType; row: MDA | null }>({ open: false, type: 'ministry', row: null });
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState<{ type: MDAType; row: MDA } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadType = useCallback(async (type: MDAType) => {
    const res = await api<{ data: MDA[] }>(`/api/mdas?type=${type}&limit=2000`);
    setData((d) => ({ ...d, [type]: res.data ?? [] }));
  }, []);

  useEffect(() => {
    Promise.all((['ministry', 'department', 'agency'] as MDAType[]).map(loadType))
      .catch((e: Error) => setLoadError(e.message))
      .finally(() => setLoading(false));
  }, [loadType]);

  const cfg = TYPES.find((t) => t.key === form.type)!;
  const ministryOptions = useMemo(() => data.ministry.map((m) => ({ value: m.id, label: withAcronym(m) })), [data.ministry]);
  const departmentOptions = useMemo(() => data.department.map((d) => ({ value: d.id, label: d.name })), [data.department]);

  const openForm = (type: MDAType, row: MDA | null) => {
    const def = TYPES.find((t) => t.key === type)!;
    const v: Record<string, string> = { status: row?.status ?? 'active' };
    for (const f of def.fields) v[f.key] = row?.[f.key] != null ? String(row[f.key]) : '';
    setValues(v);
    setErrors({});
    setForm({ open: true, type, row });
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const er: Record<string, string> = {};
    for (const f of cfg.fields) if (f.required && !values[f.key]?.trim()) er[f.key] = `${f.label} is required`;
    setErrors(er);
    if (Object.keys(er).length) return;

    setSaving(true);
    try {
      if (form.row) {
        await api(`/api/mdas/${form.row.id}?type=${form.type}`, { method: 'PUT', body: JSON.stringify(values) });
      } else {
        await api('/api/mdas', { method: 'POST', body: JSON.stringify({ ...values, type: form.type }) });
      }
      await loadType(form.type);
      setForm((f) => ({ ...f, open: false }));
    } catch (err) {
      setErrors({ form: (err as Error).message });
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    setActionError(null);
    try {
      await api(`/api/mdas/${toDelete.row.id}?type=${toDelete.type}`, { method: 'DELETE' });
      setData((d) => ({ ...d, [toDelete.type]: d[toDelete.type].filter((r) => r.id !== toDelete.row.id) }));
    } catch (err) {
      setActionError((err as Error).message);
    } finally {
      setDeleting(false);
      setToDelete(null);
    }
  };

  const statusCol: Column<MDA> = {
    key: 'status',
    header: 'Status',
    sortable: true,
    hideBelow: 'sm',
    cell: (r) => <StatusBadge tone={toneForStatus(r.status)}>{r.status === 'inactive' ? 'Inactive' : 'Active'}</StatusBadge>,
  };
  const nameCol: Column<MDA> = {
    key: 'name',
    header: 'Name',
    sortable: true,
    className: 'min-w-[200px] max-w-md',
    cell: (r) => (
      <div className="min-w-0">
        <p className="font-medium text-gray-800 dark:text-white/90">{r.name}</p>
        {r.acronym && <p className="text-theme-xs text-gray-500 dark:text-gray-400">{r.acronym}</p>}
      </div>
    ),
  };

  const columns: Record<MDAType, Column<MDA>[]> = {
    ministry: [
      nameCol,
      { key: 'headquarters', header: 'Headquarters', sortable: true, hideBelow: 'md', cell: (r) => r.headquarters || '—' },
      { key: 'email', header: 'Email', hideBelow: 'lg', cell: (r) => r.email || '—' },
      {
        key: 'departments',
        header: 'Departments',
        hideBelow: 'xl',
        sortValue: (r) => data.department.filter((d) => d.ministry_id === r.id).length,
        sortable: true,
        cell: (r) => data.department.filter((d) => d.ministry_id === r.id).length,
      },
      statusCol,
    ],
    department: [
      nameCol,
      {
        key: 'ministry',
        header: 'Ministry',
        sortable: true,
        hideBelow: 'md',
        sortValue: (r) => r.ministries?.name,
        cell: (r) => r.ministries?.acronym || r.ministries?.name || '—',
      },
      { key: 'principal_secretary', header: 'Principal Secretary', sortable: true, hideBelow: 'lg', cell: (r) => r.principal_secretary || '—' },
      { key: 'email', header: 'Email', hideBelow: 'xl', cell: (r) => r.email || '—' },
      statusCol,
    ],
    agency: [
      nameCol,
      {
        key: 'department',
        header: 'State department',
        sortable: true,
        hideBelow: 'md',
        sortValue: (r) => r.state_departments?.name,
        cell: (r) => (
          <div>
            <p>{r.state_departments?.name || '—'}</p>
            {r.state_departments?.ministries && (
              <p className="text-theme-xs text-gray-500 dark:text-gray-400">
                {r.state_departments.ministries.acronym || r.state_departments.ministries.name}
              </p>
            )}
          </div>
        ),
      },
      { key: 'director_general', header: 'Director General', sortable: true, hideBelow: 'lg', cell: (r) => r.director_general || '—' },
      statusCol,
    ],
  };

  const actions =
    (type: MDAType) =>
    (r: MDA): ActionItem[] => [
      { label: 'Edit', onClick: () => openForm(type, r), hidden: !can('mdas', 'edit') },
      { label: 'Delete', danger: true, onClick: () => setToDelete({ type, row: r }), hidden: !can('mdas', 'delete') },
    ];

  const current = TYPES.find((t) => t.key === tab)!;

  return (
    <>
      <PageHeader
        title="Ministries, departments & agencies"
        description="The structure of government used across memos, meetings and resources."
        actions={
          can('mdas', 'create') && (
            <Btn onClick={() => openForm(tab, null)}>
              <Plus className="h-4 w-4" />
              New {current.singular}
            </Btn>
          )
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {TYPES.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            aria-pressed={tab === t.key}
            className={`flex items-center gap-4 rounded-2xl border bg-white p-5 text-left transition dark:bg-white/[0.03] ${
              tab === t.key
                ? 'border-brand-300 ring-3 ring-brand-500/10 dark:border-brand-700'
                : 'border-gray-200 hover:border-gray-300 dark:border-gray-800 dark:hover:border-gray-700'
            }`}
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400">
              {t.icon}
            </span>
            <span>
              <span className="block text-theme-sm text-gray-500 dark:text-gray-400">{t.label}</span>
              <span className="block text-title-sm font-semibold text-gray-800 dark:text-white/90">
                {loading ? '…' : data[t.key].length.toLocaleString()}
              </span>
            </span>
          </button>
        ))}
      </div>

      {actionError && (
        <div className="mb-4 rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-theme-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
          {actionError}
        </div>
      )}

      <DataTable
        key={tab}
        title={current.label}
        rows={data[tab]}
        columns={columns[tab]}
        rowKey={(r) => r.id}
        loading={loading}
        error={loadError}
        searchKeys={(r) => [r.name, r.acronym, r.ministries?.name, r.state_departments?.name, r.principal_secretary, r.director_general]}
        searchPlaceholder={`Search ${current.label.toLowerCase()}…`}
        actions={actions(tab)}
        onRowClick={can('mdas', 'edit') ? (r) => openForm(tab, r) : undefined}
        initialSort={{ key: 'name', dir: 'asc' }}
        emptyTitle={`No ${current.label.toLowerCase()} yet`}
      />

      <SlideOver
        open={form.open}
        onClose={() => setForm((f) => ({ ...f, open: false }))}
        busy={saving}
        size="lg"
        title={`${form.row ? 'Edit' : 'New'} ${cfg.singular}`}
        footer={
          <>
            <Btn variant="outline" onClick={() => setForm((f) => ({ ...f, open: false }))} disabled={saving}>
              Cancel
            </Btn>
            <Btn type="submit" form="mda-form" loading={saving}>
              {form.row ? 'Save changes' : `Create ${cfg.singular}`}
            </Btn>
          </>
        }
      >
        <form id="mda-form" onSubmit={save} className="space-y-5">
          {errors.form && (
            <div className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-theme-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
              {errors.form}
            </div>
          )}
          <FormGrid>
            {cfg.fields.map((f) => (
              <Field key={f.key} label={f.label} required={f.required} span={f.span} error={errors[f.key]}>
                {f.select ? (
                  <SelectInput
                    value={values[f.key] ?? ''}
                    onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                    options={f.select === 'ministry' ? ministryOptions : departmentOptions}
                    placeholder={`Select ${f.label.toLowerCase()}`}
                  />
                ) : (
                  <TextInput
                    type={f.type ?? 'text'}
                    value={values[f.key] ?? ''}
                    onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                  />
                )}
              </Field>
            ))}
            <Field label="Status" span={1}>
              <SelectInput value={values.status ?? 'active'} onChange={(e) => setValues((v) => ({ ...v, status: e.target.value }))} options={STATUS_OPTIONS} />
            </Field>
          </FormGrid>
        </form>
      </SlideOver>

      <ConfirmDialog
        open={!!toDelete}
        title={`Delete ${toDelete ? TYPES.find((t) => t.key === toDelete.type)!.singular : ''}?`}
        message={toDelete ? <>“{toDelete.row.name}” will be permanently deleted. This cannot be undone.</> : null}
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </>
  );
}
