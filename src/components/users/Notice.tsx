'use client';

/** Small inline banners used by the admin screens (users, roles, settings, profile). */

import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

export type NoticeState = { tone: 'success' | 'error'; message: string } | null;

/** Dismissible banner; success messages clear themselves after a few seconds. */
export default function Notice({ notice, onClose }: { notice: NoticeState; onClose: () => void }) {
  useEffect(() => {
    if (notice?.tone !== 'success') return;
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [notice, onClose]);

  if (!notice) return null;
  const ok = notice.tone === 'success';
  return (
    <div
      role={ok ? 'status' : 'alert'}
      className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-theme-sm ${
        ok
          ? 'border-success-200 bg-success-50 text-success-700 dark:border-success-500/30 dark:bg-success-500/15 dark:text-success-500'
          : 'border-error-200 bg-error-50 text-error-700 dark:border-error-500/30 dark:bg-error-500/15 dark:text-error-400'
      }`}
    >
      {ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />}
      <p className="flex-1">{notice.message}</p>
      <button type="button" onClick={onClose} aria-label="Dismiss" className="opacity-70 hover:opacity-100">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function FormError({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <div className="mb-4 rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-theme-sm text-error-600 dark:border-error-500/30 dark:bg-error-500/15 dark:text-error-400">
      {message}
    </div>
  );
}
