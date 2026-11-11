'use client';

/**
 * TailAdmin-style right-side slide-over panel. Use for every create/edit form.
 *
 *   <SlideOver open={open} onClose={close} title="New meeting" description="…"
 *     footer={<><Button variant="outline" onClick={close}>Cancel</Button>
 *              <Button type="submit" form="meeting-form">Save</Button></>}>
 *     <form id="meeting-form" onSubmit={…}>…</form>
 *   </SlideOver>
 */

import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export type SlideOverSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl';

const WIDTHS: Record<SlideOverSize, string> = {
  sm: 'sm:max-w-md',
  md: 'sm:max-w-lg',
  lg: 'sm:max-w-2xl',
  xl: 'sm:max-w-4xl',
  '2xl': 'sm:max-w-6xl',
};

export interface SlideOverProps {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Sticky footer, usually Cancel / Save buttons. */
  footer?: React.ReactNode;
  size?: SlideOverSize;
  /** Prevent closing on backdrop click / Esc (e.g. while saving). */
  busy?: boolean;
  children: React.ReactNode;
}

export default function SlideOver({
  open,
  onClose,
  title,
  description,
  footer,
  size = 'md',
  busy = false,
  children,
}: SlideOverProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    // Focus the first field for keyboard users.
    const t = setTimeout(() => {
      panelRef.current
        ?.querySelector<HTMLElement>('input:not([type=hidden]),select,textarea,button[data-autofocus]')
        ?.focus();
    }, 50);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
      clearTimeout(t);
    };
  }, [open, busy, onClose]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-99999 flex justify-end" role="dialog" aria-modal="true">
      <div
        className="absolute inset-0 bg-gray-900/40 backdrop-blur-[2px] animate-[fadeIn_.15s_ease-out]"
        onClick={() => !busy && onClose()}
      />
      <div
        ref={panelRef}
        className={`relative flex h-full w-full flex-col bg-white shadow-theme-xl dark:bg-gray-900 ${WIDTHS[size]} animate-[slideIn_.2s_ease-out]`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-200 px-6 py-5 dark:border-gray-800">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">{title}</h2>
            {description && <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label="Close"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700 disabled:opacity-50 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="custom-scrollbar flex-1 overflow-y-auto px-6 py-5">{children}</div>

        {footer && (
          <div className="flex items-center justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-800 dark:bg-gray-900">
            {footer}
          </div>
        )}
      </div>
      <style>{`
        @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>,
    document.body,
  );
}
