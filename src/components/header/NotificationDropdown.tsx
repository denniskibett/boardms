"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Bell, CalendarDays, UserPlus, X } from "lucide-react";
import { Dropdown } from "../ui/dropdown/Dropdown";

type FeedItem = { id: string; kind: "meeting" | "user"; title: string; detail: string; at: string | null; href: string };

const SEEN_KEY = "boardms:notifications-seen";

function when(at: string | null, kind: FeedItem["kind"]) {
  if (!at) return "";
  const d = new Date(at);
  return kind === "meeting"
    ? d.toLocaleString("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

/** Header bell: upcoming meetings and accounts awaiting activation (real data, per permissions). */
export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [unseen, setUnseen] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/notifications", { cache: "no-store" });
      const json = res.ok ? await res.json() : { items: [] };
      const list: FeedItem[] = json.items ?? [];
      setItems(list);
      let seen = "";
      try {
        seen = localStorage.getItem(SEEN_KEY) ?? "";
      } catch {
        /* storage unavailable */
      }
      setUnseen(list.length > 0 && list.map((i) => i.id).join(",") !== seen);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggle = () => {
    setIsOpen((o) => !o);
    if (!isOpen) {
      setUnseen(false);
      try {
        localStorage.setItem(SEEN_KEY, items.map((i) => i.id).join(","));
      } catch {
        /* storage unavailable */
      }
    }
  };
  const close = () => setIsOpen(false);

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Notifications"
        className="dropdown-toggle relative flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
        onClick={toggle}
      >
        {unseen && (
          <span className="absolute right-0 top-0.5 z-10 flex h-2 w-2 rounded-full bg-orange-400">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75" />
          </span>
        )}
        <Bell className="h-5 w-5" />
      </button>

      <Dropdown
        isOpen={isOpen}
        onClose={close}
        className="absolute -right-[240px] mt-[17px] flex max-h-[480px] w-[calc(100vw-2rem)] max-w-[361px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark sm:w-[361px] lg:right-0"
      >
        <div className="mb-3 flex items-center justify-between border-b border-gray-100 pb-3 dark:border-gray-700">
          <h5 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Notifications</h5>
          <button type="button" onClick={close} aria-label="Close" className="dropdown-toggle text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            <X className="h-5 w-5" />
          </button>
        </div>

        <ul className="custom-scrollbar flex h-auto flex-col overflow-y-auto">
          {loading ? (
            <li className="px-4 py-6 text-center text-theme-sm text-gray-500 dark:text-gray-400">Loading…</li>
          ) : items.length === 0 ? (
            <li className="px-4 py-6 text-center text-theme-sm text-gray-500 dark:text-gray-400">You&apos;re all caught up.</li>
          ) : (
            items.map((n) => {
              const Icon = n.kind === "meeting" ? CalendarDays : UserPlus;
              return (
                <li key={n.id}>
                  <Link
                    href={n.href}
                    onClick={close}
                    className="flex gap-3 rounded-lg border-b border-gray-100 px-4 py-3 hover:bg-gray-100 dark:border-gray-800 dark:hover:bg-white/5"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                      <Icon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                    </span>
                    <span className="block min-w-0">
                      <span className="mb-1 block truncate text-theme-sm font-medium text-gray-800 dark:text-white/90">{n.title}</span>
                      <span className="flex items-center gap-2 text-theme-xs text-gray-500 dark:text-gray-400">
                        <span className="truncate">{n.detail}</span>
                        {n.at && <span className="h-1 w-1 shrink-0 rounded-full bg-gray-400" />}
                        <span className="shrink-0">{when(n.at, n.kind)}</span>
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })
          )}
        </ul>
        <Link
          href="/dashboard"
          onClick={close}
          className="mt-3 block rounded-lg border border-gray-300 bg-white px-4 py-2 text-center text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
        >
          Go to dashboard
        </Link>
      </Dropdown>
    </div>
  );
}
