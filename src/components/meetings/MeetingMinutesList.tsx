// src/components/meetings/MeetingMinutesList.tsx
// Minutes are derived from held (past) meetings and the decisions recorded on their agenda items.
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DataTable, StatusBadge, toneForStatus, type Column } from "@/components/ui/kit";
import { usePermissions } from "@/hooks/usePermissions";

interface MeetingRow {
  id: number | string;
  name: string;
  type: string;
  start_at: string;
  status: string;
  location?: string;
  chair_name?: string | null;
  attendees_count?: number;
}

const parse = (v: string) => new Date(v.includes("T") ? v : v.replace(" ", "T"));

export default function MeetingMinutesList() {
  const router = useRouter();
  const { can, loading: permsLoading } = usePermissions();
  const [meetings, setMeetings] = useState<MeetingRow[]>([]);
  const [decisionCounts, setDecisionCounts] = useState<Record<string, number> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState("all");

  const canSeeDecisions = can("decisions", "view");

  useEffect(() => {
    if (permsLoading) return;
    let alive = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/meetings");
        const data = await res.json().catch(() => null);
        if (!res.ok) throw new Error(data?.error || "Failed to load meetings");
        const now = Date.now();
        if (alive) setMeetings((Array.isArray(data) ? data : []).filter((m: MeetingRow) => parse(m.start_at).getTime() < now));

        if (canSeeDecisions) {
          const dr = await fetch("/api/decisions");
          const decisions = dr.ok ? await dr.json().catch(() => []) : [];
          const counts: Record<string, number> = {};
          for (const d of Array.isArray(decisions) ? decisions : []) {
            if (d.meeting_id != null) counts[String(d.meeting_id)] = (counts[String(d.meeting_id)] || 0) + 1;
          }
          if (alive) setDecisionCounts(counts);
        }
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : "Failed to load minutes");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [permsLoading, canSeeDecisions]);

  const types = useMemo(() => [...new Set(meetings.map((m) => m.type).filter(Boolean))].sort(), [meetings]);
  const rows = useMemo(() => meetings.filter((m) => typeFilter === "all" || m.type === typeFilter), [meetings, typeFilter]);

  const columns: Column<MeetingRow>[] = [
    {
      key: "name",
      header: "Meeting",
      sortable: true,
      sortValue: (m) => m.name.toLowerCase(),
      cell: (m) => (
        <div className="min-w-[180px]">
          <div className="font-medium text-gray-800 dark:text-white/90">{m.name}</div>
          {m.chair_name && <div className="text-theme-xs text-gray-500 dark:text-gray-400">Chair: {m.chair_name}</div>}
        </div>
      ),
    },
    { key: "type", header: "Type", sortable: true, sortValue: (m) => m.type, cell: (m) => m.type, hideBelow: "md" },
    {
      key: "date",
      header: "Date",
      sortable: true,
      sortValue: (m) => parse(m.start_at).getTime(),
      cell: (m) => (
        <span className="whitespace-nowrap">
          {parse(m.start_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (m) => <StatusBadge tone={toneForStatus(m.status)}>{m.status || "—"}</StatusBadge>,
    },
    {
      key: "attendees",
      header: "Participants",
      sortable: true,
      sortValue: (m) => m.attendees_count ?? 0,
      cell: (m) => m.attendees_count ?? 0,
      hideBelow: "lg",
    },
    ...(decisionCounts
      ? [
          {
            key: "decisions",
            header: "Decisions",
            sortable: true,
            sortValue: (m: MeetingRow) => decisionCounts[String(m.id)] ?? 0,
            cell: (m: MeetingRow) => decisionCounts[String(m.id)] ?? 0,
            hideBelow: "sm" as const,
          },
        ]
      : []),
  ];

  return (
    <DataTable
      title="Held meetings"
      description="Agenda, participants and decisions recorded for each meeting."
      rows={rows}
      columns={columns}
      rowKey={(m) => m.id}
      loading={loading || permsLoading}
      error={error}
      searchKeys={(m) => [m.name, m.type, m.chair_name, m.location]}
      searchPlaceholder="Search meetings"
      initialSort={{ key: "date", dir: "desc" }}
      emptyTitle="No held meetings yet"
      emptyDescription="Minutes appear here once a meeting date has passed."
      onRowClick={(m) => router.push(`/meetings/minutes/${m.id}`)}
      toolbar={
        <select
          aria-label="Filter by type"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="h-10 rounded-lg border border-gray-300 bg-transparent px-3 text-theme-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
        >
          <option value="all">All types</option>
          {types.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      }
      actions={(m) => [
        { label: "View minutes", href: `/meetings/minutes/${m.id}` },
        { label: "Open meeting", href: `/meetings/${m.id}` },
      ]}
    />
  );
}
