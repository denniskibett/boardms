'use client';

/**
 * Row actions + slide-overs for a user: View, Edit, Change role, Reset password, Suspend/Activate, Delete.
 * Shared by the users table and the single-user page.
 *
 *   const ua = useUserActions({ onChanged: reload });
 *   <DataTable actions={ua.items} … />
 *   {ua.element}
 */

import React, { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  Btn,
  ConfirmDialog,
  DetailList,
  Field,
  FormGrid,
  SelectInput,
  SlideOver,
  StatusBadge,
  TextInput,
  toneForStatus,
  type ActionItem,
} from '@/components/ui/kit';
import { usePermissions } from '@/hooks/usePermissions';
import { normalizeRoleKey, SUPER_ROLE } from '@/lib/rbac';
import { FormError, type NoticeState } from './Notice';

export interface UserRecord {
  id: number;
  auth_id: string | null;
  name: string;
  email: string;
  role: string;
  image?: string | null;
  status?: string | null;
  phone?: string | null;
  last_login?: string | null;
  created_at?: string | null;
}

export interface RoleOption {
  roleKey: string;
  name: string;
}

export const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'Pending' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'suspended', label: 'Suspended' },
];

export const fmtDate = (d?: string | null, withTime = false) =>
  d
    ? new Date(d).toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
      })
    : '—';

export function Avatar({ name, image, size = 40 }: { name: string; image?: string | null; size?: number }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
  return image ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={image} alt="" width={size} height={size} className="shrink-0 rounded-full object-cover" style={{ width: size, height: size }} />
  ) : (
    <span
      className="flex shrink-0 items-center justify-center rounded-full bg-brand-50 text-theme-sm font-semibold text-brand-500 dark:bg-brand-500/15 dark:text-brand-400"
      style={{ width: size, height: size }}
    >
      {initials || '?'}
    </span>
  );
}

type Panel = { kind: 'view' | 'edit' | 'create' | 'role' | 'password'; user: UserRecord | null } | null;
type Confirm = { kind: 'delete' | 'suspend' | 'activate'; user: UserRecord } | null;

const emptyForm = { name: '', email: '', phone: '', role: '', status: 'active', password: '', confirm: '' };

async function call(url: string, method: string, body?: unknown) {
  const res = await fetch(url, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || 'Request failed');
  return json;
}

export function useUserActions({
  onChanged,
  onDeleted,
  setNotice,
}: {
  onChanged: (u?: UserRecord) => void;
  onDeleted?: (u: UserRecord) => void;
  setNotice: (n: NoticeState) => void;
}) {
  const { can, role: myRole } = usePermissions();
  const { data: session } = useSession();
  const myEmail = session?.user?.email?.toLowerCase();

  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [panel, setPanel] = useState<Panel>(null);
  const [confirm, setConfirm] = useState<Confirm>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canCreate = can('users', 'create');
  const canEdit = can('users', 'edit');
  const canDelete = can('users', 'delete');

  useEffect(() => {
    if (!canEdit && !canCreate) return;
    fetch('/api/roles')
      .then((r) => (r.ok ? r.json() : []))
      .then((list: RoleOption[]) => setRoles(Array.isArray(list) ? list : []))
      .catch(() => setRoles([]));
  }, [canEdit, canCreate]);

  // Only a sysadmin may hand out or change the sysadmin role.
  const roleOptions = roles
    .filter((r) => r.roleKey !== SUPER_ROLE || myRole === SUPER_ROLE)
    .map((r) => ({ value: r.roleKey, label: r.name }));
  const roleKeyOf = (u: UserRecord | null) => {
    const k = normalizeRoleKey(u?.role);
    return roles.find((r) => r.roleKey === k || normalizeRoleKey(r.name) === k)?.roleKey ?? '';
  };

  const isSelf = (u: UserRecord) => !!myEmail && u.email?.toLowerCase() === myEmail;
  const isProtected = (u: UserRecord) => normalizeRoleKey(u.role) === SUPER_ROLE && myRole !== SUPER_ROLE;

  const open = useCallback(
    (kind: NonNullable<Panel>['kind'], user: UserRecord | null) => {
      setError(null);
      setForm({
        ...emptyForm,
        name: user?.name ?? '',
        email: user?.email ?? '',
        phone: user?.phone ?? '',
        status: user?.status ?? 'active',
        role: roleKeyOf(user),
      });
      setPanel({ kind, user });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [roles],
  );

  const close = () => !saving && setPanel(null);

  const items = (u: UserRecord): ActionItem[] => {
    const locked = isProtected(u);
    const self = isSelf(u);
    const suspended = u.status === 'suspended';
    return [
      { label: 'View', onClick: () => open('view', u) },
      { label: 'Edit', onClick: () => open('edit', u), hidden: !canEdit || locked },
      { label: 'Change role', onClick: () => open('role', u), hidden: !canEdit || locked || self },
      { label: 'Reset password', onClick: () => open('password', u), hidden: !canEdit || locked || !u.auth_id },
      {
        label: suspended ? 'Activate' : 'Suspend',
        onClick: () => setConfirm({ kind: suspended ? 'activate' : 'suspend', user: u }),
        hidden: !canEdit || locked || self,
        separator: true,
      },
      { label: 'Delete', danger: true, onClick: () => setConfirm({ kind: 'delete', user: u }), hidden: !canDelete || locked || self },
    ];
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!panel) return;
    const u = panel.user;
    setError(null);

    if ((panel.kind === 'create' || panel.kind === 'password') && form.password !== form.confirm) {
      setError('Passwords do not match');
      return;
    }
    if ((panel.kind === 'create' || panel.kind === 'password') && form.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setSaving(true);
    try {
      let saved: UserRecord | undefined;
      let message = '';
      if (panel.kind === 'create') {
        saved = await call('/api/users', 'POST', {
          name: form.name,
          email: form.email,
          phone: form.phone,
          role: form.role,
          status: form.status,
          password: form.password,
        });
        message = `${form.name} added.`;
      } else if (panel.kind === 'edit' && u) {
        saved = await call(`/api/users/${u.id}`, 'PUT', {
          name: form.name,
          email: form.email,
          phone: form.phone,
          ...(isSelf(u) ? {} : { status: form.status }),
          ...(form.role && form.role !== roleKeyOf(u) && !isSelf(u) ? { role: form.role } : {}),
        });
        message = `${form.name} updated.`;
      } else if (panel.kind === 'role' && u) {
        saved = await call(`/api/users/${u.id}/role`, 'PUT', { role: form.role });
        message = `${u.name} is now ${saved?.role}.`;
      } else if (panel.kind === 'password' && u) {
        await call(`/api/users/${u.id}/reset-password`, 'POST', { password: form.password });
        message = `Password reset for ${u.name}. Share it with them securely.`;
      }
      setPanel(null);
      setNotice({ tone: 'success', message });
      onChanged(saved);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const runConfirm = async () => {
    if (!confirm) return;
    const u = confirm.user;
    setSaving(true);
    try {
      if (confirm.kind === 'delete') {
        await call(`/api/users/${u.id}`, 'DELETE');
        setNotice({ tone: 'success', message: `${u.name} deleted.` });
        onDeleted ? onDeleted(u) : onChanged();
      } else {
        const status = confirm.kind === 'suspend' ? 'suspended' : 'active';
        const saved = await call(`/api/users/${u.id}/status`, 'PUT', { status });
        setNotice({ tone: 'success', message: `${u.name} ${status === 'active' ? 'activated' : 'suspended'}.` });
        onChanged(saved);
      }
    } catch (err) {
      setNotice({ tone: 'error', message: err instanceof Error ? err.message : 'Action failed' });
    } finally {
      setSaving(false);
      setConfirm(null);
    }
  };

  const u = panel?.user ?? null;
  const formId = 'user-panel-form';
  const titles: Record<NonNullable<Panel>['kind'], string> = {
    view: u?.name ?? 'User',
    create: 'Add user',
    edit: `Edit ${u?.name ?? 'user'}`,
    role: `Change role`,
    password: `Reset password`,
  };
  const submitLabel: Partial<Record<NonNullable<Panel>['kind'], string>> = {
    create: 'Add user',
    edit: 'Save changes',
    role: 'Change role',
    password: 'Reset password',
  };

  const element = (
    <>
      <SlideOver
        open={!!panel}
        onClose={close}
        busy={saving}
        title={panel ? titles[panel.kind] : ''}
        description={panel?.kind === 'view' ? u?.email : panel?.kind === 'create' ? 'Creates the sign-in account and profile.' : u ? `${u.name} · ${u.email}` : undefined}
        footer={
          panel?.kind === 'view' ? (
            <>
              <Btn variant="outline" onClick={close}>
                Close
              </Btn>
              {u && canEdit && !isProtected(u) && <Btn onClick={() => open('edit', u)}>Edit</Btn>}
            </>
          ) : (
            <>
              <Btn variant="outline" onClick={close} disabled={saving}>
                Cancel
              </Btn>
              <Btn type="submit" form={formId} loading={saving}>
                {panel ? submitLabel[panel.kind] : 'Save'}
              </Btn>
            </>
          )
        }
      >
        {panel?.kind === 'view' && u && (
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <Avatar name={u.name} image={u.image} size={56} />
              <div className="min-w-0">
                <p className="truncate text-base font-semibold text-gray-800 dark:text-white/90">{u.name}</p>
                <p className="truncate text-theme-sm text-gray-500 dark:text-gray-400">{u.role}</p>
              </div>
            </div>
            <DetailList
              items={[
                { label: 'Email', value: u.email },
                { label: 'Phone', value: u.phone || '—' },
                { label: 'Role', value: u.role },
                { label: 'Status', value: <StatusBadge tone={toneForStatus(u.status)}>{u.status ?? '—'}</StatusBadge> },
                { label: 'Last sign-in', value: fmtDate(u.last_login, true) },
                { label: 'Created', value: fmtDate(u.created_at) },
                { label: 'Sign-in account', value: u.auth_id ? 'Linked' : 'Not linked' },
              ]}
            />
          </div>
        )}

        {panel && panel.kind !== 'view' && (
          <form id={formId} onSubmit={submit}>
            <FormError message={error} />
            <FormGrid>
              {(panel.kind === 'create' || panel.kind === 'edit') && (
                <>
                  <Field label="Full name" required>
                    <TextInput value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required maxLength={255} />
                  </Field>
                  <Field label="Email" required span={1}>
                    <TextInput type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                  </Field>
                  <Field label="Phone" span={1}>
                    <TextInput type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} maxLength={20} />
                  </Field>
                  {!(u && isSelf(u)) && (
                    <>
                      <Field label="Role" required span={1}>
                        <SelectInput
                          value={form.role}
                          onChange={(e) => setForm({ ...form, role: e.target.value })}
                          options={roleOptions}
                          placeholder="Choose a role…"
                          required
                        />
                      </Field>
                      <Field label="Status" span={1}>
                        <SelectInput value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} options={STATUS_OPTIONS} />
                      </Field>
                    </>
                  )}
                </>
              )}

              {panel.kind === 'role' && (
                <Field label="Role" required hint={u ? `Currently ${u.role}.` : undefined}>
                  <SelectInput
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    options={roleOptions}
                    placeholder="Choose a role…"
                    required
                  />
                </Field>
              )}

              {(panel.kind === 'create' || panel.kind === 'password') && (
                <>
                  <Field label={panel.kind === 'create' ? 'Password' : 'New password'} required span={1} hint="At least 8 characters.">
                    <TextInput
                      type="password"
                      autoComplete="new-password"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      required
                      minLength={8}
                    />
                  </Field>
                  <Field label="Confirm password" required span={1}>
                    <TextInput
                      type="password"
                      autoComplete="new-password"
                      value={form.confirm}
                      onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                      required
                    />
                  </Field>
                </>
              )}
            </FormGrid>
          </form>
        )}
      </SlideOver>

      <ConfirmDialog
        open={!!confirm}
        busy={saving}
        danger={confirm?.kind !== 'activate'}
        title={
          confirm?.kind === 'delete'
            ? `Delete ${confirm.user.name}?`
            : confirm?.kind === 'suspend'
              ? `Suspend ${confirm.user.name}?`
              : `Activate ${confirm?.user.name}?`
        }
        message={
          confirm?.kind === 'delete'
            ? 'The profile and sign-in account are removed permanently. Users linked to meetings or documents can only be suspended.'
            : confirm?.kind === 'suspend'
              ? 'They will not be able to sign in until the account is activated again.'
              : 'They will be able to sign in again.'
        }
        confirmLabel={confirm?.kind === 'delete' ? 'Delete' : confirm?.kind === 'suspend' ? 'Suspend' : 'Activate'}
        onConfirm={runConfirm}
        onCancel={() => setConfirm(null)}
      />
    </>
  );

  return { items, element, openCreate: () => open('create', null), openView: (u: UserRecord) => open('view', u), canCreate };
}
