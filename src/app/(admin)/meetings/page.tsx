// src/app/(admin)/meetings/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, LayoutList, Plus, RefreshCw, Table } from "lucide-react";
import { useMeetingsData } from "@/hooks/useMeetingsData";
import { usePermissions } from "@/hooks/usePermissions";
import { PageHeader, Btn } from "@/components/ui/kit";
import MeetingCalendar from "@/components/meetings/MeetingCalendar";
import UpcomingMeetings from "@/components/meetings/UpcomingMeetings";
import MeetingTable from "@/components/meetings/MeetingTable";
import MeetingFormModal from "@/components/meetings/MeetingFormModal";

type ViewMode = "calendar" | "table" | "list";

const VIEWS: { key: ViewMode; label: string; icon: React.ReactNode }[] = [
  { key: "calendar", label: "Calendar", icon: <Calendar className="h-4 w-4" /> },
  { key: "table", label: "Table", icon: <Table className="h-4 w-4" /> },
  { key: "list", label: "List", icon: <LayoutList className="h-4 w-4" /> },
];

export default function MeetingsPage() {
  const router = useRouter();
  const { can } = usePermissions();
  const [viewMode, setViewMode] = useState<ViewMode>("calendar");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [initialDate, setInitialDate] = useState<string | undefined>();

  const { meetings, calendarEvents, stats, categories, users, settings, loading, error, refreshAll } = useMeetingsData();

  const canCreate = can("meetings", "create");
  const canEdit = can("meetings", "edit");

  // /meetings?new=1 (and the old /meetings/schedule route) opens the schedule form.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("new") === "1" && canCreate) {
      setEditing(null);
      setInitialDate(undefined);
      setFormOpen(true);
      router.replace("/meetings");
    }
    const view = params.get("view");
    if (view === "table" || view === "list" || view === "calendar") setViewMode(view);
  }, [canCreate, router]);

  const openCreate = (date?: string) => {
    if (!canCreate) return;
    setEditing(null);
    setInitialDate(date);
    setFormOpen(true);
  };

  const openEdit = (meeting: any) => {
    setEditing(meeting);
    setInitialDate(undefined);
    setFormOpen(true);
  };

  const onCalendarEventClick = ({ id }: { id: string }) => {
    const meeting = meetings.find((m) => String(m.id) === String(id));
    if (meeting && canEdit) openEdit(meeting);
    else router.push(`/meetings/${id}`);
  };

  const scheduleButton = canCreate ? (
    <Btn onClick={() => openCreate()}>
      <Plus className="h-4 w-4" />
      Schedule meeting
    </Btn>
  ) : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Meetings"
        description={`${stats.today} today · ${stats.thisWeek} this week · ${stats.thisMonth} this month · ${stats.total} total`}
        actions={
          <>
            <div className="inline-flex rounded-lg bg-gray-100 p-0.5 dark:bg-gray-900" role="tablist">
              {VIEWS.map((v) => (
                <button
                  key={v.key}
                  type="button"
                  role="tab"
                  aria-selected={viewMode === v.key}
                  onClick={() => setViewMode(v.key)}
                  className={`inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-theme-sm font-medium ${
                    viewMode === v.key
                      ? "bg-white text-gray-900 shadow-theme-xs dark:bg-gray-800 dark:text-white"
                      : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                  }`}
                >
                  {v.icon}
                  {v.label}
                </button>
              ))}
            </div>
            <Btn variant="outline" onClick={refreshAll} disabled={loading} aria-label="Refresh">
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Btn>
            {scheduleButton}
          </>
        }
      />

      {viewMode === "calendar" && (
        <>
          {error && (
            <div className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-theme-sm text-error-600 dark:border-error-500/30 dark:bg-error-500/15 dark:text-error-400">
              {error}
            </div>
          )}
          <MeetingCalendar
            events={calendarEvents}
            loading={loading}
            settings={settings}
            onDateSelect={canCreate ? (date) => openCreate(date) : undefined}
            onEventClick={onCalendarEventClick}
          />
        </>
      )}

      {viewMode === "table" && (
        <MeetingTable
          meetings={meetings as any}
          loading={loading}
          error={error}
          onEdit={canEdit ? openEdit : undefined}
          onRefresh={refreshAll}
        />
      )}

      {viewMode === "list" && (
        <UpcomingMeetings
          allMeetings={meetings as any}
          loading={loading}
          settings={settings}
          onEdit={canEdit ? openEdit : undefined}
          onRefresh={refreshAll}
        />
      )}

      <MeetingFormModal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        selectedEvent={editing}
        initialDate={initialDate}
        onSuccess={() => refreshAll()}
        cachedData={{
          locations: categories.locations,
          meetingTypes: categories.meetingTypes,
          meetingStatuses: categories.meetingStatuses,
          colours: categories.colours,
          users,
          settings,
        }}
      />
    </div>
  );
}
