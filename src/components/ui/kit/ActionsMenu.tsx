'use client';

/**
 * Row "…" actions menu — replaces rows of icon buttons.
 *
 *   <ActionsMenu items={[
 *     { label: 'View', onClick: () => open(row) },
 *     { label: 'Edit', onClick: () => edit(row), hidden: !can('meetings', 'edit') },
 *     { label: 'Delete', onClick: () => remove(row), danger: true, hidden: !can('meetings', 'delete') },
 *   ]} />
 *
 * Items with `hidden: true` are dropped; if nothing is left the trigger is not rendered.
 */

import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { MoreHorizontal } from 'lucide-react';

export interface ActionItem {
  label: string;
  onClick?: () => void;
  href?: string;
  icon?: React.ReactNode;
  danger?: boolean;
  disabled?: boolean;
  hidden?: boolean;
  /** Draws a divider above this item. */
  separator?: boolean;
}

export default function ActionsMenu({
  items,
  label = 'Actions',
  align = 'end',
}: {
  items: ActionItem[];
  label?: string;
  align?: 'start' | 'end';
}) {
  const visible = items.filter((i) => !i.hidden);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const place = useCallback(() => {
    const b = btnRef.current?.getBoundingClientRect();
    const m = menuRef.current;
    if (!b) return;
    const w = m?.offsetWidth ?? 176;
    const h = m?.offsetHeight ?? 0;
    let left = align === 'end' ? b.right - w : b.left;
    left = Math.max(8, Math.min(left, window.innerWidth - w - 8));
    let top = b.bottom + 4;
    if (top + h > window.innerHeight - 8) top = Math.max(8, b.top - h - 4); // flip up
    setPos({ top, left });
  }, [align]);

  useLayoutEffect(() => {
    if (open) place();
  }, [open, place]);

  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => {
      if (menuRef.current?.contains(e.target as Node) || btnRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', onKey);
    window.addEventListener('scroll', place, true);
    window.addEventListener('resize', place);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', place, true);
      window.removeEventListener('resize', place);
    };
  }, [open, place]);

  if (visible.length === 0) return null;

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white"
      >
        <MoreHorizontal className="h-5 w-5" />
      </button>
      {open &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            style={{ top: pos.top, left: pos.left }}
            className="fixed z-999999 min-w-44 rounded-xl border border-gray-200 bg-white p-1.5 shadow-theme-lg dark:border-gray-800 dark:bg-gray-900"
            onClick={(e) => e.stopPropagation()}
          >
            {visible.map((item, i) => {
              const cls = `flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-theme-sm font-medium disabled:cursor-not-allowed disabled:opacity-50 ${
                item.danger
                  ? 'text-error-600 hover:bg-error-50 dark:text-error-400 dark:hover:bg-error-500/10'
                  : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5'
              }`;
              const content = (
                <>
                  {item.icon && <span className="h-4 w-4 shrink-0 [&>svg]:h-4 [&>svg]:w-4">{item.icon}</span>}
                  {item.label}
                </>
              );
              return (
                <React.Fragment key={item.label + i}>
                  {item.separator && i > 0 && <div className="my-1 h-px bg-gray-100 dark:bg-gray-800" />}
                  {item.href ? (
                    <a role="menuitem" href={item.href} className={cls} onClick={() => setOpen(false)}>
                      {content}
                    </a>
                  ) : (
                    <button
                      role="menuitem"
                      type="button"
                      disabled={item.disabled}
                      className={cls}
                      onClick={() => {
                        setOpen(false);
                        item.onClick?.();
                      }}
                    >
                      {content}
                    </button>
                  )}
                </React.Fragment>
              );
            })}
          </div>,
          document.body,
        )}
    </>
  );
}
