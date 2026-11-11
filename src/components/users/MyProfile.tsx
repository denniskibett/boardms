'use client';

/** /profile — the signed-in user's own profile. Edit details and change password in slide-overs. */

import React, { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { KeyRound, Pencil } from 'lucide-react';
import { Btn, Card, DetailList, Field, FormGrid, PageHeader, SlideOver, StatusBadge, TextInput, toneForStatus } from '@/components/ui/kit';
import { usePermissions } from '@/hooks/usePermissions';
import { MODULES, ACTION_LABELS } from '@/lib/rbac';
import Notice, { FormError, type NoticeState } from './Notice';
import { Avatar, fmtDate, type UserRecord } from './useUserActions';

type Panel = 'edit' | 'password' | null;

export default function MyProfile() {
  const { update } = useSession();
  const { permissions, role } = usePermissions();
  const [me, setMe] = useState<UserRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notice, setNotice] = useState<NoticeState>(null);

  const [panel, setPanel] = useState<Panel>(null);
  const [form, setForm] = useState({ name: '', phone: '', current: '', next: '', confirm: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/users/me', { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Could not load your profile');
      setMe(json);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Could not load your profile');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const open = (p: Panel) => {
    setError(null);
    setForm({ name: me?.name ?? '', phone: me?.phone ?? '', current: '', next: '', confirm: '' });
    setPanel(p);
  };
  const close = () => !saving && setPanel(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (panel === 'password') {
      if (form.next.length < 8) return setError('New password must be at least 8 characters');
      if (form.next !== form.confirm) return setError('Passwords do not match');
    }
    setSaving(true);
    try {
      const res =
        panel === 'edit'
          ? await fetch('/api/users/me', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name: form.name, phone: form.phone }),
            })
          : await fetch('/api/users/me/password', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ currentPassword: form.current, newPassword: form.next }),
            });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Save failed');
      if (panel === 'edit') {
        setMe(json);
        await update({ name: json.name });
        setNotice({ tone: 'success', message: 'Profile updated.' });
      } else {
        setNotice({ tone: 'success', message: 'Password changed.' });
      }
      setPanel(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const access = MODULES.filter((m) => permissions[m.key]?.length || role === 'sysadmin');

  return (
    <div className="space-y-6">
      <PageHeader
        title="My profile"
        description="Your account details and what your role can do."
        actions={
          me && (
            <>
              <Btn size="sm" variant="outline" onClick={() => open('password')}>
                <KeyRound className="h-4 w-4" /> Change password
              </Btn>
              <Btn size="sm" onClick={() => open('edit')}>
                <Pencil className="h-4 w-4" /> Edit profile
              </Btn>
            </>
          )
        }
      />

      <Notice notice={notice} onClose={() => setNotice(null)} />

      {loading ? (
        <div className="h-48 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800" />
      ) : loadError || !me ? (
        <Card>
          <p className="text-theme-sm text-error-600 dark:text-error-400">{loadError ?? 'Profile not found'}</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card>
            <div className="flex flex-col items-center text-center">
              <Avatar name={me.name} image={me.image} size={80} />
              <h2 className="mt-4 text-lg font-semibold text-gray-800 dark:text-white/90">{me.name}</h2>
              <p className="text-theme-sm text-gray-500 dark:text-gray-400">{me.role}</p>
              <div className="mt-3">
                <StatusBadge tone={toneForStatus(me.status)}>{me.status ?? 'active'}</StatusBadge>
              </div>
            </div>
          </Card>

          <Card title="Account" className="lg:col-span-2">
            <DetailList
              items={[
                { label: 'Name', value: me.name },
                { label: 'Email', value: <span className="break-all">{me.email}</span> },
                { label: 'Phone', value: me.phone || '—' },
                { label: 'Role', value: me.role },
                { label: 'Last sign-in', value: fmtDate(me.last_login, true) },
                { label: 'Member since', value: fmtDate(me.created_at) },
              ]}
            />
          </Card>

          <Card title="What you can do" description="Set by your role. Ask an administrator to change it." className="lg:col-span-3">
            {access.length === 0 ? (
              <p className="text-theme-sm text-gray-500 dark:text-gray-400">Your role has no permissions yet.</p>
            ) : (
              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {access.map((m) => {
                  const acts = role === 'sysadmin' || permissions[m.key]?.includes('manage') ? ['manage' as const] : permissions[m.key] ?? [];
                  return (
                    <li key={m.key} className="rounded-xl border border-gray-100 px-4 py-3 dark:border-gray-800">
                      <p className="text-theme-sm font-medium text-gray-800 dark:text-white/90">{m.label}</p>
                      <p className="mt-0.5 text-theme-xs text-gray-500 dark:text-gray-400">
                        {acts.map((a) => (a === 'manage' ? 'Full access' : ACTION_LABELS[a])).join(', ')}
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>
      )}

      <SlideOver
        open={!!panel}
        onClose={close}
        busy={saving}
        title={panel === 'edit' ? 'Edit profile' : 'Change password'}
        description={panel === 'edit' ? 'Email and role are managed by an administrator.' : 'Enter your current password, then the new one.'}
        footer={
          <>
            <Btn variant="outline" onClick={close} disabled={saving}>
              Cancel
            </Btn>
            <Btn type="submit" form="my-profile-form" loading={saving}>
              {panel === 'edit' ? 'Save' : 'Change password'}
            </Btn>
          </>
        }
      >
        <form id="my-profile-form" onSubmit={submit}>
          <FormError message={error} />
          <FormGrid>
            {panel === 'edit' ? (
              <>
                <Field label="Full name" required>
                  <TextInput value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required maxLength={255} />
                </Field>
                <Field label="Phone">
                  <TextInput type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} maxLength={20} />
                </Field>
              </>
            ) : (
              <>
                <Field label="Current password" required>
                  <TextInput
                    type="password"
                    autoComplete="current-password"
                    value={form.current}
                    onChange={(e) => setForm({ ...form, current: e.target.value })}
                    required
                  />
                </Field>
                <Field label="New password" required span={1} hint="At least 8 characters.">
                  <TextInput
                    type="password"
                    autoComplete="new-password"
                    value={form.next}
                    onChange={(e) => setForm({ ...form, next: e.target.value })}
                    required
                    minLength={8}
                  />
                </Field>
                <Field label="Confirm new password" required span={1}>
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
      </SlideOver>
    </div>
  );
}
