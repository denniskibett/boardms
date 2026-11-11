// src/components/meetings/UpcomingMeetings.tsx
// Card list of meetings grouped by month (used on the meetings page and the dashboard).
"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, Clock, MapPin, Users } from "lucide-react";
import { ActionsMenu, StatusBadge, toneForStatus } from "@/components/ui/kit";
import { usePermissions } from "@/hooks/usePermissions";

interface Meeting {
  id: string | number;
  name: string;
  type: string;
  start_at: string;
  location: string;
  chair_id?: string | number | null;
  status: string;
  description?: string;
  colour?: string;
  attendees_count?: number;
}

interface UpcomingMeetingsProps {
  meetings?: Meeting[];
  pastMeetings?: Meeting[];
  allMeetings?: Meeting[];
  loading?: boolean;
  onEdit?: (meeting: Meeting) => void;
  onRefresh?: () => void;
  settings?: { timezone?: string; date_format?: string; time_format?: string };
  /** Only show meetings whose type contains one of these words, e.g. ['cabinet', 'committee']. */
  meetingTypes?: string[];
  /** Kept for backwards compatibility; access is decided by RBAC. */
  userRole?: string;
}

type Filter = "upcoming" | "past" | "all";

const parse = (v: string) => new Date(v.includes("T") ? v : v.replace(" ", "T"));

export default function UpcomingMeetings({
  meetings: propMeetings,
  allMeetings: propAllMeetings,
  loading: externalLoading = false,
  onEdit,
  settings,
  meetingTypes,
}: UpcomingMeetingsProps) {
  const { can, loading: permsLoading } = usePermissions();
  const [internal, setInternal] = useState<Meeting[]>([]);
  const [internalLoading, setInternalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("upcoming");

  const external = !!(propAllMeetings || propMeetings);
  const canView = can("meetings", "view");

  useEffect(() => {
    if (external || !canView) return;
    let alive = true;
    setInternalLoading(true);
    fetch("/api/meetings")
      .then(async (r) => {
        const data = await r.json().catch(() => null);
        if (!r.ok) throw new Error(data?.error || "Failed to load meetings");
        if (alive) setInternal(Array.isArray(data) ? data : []);
      })
      .catch((e) => alive && setError(e instanceof Error ? e.message : "Failed to load meetings"))
      .finally(() => alive && setInternalLoading(false));
    return () => {
      alive = false;
    };
  }, [external, canView]);

  const meetings = useMemo(() => {
    const source = propAllMeetings || propMeetings || internal;
    if (!meetingTypes?.length) return source;
    const allowed = meetingTypes.map((t) => t.toLowerCase());
    return source.filter((m) => allowed.some((t) => (m.type || "").toLowerCase().includes(t)));
  }, [propAllMeetings, propMeetings, internal, meetingTypes]);

  const now = new Date();
  const counts = useMemo(() => {
    const today = new Date().toDateString();
    return {
      upcoming: meetings.filter((m) => parse(m.start_at) >= new Date()).length,
      today: meetings.filter((m) => parse(m.start_at).toDateString() === today).length,
      total: meetings.length,
    };
  }, [meetings]);

  const grouped = useMemo(() => {
    const t = Date.now();
    const list = meetings
      .filter((m) => {
        const time = parse(m.start_at).getTime();
        return filter === "all" ? true : filter === "upcoming" ? time >= t : time < t;
      })
      .sort((a, b) => {
        const d = parse(a.start_at).getTime() - parse(b.start_at).getTime();
        return filter === "past" ? -d : d;
      });
    const groups = new Map<string, Meeting[]>();
    for (const m of list) {
      const key = parse(m.start_at).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
      groups.set(key, [...(groups.get(key) || []), m]);
    }
    return [...groups.entries()];
  }, [meetings, filter]);

  if (!permsLoading && !canView) return null;

  const loading = externalLoading || internalLoading || permsLoading;
  const hour12 = settings?.time_format === "12";

  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex flex-col gap-4 border-b border-gray-200 px-5 py-4 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Meetings</h3>
          <p className="mt-0.5 text-theme-sm text-gray-500 dark:text-gray-400">
            {counts.upcoming} upcoming · {counts.today} today · {counts.total} total
          </p>
        </div>
        <div className="inline-flex w-full rounded-lg bg-gray-100 p-0.5 dark:bg-gray-900 sm:w-auto">
          {(["upcoming", "past", "all"] as Filter[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`flex-1 rounded-md px-3 py-2 text-theme-sm font-medium capitalize sm:flex-none ${
                filter === f
                  ? "bg-white text-gray-900 shadow-theme-xs dark:bg-gray-800 dark:text-white"
                  : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="custom-scrollbar max-h-[640px] overflow-y-auto p-5">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-20 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
            ))}
          </div>
        ) : error ? (
          <p className="py-10 text-center text-theme-sm text-error-500">{error}</p>
        ) : grouped.length === 0 ? (
          <div className="py-12 text-center">
            <CalendarDays className="mx-auto mb-3 h-10 w-10 text-gray-300 dark:text-gray-600" />
            <p className="font-medium text-gray-800 dark:text-white/90">No {filter === "all" ? "" : filter} meetings</p>
            <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">Scheduled meetings will appear here.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {grouped.map(([month, items]) => (
              <section key={month}>
                <h4 className="mb-3 text-theme-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  {month}
                </h4>
                <ul className="space-y-3">
                  {items.map((m) => {
                    const d = parse(m.start_at);
                    const isToday = d.toDateString() === now.toDateString();
                    return (
                      <li
                        key={m.id}
                        className="relative flex gap-4 rounded-xl border border-gray-200 p-4 transition hover:border-brand-300 hover:shadow-theme-sm dark:border-gray-800 dark:hover:border-brand-500/40"
                      >
                        <span
                          className="absolute inset-y-3 left-0 w-1 rounded-r"
                          style={{ backgroundColor: m.colour || "#3b82f6" }}
                        />
                        <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-lg bg-gray-50 dark:bg-gray-900">
                          <span className="text-lg font-semibold leading-none text-gray-800 dark:text-white/90">{d.getDate()}</span>
                          <span className="mt-1 text-theme-xs uppercase text-gray-500 dark:text-gray-400">
                            {d.toLocaleDateString("en-GB", { month: "short" })}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <Link
                              href={`/meetings/${m.id}`}
                              className="min-w-0 truncate font-medium text-gray-800 after:absolute after:inset-0 hover:text-brand-500 dark:text-white/90"
                            >
                              {m.name}
                            </Link>
                            <div className="relative z-10 flex shrink-0 items-center gap-2">
                              {isToday ? (
                                <StatusBadge tone="success">Today</StatusBadge>
                              ) : (
                                <StatusBadge tone={toneForStatus(m.status)}>{m.status}</StatusBadge>
                              )}
                              {onEdit && can("meetings", "edit") && (
                                <ActionsMenu
                                  items={[
                                    { label: "Open", href: `/meetings/${m.id}` },
                                    { label: "Edit", onClick: () => onEdit(m) },
                                  ]}
                                />
                              )}
                            </div>
                          </div>
                          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-theme-sm text-gray-500 dark:text-gray-400">
                            <span className="inline-flex items-center gap-1.5">
                              <Clock className="h-4 w-4" />
                              {d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12 })}
                            </span>
                            {m.location && (
                              <span className="inline-flex min-w-0 items-center gap-1.5">
                                <MapPin className="h-4 w-4 shrink-0" />
                                <span className="truncate">{m.location}</span>
                              </span>
                            )}
                            {!!m.attendees_count && (
                              <span className="inline-flex items-center gap-1.5">
                                <Users className="h-4 w-4" />
                                {m.attendees_count}
                              </span>
                            )}
                            <span className="text-theme-xs">{m.type}</span>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
