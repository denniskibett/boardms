// src/components/meetings/MeetingMinutesDetail.tsx
// Minutes view for a held meeting: details, participants, agenda items and the decisions recorded on them.
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, FileText, Loader2 } from "lucide-react";
import { Card, DetailList, PageHeader, StatusBadge, toneForStatus } from "@/components/ui/kit";
import { usePermissions } from "@/hooks/usePermissions";

interface MeetingMinutesDetailProps {
  /** The meeting id. */
  minuteId: string;
}

interface Decision {
  id: number | string;
  agenda_id?: number | string | null;
  title?: string | null;
  name?: string | null;
  decision?: string | null;
  description?: string | null;
  status?: string | null;
  meeting_id?: number | string | null;
}

const parse = (v?: string) => (v ? new Date(v.includes("T") ? v : v.replace(" ", "T")) : null);

export default function MeetingMinutesDetail({ minuteId }: MeetingMinutesDetailProps) {
  const { can, loading: permsLoading } = usePermissions();
  const [meeting, setMeeting] = useState<any>(null);
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const canSeeDecisions = can("decisions", "view");

  useEffect(() => {
    if (permsLoading) return;
    let alive = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/meetings/${minuteId}`);
        const data = await res.json().catch(() => null);
        if (!res.ok) throw new Error(data?.error || "Failed to load meeting");
        if (alive) setMeeting(data);
        if (canSeeDecisions) {
          const dr = await fetch("/api/decisions");
          const all = dr.ok ? await dr.json().catch(() => []) : [];
          if (alive)
            setDecisions((Array.isArray(all) ? all : []).filter((d: Decision) => String(d.meeting_id) === String(minuteId)));
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
  }, [minuteId, permsLoading, canSeeDecisions]);

  const back = (
    <Link
      href="/meetings/minutes"
      className="inline-flex items-center gap-1.5 text-theme-sm text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white"
    >
      <ArrowLeft className="h-4 w-4" />
      All minutes
    </Link>
  );

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-theme-sm text-gray-500">
        <Loader2 className="mr-2 h-5 w-5 animate-spin text-brand-500" />
        Loading minutes…
      </div>
    );
  }

  if (error || !meeting) {
    return (
      <div className="space-y-4">
        {back}
        <Card>
          <p className="text-theme-sm text-error-500">{error || "Meeting not found"}</p>
        </Card>
      </div>
    );
  }

  const start = parse(meeting.start_at);
  const agenda: any[] = meeting.agenda || [];
  const participants: any[] = meeting.participants || [];

  return (
    <div className="space-y-6">
      {back}
      <PageHeader
        title={meeting.name}
        description={`${meeting.type} · ${start ? start.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : ""}`}
        actions={
          <Link
            href={`/meetings/${meeting.id}`}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
          >
            Open meeting
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-1">
          <Card title="Meeting details">
            <DetailList
              items={[
                { label: "Status", value: <StatusBadge tone={toneForStatus(meeting.status)}>{meeting.status}</StatusBadge> },
                { label: "Time", value: start?.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) },
                { label: "Location", value: meeting.location },
                { label: "Chair", value: meeting.chair_name },
                { label: "Approved by", value: meeting.approved_by_name },
              ]}
            />
          </Card>
          <Card title={`Participants (${participants.length})`}>
            {participants.length === 0 ? (
              <p className="text-theme-sm text-gray-500 dark:text-gray-400">No participants recorded.</p>
            ) : (
              <ul className="space-y-2">
                {participants.map((p) => (
                  <li key={p.auth_id || p.id} className="text-theme-sm">
                    <span className="text-gray-800 dark:text-white/90">{p.name}</span>
                    {p.role && <span className="text-gray-500 dark:text-gray-400"> · {p.role}</span>}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card title={`Agenda and decisions (${agenda.length})`}>
            {agenda.length === 0 ? (
              <p className="text-theme-sm text-gray-500 dark:text-gray-400">No agenda items were recorded for this meeting.</p>
            ) : (
              <ol className="divide-y divide-gray-100 dark:divide-gray-800">
                {agenda.map((item, i) => {
                  const itemDecisions = decisions.filter((d) => String(d.agenda_id) === String(item.id));
                  return (
                    <li key={item.id} className="py-4 first:pt-0 last:pb-0">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <h4 className="font-medium text-gray-800 dark:text-white/90">
                          {i + 1}. {item.name}
                        </h4>
                        <StatusBadge tone={toneForStatus(item.status)}>{item.status}</StatusBadge>
                      </div>
                      {item.ministry?.name && (
                        <p className="mt-0.5 text-theme-xs text-gray-500 dark:text-gray-400">{item.ministry.name}</p>
                      )}
                      {item.description && (
                        <p className="mt-2 text-theme-sm text-gray-600 dark:text-gray-400">{item.description}</p>
                      )}
                      {item.documents?.length > 0 && (
                        <p className="mt-2 inline-flex items-center gap-1.5 text-theme-xs text-gray-500 dark:text-gray-400">
                          <FileText className="h-3.5 w-3.5" />
                          {item.documents.length} document{item.documents.length === 1 ? "" : "s"}
                        </p>
                      )}
                      {itemDecisions.length > 0 && (
                        <ul className="mt-3 space-y-2">
                          {itemDecisions.map((d) => (
                            <li
                              key={d.id}
                              className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-theme-sm dark:border-gray-800 dark:bg-gray-900"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <span className="font-medium text-gray-800 dark:text-white/90">
                                  {d.title || d.name || d.decision || "Decision"}
                                </span>
                                {d.status && <StatusBadge tone={toneForStatus(d.status)}>{d.status}</StatusBadge>}
                              </div>
                              {d.description && <p className="mt-1 text-gray-600 dark:text-gray-400">{d.description}</p>}
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  );
                })}
              </ol>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
