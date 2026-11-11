// src/components/agenda/AgendaList.tsx — every agenda item across meetings.
"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Btn, ConfirmDialog, DataTable, PageHeader, StatusBadge, toneForStatus, type Column } from "@/components/ui/kit";
import { usePermissions } from "@/hooks/usePermissions";
import AgendaSlideOver from "@/components/agenda/AgendaSlideOver";

interface AgendaRow {
  id: number | string;
  name: string;
  description?: string;
  status: string;
  sort_order: number;
  presenter_id?: number | null;
  presenter_name?: string | null;
  ministry_id?: number | null;
  ministry_name?: string | null;
  cabinet_approval_required: boolean;
  meeting_id: number | string;
  created_at?: string;
  meeting?: { id: number | string; name: string; type?: string; start_at?: string } | null;
}

const parse = (v?: string) => (v ? new Date(v.includes("T") ? v : v.replace(" ", "T")) : null);

export default function AgendaList() {
  const { can } = usePermissions();
  const [rows, setRows] = useState<AgendaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [editing, setEditing] = useState<AgendaRow | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [toDelete, setToDelete] = useState<AgendaRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/agenda");
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Failed to load agenda items");
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load agenda items");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    // /agenda?new=1 (and the old /agenda/create route) opens the create form.
    if (new URLSearchParams(window.location.search).get("new") === "1") {
      setEditing(null);
      setFormOpen(true);
      window.history.replaceState(null, "", "/agenda");
    }
  }, [load]);

  const statuses = useMemo(() => [...new Set(rows.map((r) => r.status).filter(Boolean))].sort(), [rows]);
  const visible = useMemo(() => rows.filter((r) => statusFilter === "all" || r.status === statusFilter), [rows, statusFilter]);

  const columns: Column<AgendaRow>[] = [
    {
      key: "name",
      header: "Agenda item",
      sortable: true,
      sortValue: (r) => r.name.toLowerCase(),
      cell: (r) => (
        <div className="min-w-[200px] max-w-md">
          <Link
            href={`/agenda/${r.id}`}
            onClick={(e) => e.stopPropagation()}
            className="font-medium text-gray-800 hover:text-brand-500 dark:text-white/90"
          >
            {r.name}
          </Link>
          {r.description && <p className="truncate text-theme-xs text-gray-500 dark:text-gray-400">{r.description}</p>}
        </div>
      ),
    },
    {
      key: "meeting",
      header: "Meeting",
      sortable: true,
      sortValue: (r) => parse(r.meeting?.start_at)?.getTime() ?? 0,
      cell: (r) =>
        r.meeting ? (
          <div className="min-w-[160px]">
            <Link
              href={`/meetings/${r.meeting.id}`}
              onClick={(e) => e.stopPropagation()}
              className="text-gray-800 hover:text-brand-500 dark:text-white/90"
            >
              {r.meeting.name}
            </Link>
            <div className="text-theme-xs text-gray-500 dark:text-gray-400">
              {parse(r.meeting.start_at)?.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
            </div>
          </div>
        ) : (
          "—"
        ),
    },
    { key: "presenter", header: "Presenter", cell: (r) => r.presenter_name || "—", hideBelow: "lg" },
    { key: "ministry", header: "Ministry", cell: (r) => r.ministry_name || "General", hideBelow: "xl" },
    {
      key: "cabinet",
      header: "Approval",
      cell: (r) =>
        r.cabinet_approval_required ? <StatusBadge tone="brand">Cabinet</StatusBadge> : <StatusBadge>Standard</StatusBadge>,
      hideBelow: "md",
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      sortValue: (r) => r.status,
      cell: (r) => <StatusBadge tone={toneForStatus(r.status)}>{r.status}</StatusBadge>,
    },
  ];

  const confirmDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/agenda/${toDelete.id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to delete agenda item");
      setRows((prev) => prev.filter((r) => r.id !== toDelete.id));
      setToDelete(null);
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : "Failed to delete agenda item");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agenda"
        description="Agenda items across all meetings."
        actions={
          can("agenda", "create") ? (
            <Btn
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              New agenda item
            </Btn>
          ) : null
        }
      />

      <DataTable
        rows={visible}
        columns={columns}
        rowKey={(r) => r.id}
        loading={loading}
        error={error}
        searchKeys={(r) => [r.name, r.description, r.presenter_name, r.ministry_name, r.meeting?.name]}
        searchPlaceholder="Search agenda items"
        initialSort={{ key: "meeting", dir: "desc" }}
        emptyTitle="No agenda items"
        emptyDescription={statusFilter !== "all" ? "Try clearing the status filter." : "Items added to meetings appear here."}
        onRowClick={(r) => {
          setEditing(r);
          setFormOpen(true);
        }}
        toolbar={
          <select
            aria-label="Filter by status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 rounded-lg border border-gray-300 bg-transparent px-3 text-theme-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
          >
            <option value="all">All statuses</option>
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        }
        actions={(r) => [
          { label: "View", href: `/agenda/${r.id}` },
          { label: "Open meeting", href: `/meetings/${r.meeting_id}` },
          {
            label: can("agenda", "edit") ? "Edit" : "Details",
            onClick: () => {
              setEditing(r);
              setFormOpen(true);
            },
          },
          {
            label: "Delete",
            danger: true,
            separator: true,
            hidden: !can("agenda", "delete"),
            onClick: () => {
              setDeleteError(null);
              setToDelete(r);
            },
          },
        ]}
      />

      <AgendaSlideOver
        agenda={editing}
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        onSave={() => load()}
      />

      <ConfirmDialog
        open={!!toDelete}
        title="Delete agenda item?"
        message={
          <>
            <span className="font-medium text-gray-700 dark:text-gray-300">{toDelete?.name}</span> will be removed from its
            meeting. This cannot be undone.
            {deleteError && <span className="mt-2 block text-error-500">{deleteError}</span>}
          </>
        }
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
