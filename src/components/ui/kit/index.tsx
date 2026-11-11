'use client';

/**
 * Shared boardms UI kit (TailAdmin style). Import everything from '@/components/ui/kit'.
 */

import React from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle } from 'lucide-react';
import { Btn } from './form';
import { TONES, type Tone } from './status';

export { default as SlideOver } from './SlideOver';
export type { SlideOverProps } from './SlideOver';
export { default as ActionsMenu } from './ActionsMenu';
export type { ActionItem } from './ActionsMenu';
export { default as DataTable } from './DataTable';
export type { Column, DataTableProps } from './DataTable';
export { FormGrid, FormSection, Field, TextInput, TextArea, SelectInput, Checkbox, Btn } from './form';
export type { Option } from './form';

/** Page title row: breadcrumb-less heading, description, and right-aligned actions. */
export function PageHeader({
  title,
  description,
  actions,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-title-sm font-semibold text-gray-800 dark:text-white/90">{title}</h1>
        {description && <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
    </div>
  );
}

/** Card container. */
export function Card({
  title,
  description,
  actions,
  children,
  className = '',
  padded = true,
}: {
  title?: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <div className={`rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] ${className}`}>
      {(title || actions) && (
        <div className="flex items-center justify-between gap-3 border-b border-gray-200 px-5 py-4 dark:border-gray-800">
          <div>
            {title && <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">{title}</h3>}
            {description && <p className="mt-0.5 text-theme-sm text-gray-500 dark:text-gray-400">{description}</p>}
          </div>
          {actions}
        </div>
      )}
      <div className={padded ? 'p-5' : ''}>{children}</div>
    </div>
  );
}

export { TONES, toneForStatus } from './status';
export type { Tone } from './status';

export function StatusBadge({ tone = 'gray', children }: { tone?: Tone; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-theme-xs font-medium ${TONES[tone]}`}>
      {children}
    </span>
  );
}

/** Confirm dialog for destructive actions. */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Delete',
  danger = true,
  busy,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message?: React.ReactNode;
  confirmLabel?: string;
  danger?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open || typeof document === 'undefined') return null;
  return createPortal(
    <div className="fixed inset-0 z-999999 flex items-center justify-center p-4" role="alertdialog" aria-modal="true">
      <div className="absolute inset-0 bg-gray-900/40" onClick={() => !busy && onCancel()} />
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-theme-xl dark:bg-gray-900">
        <div className="flex gap-4">
          {danger && (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-error-50 dark:bg-error-500/15">
              <AlertTriangle className="h-5 w-5 text-error-500" />
            </div>
          )}
          <div>
            <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">{title}</h3>
            {message && <div className="mt-1.5 text-theme-sm text-gray-500 dark:text-gray-400">{message}</div>}
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Btn variant="outline" size="sm" onClick={onCancel} disabled={busy}>
            Cancel
          </Btn>
          <Btn variant={danger ? 'danger' : 'primary'} size="sm" onClick={onConfirm} loading={busy} data-autofocus>
            {confirmLabel}
          </Btn>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/** Small read-only key/value list for detail slide-overs. */
export function DetailList({ items }: { items: { label: string; value: React.ReactNode }[] }) {
  return (
    <dl className="divide-y divide-gray-100 dark:divide-gray-800">
      {items.map((i) => (
        <div key={i.label} className="grid grid-cols-3 gap-4 py-3">
          <dt className="text-theme-sm text-gray-500 dark:text-gray-400">{i.label}</dt>
          <dd className="col-span-2 text-theme-sm text-gray-800 dark:text-white/90">{i.value ?? '—'}</dd>
        </div>
      ))}
    </dl>
  );
}
