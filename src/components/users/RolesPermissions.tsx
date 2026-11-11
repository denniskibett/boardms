'use client';

/**
 * Roles & Permissions — roles table plus a MODULES × ACTIONS permission matrix in a slide-over.
 * Everything (modules, actions, labels, defaults) comes from '@/lib/rbac'.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import {
  Btn,
  ConfirmDialog,
  DataTable,
  Field,
  FormGrid,
  SelectInput,
  SlideOver,
  StatusBadge,
  TextArea,
  TextInput,
  type Column,
} from '@/components/ui/kit';
import { usePermissions, refreshPermissions } from '@/hooks/usePermissions';
import {
  ACTIONS,
  ACTION_LABELS,
  DEFAULT_ROLE_PERMISSIONS,
  MODULES,
  SUPER_ROLE,
  normalizePermissions,
  type Action,
  type ModuleKey,
  type Permissions,
} from '@/lib/rbac';
import Notice, { FormError, type NoticeState } from './Notice';

export interface RoleItem {
  id: number;
  roleKey: string;
  name: string;
  description: string;
  hierarchy: number;
  isSystemRole: boolean;
  permissions: Permissions;
  userCount: number;
}

/* ---------- permission matrix helpers ---------- */

function toggle(perms: Permissions, mod: ModuleKey, action: Action, on: boolean): Permissions {
  const cur = new Set<Action>(perms[mod] ?? []);
  if (action === 'manage') {
    if (on) ACTIONS.forEach((a) => cur.add(a));
    else cur.clear();
  } else if (action === 'view' && !on) {
    cur.clear(); // no view → nothing else makes sense
  } else if (on) {
    cur.add(action);
    cur.add('view');
  } else {
    cur.delete(action);
    cur.delete('manage');
  }
  const next = { ...perms };
  if (cur.size) next[mod] = ACTIONS.filter((a) => cur.has(a));
  else delete next[mod];
  return next;
}

/** Effective state for display: manage checks every box. */
function has(perms: Permissions, mod: ModuleKey, action: Action) {
  const list = perms[mod] ?? [];
  return list.includes('manage') || list.includes(action);
}

function summary(perms: Permissions) {
  const mods = Object.keys(perms).length;
  if (!mods) return 'No access';
  const full = Object.values(perms).filter((a) => a?.includes('manage')).length;
  return `${mods} of ${MODULES.length} modules${full ? ` · ${full} full` : ''}`;
}

function PermissionMatrix({
  value,
  onChange,
  disabled,
}: {
  value: Permissions;
  onChange: (p: Permissions) => void;
  disabled?: boolean;
}) {
  const all = () => onChange(Object.fromEntries(MODULES.map((m) => [m.key, ['manage']])) as Permissions);
  const viewAll = () =>
    onChange(Object.fromEntries(MODULES.map((m) => [m.key, value[m.key]?.length ? value[m.key] : ['view']])) as Permissions);

  return (
    <div className="space-y-3">
      {!disabled && (
        <div className="flex flex-wrap gap-2">
          <Btn type="button" size="sm" variant="outline" onClick={viewAll}>
            View everything
          </Btn>
          <Btn type="button" size="sm" variant="outline" onClick={all}>
            Full access
          </Btn>
          <Btn type="button" size="sm" variant="ghost" onClick={() => onChange({})}>
            Clear all
          </Btn>
        </div>
      )}
      <div className="max-w-full overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
        <table className="min-w-[640px] w-full">
          <thead className="bg-gray-50 dark:bg-white/[0.02]">
            <tr>
              <th className="px-4 py-3 text-left text-theme-xs font-medium text-gray-500 dark:text-gray-400">Module</th>
              {ACTIONS.map((a) => (
                <th key={a} className="px-2 py-3 text-center text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                  {ACTION_LABELS[a]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {MODULES.map((m) => (
              <tr key={m.key} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                <td className="px-4 py-3">
                  <p className="text-theme-sm font-medium text-gray-800 dark:text-white/90">{m.label}</p>
                  <p className="text-theme-xs text-gray-500 dark:text-gray-400">{m.description}</p>
                </td>
                {ACTIONS.map((a) => (
                  <td key={a} className="px-2 py-3 text-center">
                    <input
                      type="checkbox"
                      aria-label={`${m.label}: ${ACTION_LABELS[a]}`}
                      checked={has(value, m.key, a)}
                      disabled={disabled}
                      onChange={(e) => onChange(toggle(value, m.key, a, e.target.checked))}
                      className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500/20 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-theme-xs text-gray-500 dark:text-gray-400">
        Manage grants every action on a module. Any action also grants View.
      </p>
    </div>
  );
}

/* ---------- screen ---------- */

type Panel =
  | { kind: 'permissions'; role: RoleItem }
  | { kind: 'details'; role: RoleItem | null }
  | null;

type DetailsForm = { name: string; roleKey: string; description: string; hierarchy: string; copyFrom: string };

export default function RolesPermissions() {
  const { can, role: myRole } = usePermissions();
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notice, setNotice] = useState<NoticeState>(null);

  const [panel, setPanel] = useState<Panel>(null);
  const [perms, setPerms] = useState<Permissions>({});
  const [form, setForm] = useState<DetailsForm>({ name: '', roleKey: '', description: '', hierarchy: '', copyFrom: '' });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [confirm, setConfirm] = useState<{ kind: 'delete' | 'reset'; role: RoleItem } | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const res = await fetch('/api/roles', { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to load roles');
      setRoles(json);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Failed to load roles');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const canEdit = can('roles', 'edit');
  const canCreate = can('roles', 'create');
  const canDelete = can('roles', 'delete');
  const locked = (r: RoleItem) => r.roleKey === SUPER_ROLE && myRole !== SUPER_ROLE;

  const close = () => {
    if (saving) return;
    setPanel(null);
    setFormError(null);
  };

  const openPermissions = (role: RoleItem) => {
    setPerms(normalizePermissions(role.permissions));
    setFormError(null);
    setPanel({ kind: 'permissions', role });
  };

  const openDetails = (role: RoleItem | null) => {
    setForm({
      name: role?.name ?? '',
      roleKey: role?.roleKey ?? '',
      description: role?.description ?? '',
      hierarchy: role ? String(role.hierarchy) : '',
      copyFrom: '',
    });
    setFormError(null);
    setPanel({ kind: 'details', role });
  };

  const send = async (method: 'POST' | 'PUT', body: Record<string, unknown>) => {
    const res = await fetch('/api/roles', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error || 'Save failed');
    return json as RoleItem;
  };

  const afterSave = async (message: string) => {
    await load();
    refreshPermissions();
    setNotice({ tone: 'success', message });
  };

  const savePermissions = async () => {
    if (panel?.kind !== 'permissions') return;
    setSaving(true);
    setFormError(null);
    try {
      await send('PUT', { roleKey: panel.role.roleKey, permissions: perms });
      setPanel(null);
      await afterSave(`Permissions saved for ${panel.role.name}.`);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const saveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (panel?.kind !== 'details') return;
    if (!form.name.trim()) {
      setFormError('Name is required');
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      const hierarchy = form.hierarchy ? Number(form.hierarchy) : undefined;
      if (panel.role) {
        await send('PUT', { roleKey: panel.role.roleKey, name: form.name, description: form.description, hierarchy });
        setPanel(null);
        await afterSave(`${form.name} updated.`);
      } else {
        const source = roles.find((r) => r.roleKey === form.copyFrom);
        const created = await send('POST', {
          name: form.name,
          roleKey: form.roleKey || undefined,
          description: form.description,
          hierarchy,
          permissions: source?.permissions ?? DEFAULT_ROLE_PERMISSIONS[form.copyFrom] ?? {},
        });
        await afterSave(`${created.name} created.`);
        openPermissions(created);
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const runConfirm = async () => {
    if (!confirm) return;
    setBusy(true);
    try {
      if (confirm.kind === 'delete') {
        const res = await fetch(`/api/roles?roleKey=${encodeURIComponent(confirm.role.roleKey)}`, { method: 'DELETE' });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json.error || 'Delete failed');
        await afterSave(`${confirm.role.name} deleted.`);
      } else {
        await send('PUT', { roleKey: confirm.role.roleKey, permissions: DEFAULT_ROLE_PERMISSIONS[confirm.role.roleKey] ?? {} });
        await afterSave(`${confirm.role.name} reset to its default permissions.`);
      }
    } catch (e) {
      setNotice({ tone: 'error', message: e instanceof Error ? e.message : 'Action failed' });
    } finally {
      setBusy(false);
      setConfirm(null);
    }
  };

  const columns = useMemo<Column<RoleItem>[]>(
    () => [
      {
        key: 'name',
        header: 'Role',
        sortable: true,
        cell: (r) => (
          <div className="min-w-[180px]">
            <p className="font-medium text-gray-800 dark:text-white/90">{r.name}</p>
            {r.description && <p className="text-theme-xs text-gray-500 dark:text-gray-400 line-clamp-1">{r.description}</p>}
          </div>
        ),
      },
      {
        key: 'roleKey',
        header: 'Key',
        sortable: true,
        hideBelow: 'md',
        cell: (r) => <code className="text-theme-xs text-gray-500 dark:text-gray-400">{r.roleKey}</code>,
      },
      { key: 'userCount', header: 'Users', sortable: true, cell: (r) => r.userCount },
      { key: 'hierarchy', header: 'Level', sortable: true, hideBelow: 'sm', cell: (r) => r.hierarchy },
      {
        key: 'access',
        header: 'Access',
        hideBelow: 'lg',
        cell: (r) => (
          <span className="text-theme-xs text-gray-500 dark:text-gray-400">
            {r.roleKey === SUPER_ROLE ? 'Everything (always)' : summary(r.permissions)}
          </span>
        ),
      },
      {
        key: 'type',
        header: 'Type',
        hideBelow: 'sm',
        cell: (r) => <StatusBadge tone={r.isSystemRole ? 'brand' : 'gray'}>{r.isSystemRole ? 'System' : 'Custom'}</StatusBadge>,
      },
    ],
    [],
  );

  const editingPerms = panel?.kind === 'permissions' ? panel.role : null;
  const permsReadOnly = !!editingPerms && (!canEdit || editingPerms.roleKey === SUPER_ROLE);

  return (
    <div className="space-y-4">
      <Notice notice={notice} onClose={() => setNotice(null)} />

      <DataTable
        title="Roles"
        description="Each role grants actions per module. Users get the permissions of their role."
        rows={roles}
        rowKey={(r) => r.roleKey}
        columns={columns}
        loading={loading}
        error={loadError}
        searchKeys={(r) => [r.name, r.roleKey, r.description]}
        searchPlaceholder="Search roles…"
        initialSort={{ key: 'hierarchy', dir: 'asc' }}
        pageSize={20}
        onRowClick={(r) => openPermissions(r)}
        toolbar={
          canCreate ? (
            <Btn size="sm" onClick={() => openDetails(null)}>
              <Plus className="h-4 w-4" /> New role
            </Btn>
          ) : null
        }
        actions={(r) => [
          { label: canEdit && !locked(r) ? 'Edit permissions' : 'View permissions', onClick: () => openPermissions(r) },
          { label: 'Edit details', onClick: () => openDetails(r), hidden: !canEdit || locked(r) },
          {
            label: 'Reset to default',
            onClick: () => setConfirm({ kind: 'reset', role: r }),
            hidden: !canEdit || locked(r) || r.roleKey === SUPER_ROLE || !DEFAULT_ROLE_PERMISSIONS[r.roleKey],
          },
          {
            label: 'Delete',
            danger: true,
            separator: true,
            onClick: () => setConfirm({ kind: 'delete', role: r }),
            hidden: !canDelete || r.isSystemRole,
          },
        ]}
      />

      {/* Permissions matrix */}
      <SlideOver
        open={panel?.kind === 'permissions'}
        onClose={close}
        busy={saving}
        size="xl"
        title={editingPerms ? `${editingPerms.name} permissions` : 'Permissions'}
        description={
          editingPerms?.roleKey === SUPER_ROLE
            ? 'The system administrator role always has full access.'
            : `${editingPerms?.userCount ?? 0} user(s) have this role.`
        }
        footer={
          <>
            <Btn variant="outline" onClick={close} disabled={saving}>
              {permsReadOnly ? 'Close' : 'Cancel'}
            </Btn>
            {!permsReadOnly && (
              <Btn onClick={savePermissions} loading={saving}>
                Save permissions
              </Btn>
            )}
          </>
        }
      >
        {formError && <FormError message={formError} />}
        {editingPerms && DEFAULT_ROLE_PERMISSIONS[editingPerms.roleKey] && !permsReadOnly && (
          <div className="mb-4">
            <Btn
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setPerms(normalizePermissions(DEFAULT_ROLE_PERMISSIONS[editingPerms.roleKey]))}
            >
              Load default permissions
            </Btn>
          </div>
        )}
        <PermissionMatrix
          value={editingPerms?.roleKey === SUPER_ROLE ? (DEFAULT_ROLE_PERMISSIONS[SUPER_ROLE] ?? {}) : perms}
          onChange={setPerms}
          disabled={permsReadOnly}
        />
      </SlideOver>

      {/* Role details / create */}
      <SlideOver
        open={panel?.kind === 'details'}
        onClose={close}
        busy={saving}
        title={panel?.kind === 'details' && panel.role ? `Edit ${panel.role.name}` : 'New role'}
        description="Name and ordering. Set what the role can do under Edit permissions."
        footer={
          <>
            <Btn variant="outline" onClick={close} disabled={saving}>
              Cancel
            </Btn>
            <Btn type="submit" form="role-details-form" loading={saving}>
              {panel?.kind === 'details' && panel.role ? 'Save' : 'Create role'}
            </Btn>
          </>
        }
      >
        <form id="role-details-form" onSubmit={saveDetails}>
          {formError && <FormError message={formError} />}
          <FormGrid>
            <Field label="Name" required>
              <TextInput value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} maxLength={100} />
            </Field>
            {panel?.kind === 'details' && !panel.role && (
              <Field label="Key" hint="Lower-case identifier. Leave blank to derive it from the name." span={1}>
                <TextInput
                  value={form.roleKey}
                  onChange={(e) => setForm({ ...form, roleKey: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') })}
                  placeholder="e.g. records_officer"
                />
              </Field>
            )}
            <Field label="Level" hint="Lower numbers rank higher." span={1}>
              <TextInput
                type="number"
                min={1}
                value={form.hierarchy}
                onChange={(e) => setForm({ ...form, hierarchy: e.target.value })}
              />
            </Field>
            <Field label="Description">
              <TextArea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </Field>
            {panel?.kind === 'details' && !panel.role && (
              <Field label="Start with permissions from">
                <SelectInput
                  value={form.copyFrom}
                  onChange={(e) => setForm({ ...form, copyFrom: e.target.value })}
                  placeholder="No permissions"
                  options={roles.filter((r) => r.roleKey !== SUPER_ROLE).map((r) => ({ value: r.roleKey, label: r.name }))}
                />
              </Field>
            )}
          </FormGrid>
        </form>
      </SlideOver>

      <ConfirmDialog
        open={!!confirm}
        busy={busy}
        title={confirm?.kind === 'delete' ? `Delete ${confirm.role.name}?` : `Reset ${confirm?.role.name}?`}
        message={
          confirm?.kind === 'delete'
            ? 'The role is removed permanently. Roles that still have users cannot be deleted.'
            : 'Its permissions are replaced with the standard defaults for this role.'
        }
        confirmLabel={confirm?.kind === 'delete' ? 'Delete' : 'Reset'}
        danger={confirm?.kind === 'delete'}
        onConfirm={runConfirm}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}
