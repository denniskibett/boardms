// src/components/meetings/MeetingInvitees.tsx — compact participant summary for the meeting page.
"use client";
import React from 'react';
import { Users } from 'lucide-react';
import { StatusBadge, type Tone } from '@/components/ui/kit';

interface Invitee {
  id: string;
  type?: 'individual' | 'group';
  user?: { name: string; role?: string; image?: string | null };
  group?: { name: string };
  rsvp?: { name: string } | null;
}

interface MeetingInviteesProps {
  participants: Invitee[];
  /** Opens the participants panel. */
  onManage?: () => void;
  manageLabel?: string;
}

function initials(name = '') {
  const parts = name.replace(',', ' ').trim().split(/\s+/).filter(Boolean);
  return (parts.length > 1 ? parts[0][0] + parts[1][0] : name.charAt(0) || '?').toUpperCase();
}

function tone(name?: string): Tone {
  const n = (name || '').toLowerCase();
  if (/accept|attend|yes|confirm/.test(n) && !/not attend/.test(n)) return 'success';
  if (/declin|not attend|^no$/.test(n)) return 'error';
  if (/tentative|maybe/.test(n)) return 'warning';
  return 'gray';
}

const MeetingInvitees: React.FC<MeetingInviteesProps> = ({ participants, onManage, manageLabel = 'Manage' }) => {
  const shown = participants.slice(0, 8);
  const counts = participants.reduce<Record<string, number>>((acc, p) => {
    const k = p.rsvp?.name || 'No response';
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">Participants ({participants.length})</h3>
        {onManage && (
          <button type="button" onClick={onManage} className="text-theme-sm font-medium text-brand-500 hover:text-brand-600">
            {manageLabel}
          </button>
        )}
      </div>
      {participants.length === 0 ? (
        <div className="flex items-center gap-3 text-theme-sm text-gray-500 dark:text-gray-400">
          <Users className="h-5 w-5" />
          No participants added yet.
        </div>
      ) : (
        <>
          <div className="flex -space-x-2">
            {shown.map((p) => {
              const name = p.user?.name || p.group?.name || '?';
              return (
                <span
                  key={p.id}
                  title={name}
                  className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-brand-50 text-theme-xs font-semibold text-brand-600 dark:border-gray-900 dark:bg-brand-500/15 dark:text-brand-400"
                >
                  {initials(name)}
                </span>
              );
            })}
            {participants.length > shown.length && (
              <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-gray-100 text-theme-xs font-medium text-gray-600 dark:border-gray-900 dark:bg-gray-800 dark:text-gray-300">
                +{participants.length - shown.length}
              </span>
            )}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {Object.entries(counts).map(([k, n]) => (
              <StatusBadge key={k} tone={tone(k)}>
                {k}: {n}
              </StatusBadge>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default MeetingInvitees;
