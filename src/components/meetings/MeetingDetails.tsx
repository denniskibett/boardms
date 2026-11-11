// src/components/meetings/MeetingDetails.tsx
"use client";
import React from 'react';
import { CalendarDays, Clock, MapPin, User } from 'lucide-react';
import { StatusBadge, toneForStatus } from '@/components/ui/kit';

interface Meeting {
  id: string | number;
  name: string;
  type: string;
  start_at: string;
  period?: string | number;
  actual_end?: string | null;
  location: string;
  status: string;
  description?: string;
  colour?: string;
  chair_name?: string | null;
  chair_role?: string | null;
}

interface MeetingDetailsProps {
  meeting: Meeting;
  /** Header actions (e.g. the "…" menu), rendered top-right. */
  actions?: React.ReactNode;
  /** Kept for compatibility; prefer `actions`. */
  onEdit?: () => void;
  settings?: { timezone?: string; date_format?: string; time_format?: string };
}

const parse = (v: string) => new Date(v.includes('T') ? v : v.replace(' ', 'T'));

const MeetingDetails: React.FC<MeetingDetailsProps> = ({ meeting, actions, settings }) => {
  const hour12 = settings?.time_format === '12';
  const start = parse(meeting.start_at);
  const end = meeting.actual_end
    ? parse(meeting.actual_end)
    : new Date(start.getTime() + (Number(meeting.period) || 60) * 60_000);
  const valid = !Number.isNaN(start.getTime());
  const time = (d: Date) => d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12 });

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: meeting.colour || '#3b82f6' }} />
            <span className="text-theme-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">{meeting.type}</span>
            <StatusBadge tone={toneForStatus(meeting.status)}>{meeting.status}</StatusBadge>
          </div>
          <h1 className="break-words text-title-sm font-semibold text-gray-800 dark:text-white/90">{meeting.name}</h1>
        </div>
        {actions}
      </div>

      <dl className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="flex items-start gap-3">
          <CalendarDays className="mt-0.5 h-5 w-5 shrink-0 text-gray-400" />
          <div>
            <dt className="text-theme-xs text-gray-500 dark:text-gray-400">Date</dt>
            <dd className="text-theme-sm text-gray-800 dark:text-white/90">
              {valid ? start.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
            </dd>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <Clock className="mt-0.5 h-5 w-5 shrink-0 text-gray-400" />
          <div>
            <dt className="text-theme-xs text-gray-500 dark:text-gray-400">Time</dt>
            <dd className="text-theme-sm text-gray-800 dark:text-white/90">
              {valid ? `${time(start)} – ${time(end)}` : '—'}
              {settings?.timezone && <span className="text-gray-500 dark:text-gray-400"> ({settings.timezone})</span>}
            </dd>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-gray-400" />
          <div className="min-w-0">
            <dt className="text-theme-xs text-gray-500 dark:text-gray-400">Location</dt>
            <dd className="break-words text-theme-sm text-gray-800 dark:text-white/90">{meeting.location || '—'}</dd>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <User className="mt-0.5 h-5 w-5 shrink-0 text-gray-400" />
          <div className="min-w-0">
            <dt className="text-theme-xs text-gray-500 dark:text-gray-400">Chair</dt>
            <dd className="text-theme-sm text-gray-800 dark:text-white/90">
              {meeting.chair_name || '—'}
              {meeting.chair_role && <span className="text-gray-500 dark:text-gray-400"> · {meeting.chair_role}</span>}
            </dd>
          </div>
        </div>
      </dl>

      {meeting.description && (
        <p className="mt-5 rounded-xl bg-gray-50 p-4 text-theme-sm text-gray-700 dark:bg-gray-900 dark:text-gray-300">
          {meeting.description}
        </p>
      )}
    </div>
  );
};

export default MeetingDetails;
