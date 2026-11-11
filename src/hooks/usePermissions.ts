'use client';
// src/hooks/usePermissions.ts — client-side RBAC for showing/hiding UI.
// The server enforces the same rules (lib/auth/permissions.ts); this hook only decides what to render.

import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  ACTION_LABELS,
  MODULES,
  can as canFor,
  normalizeRoleKey,
  type Action,
  type ModuleKey,
  type Permissions,
} from '@/lib/rbac';

type Me = { role: string | null; permissions: Permissions };

// One fetch per page load, shared by every component using the hook.
let cached: { key: string; promise: Promise<Me> } | null = null;
const listeners = new Set<() => void>();

function loadMe(key: string): Promise<Me> {
  if (cached?.key === key) return cached.promise;
  const promise = fetch('/api/me/permissions', { cache: 'no-store' })
    .then((r) => (r.ok ? r.json() : { role: null, permissions: {} }))
    .catch(() => ({ role: null, permissions: {} }));
  cached = { key, promise };
  return promise;
}

/** Call after editing roles so open screens pick up the change. */
export function refreshPermissions() {
  cached = null;
  listeners.forEach((l) => l());
}

export function usePermissions() {
  const { data: session, status } = useSession();
  const sessionRole = normalizeRoleKey((session?.user as { role?: string } | undefined)?.role);
  const key = `${session?.user?.email ?? ''}|${sessionRole ?? ''}`;
  const [me, setMe] = useState<Me | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const l = () => setTick((t) => t + 1);
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);

  useEffect(() => {
    if (status !== 'authenticated') {
      setMe(null);
      return;
    }
    let alive = true;
    loadMe(key).then((m) => alive && setMe(m));
    return () => {
      alive = false;
    };
  }, [key, status, tick]);

  const role = me?.role ?? sessionRole;
  const loading = status === 'loading' || (status === 'authenticated' && !me);

  const can = useCallback(
    (module: ModuleKey, action: Action = 'view') => !!me && canFor(role, me.permissions, module, action),
    [me, role],
  );

  /** Legacy "module_action" ids, e.g. "memos_create". */
  const hasPermission = useCallback(
    (id: string) => {
      const i = id.lastIndexOf('_');
      const mod = id.slice(0, i) as ModuleKey;
      const raw = id.slice(i + 1);
      const action = (raw === 'read' ? 'view' : raw === 'update' ? 'edit' : raw) as Action;
      return can(mod, action);
    },
    [can],
  );

  return {
    role,
    permissions: me?.permissions ?? {},
    loading,
    can,
    canAccessModule: (m: ModuleKey) => can(m, 'view'),
    hasPermission,
    hasAnyPermission: (ids: string[]) => ids.some(hasPermission),
    hasAllPermissions: (ids: string[]) => ids.every(hasPermission),
    isSuperAdmin: role === 'sysadmin',
  };
}

export const moduleLabels: Record<string, string> = Object.fromEntries(MODULES.map((m) => [m.key, m.label]));
export const permissionLabels: Record<string, string> = ACTION_LABELS;
export default usePermissions;
