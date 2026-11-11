// src/components/meetings/MeetingTable.tsx
"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DataTable, ConfirmDialog, StatusBadge, toneForStatus, type Column } from "@/components/ui/kit";
import { usePermissions } from "@/hooks/usePermissions";

export interface MeetingRow {
  id: string | number;
  name: string;
  type: string;
  start_at: string;
  location: string;
  chair_id?: string | number | null;
  chair_name?: string | null;
  status: string;
  description?: string;
  colour?: string;
  period?: number | string;
  attendees_count?: number;
}

interface MeetingTableProps {
  meetings?: MeetingRow[];
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  onEdit?: (meeting: MeetingRow) => void;
  /** Card title; defaults to "Meetings". */
  title?: React.ReactNode;
  /** Extra toolbar content, e.g. the "Schedule meeting" button. */
  toolbar?: React.ReactNode;
}

const filterCls =
  "h-10 rounded-lg border border-gray-300 bg-transparent px-3 text-theme-sm text-gray-700 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300";

function formatWhen(value: string) {
  const d = new Date(value.replace(" ", "T"));
  if (Number.isNaN(d.getTime())) return { date: value, time: "" };
  return {
    date: d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
    time: d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
  };
}

export default function MeetingTable({
  meetings = [],
  loading = false,
  error,
  onRefresh,
  onEdit,
  title = "Meetings",
  toolbar,
}: MeetingTableProps) {
  const router = useRouter();
  const { can } = usePermissions();
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [toDelete, setToDelete] = useState<MeetingRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [hidden, setHidden] = useState<Set<string>>(new Set());

  const types = useMemo(() => [...new Set(meetings.map((m) => m.type).filter(Boolean))].sort(), [meetings]);
  const statuses = useMemo(() => [...new Set(meetings.map((m) => m.status).filter(Boolean))].sort(), [meetings]);

  const rows = useMemo(
    () =>
      meetings.filter(
        (m) =>
          !hidden.has(String(m.id)) &&
          (statusFilter === "all" || m.status === statusFilter) &&
          (typeFilter === "all" || m.type === typeFilter),
      ),
    [meetings, hidden, statusFilter, typeFilter],
  );

  const columns: Column<MeetingRow>[] = [
    {
      key: "name",
      header: "Meeting",
      sortable: true,
      sortValue: (m) => m.name?.toLowerCase(),
      cell: (m) => (
        <div className="flex min-w-[180px] items-center gap-3">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: m.colour || "#3b82f6" }} />
          <div className="min-w-0">
            <Link
              href={`/meetings/${m.id}`}
              onClick={(e) => e.stopPropagation()}
              className="block truncate font-medium text-gray-800 hover:text-brand-500 dark:text-white/90"
            >
              {m.name}
            </Link>
            {m.description && (
              <p className="max-w-xs truncate text-theme-xs text-gray-500 dark:text-gray-400">{m.description}</p>
            )}
          </div>
        </div>
      ),
    },
    { key: "type", header: "Type", sortable: true, sortValue: (m) => m.type, cell: (m) => m.type, hideBelow: "md" },
    {
      key: "start_at",
      header: "Date",
      sortable: true,
      sortValue: (m) => new Date(m.start_at.replace(" ", "T")).getTime(),
      cell: (m) => {
        const w = formatWhen(m.start_at);
        return (
          <div className="whitespace-nowrap">
            <div className="text-gray-800 dark:text-white/90">{w.date}</div>
            <div className="text-theme-xs text-gray-500 dark:text-gray-400">{w.time}</div>
          </div>
        );
      },
    },
    { key: "location", header: "Location", sortable: true, sortValue: (m) => m.location, cell: (m) => m.location, hideBelow: "lg" },
    { key: "chair", header: "Chair", cell: (m) => m.chair_name || "—", hideBelow: "xl" },
    {
      key: "status",
      header: "Status",
      sortable: true,
      sortValue: (m) => m.status,
      cell: (m) => <StatusBadge tone={toneForStatus(m.status)}>{m.status || "—"}</StatusBadge>,
    },
  ];

  const confirmDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/meetings/${toDelete.id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to delete meeting");
      setHidden((prev) => new Set(prev).add(String(toDelete.id)));
      setToDelete(null);
      onRefresh?.();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Failed to delete meeting");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <DataTable
        title={title}
        rows={rows}
        columns={columns}
        rowKey={(m) => m.id}
        loading={loading && meetings.length === 0}
        error={error}
        searchKeys={(m) => [m.name, m.location, m.type, m.chair_name, m.description]}
        searchPlaceholder="Search meetings"
        initialSort={{ key: "start_at", dir: "desc" }}
        emptyTitle="No meetings found"
        emptyDescription={
          statusFilter !== "all" || typeFilter !== "all" ? "Try clearing the filters." : "Scheduled meetings will appear here."
        }
        onRowClick={(m) => router.push(`/meetings/${m.id}`)}
        toolbar={
          <>
            <select
              aria-label="Filter by type"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className={filterCls}
            >
              <option value="all">All types</option>
              {types.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <select
              aria-label="Filter by status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={filterCls}
            >
              <option value="all">All statuses</option>
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            {toolbar}
          </>
        }
        actions={(m) => [
          { label: "Open", href: `/meetings/${m.id}` },
          { label: "Edit", onClick: () => onEdit?.(m), hidden: !onEdit || !can("meetings", "edit") },
          {
            label: "Delete",
            danger: true,
            separator: true,
            onClick: () => {
              setDeleteError(null);
              setToDelete(m);
            },
            hidden: !can("meetings", "delete"),
          },
        ]}
      />

      <ConfirmDialog
        open={!!toDelete}
        title="Delete meeting?"
        message={
          <>
            <span className="font-medium text-gray-700 dark:text-gray-300">{toDelete?.name}</span> and its participants
            will be removed. This cannot be undone.
            {deleteError && <span className="mt-2 block text-error-500">{deleteError}</span>}
          </>
        }
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </>
  );
}
