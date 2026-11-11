'use client';
import React from 'react';
import type { MeetingBookData } from '@/lib/books/types';

function fmt(iso?: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

/** The book's cover page, as shown on screen (the PDF draws the same content). */
export default function BookCoverView({ data }: { data: MeetingBookData }) {
  const { meeting, org, cover, sections } = data;
  const docs = sections.reduce((n, s) => n + s.documents.length, 0);
  const rows: [string, React.ReactNode][] = [
    ['Date', fmt(meeting.start_at)],
    ['Venue', meeting.location],
    ['Chair', meeting.chair],
    ['Reference', cover.reference],
    ['Agenda items', sections.length],
    ['Documents', docs],
    ['Prepared by', cover.preparedBy],
    ['Status', meeting.status],
  ];

  return (
    <div className="relative mx-auto flex aspect-[1/1.414] w-full max-w-2xl flex-col items-center overflow-hidden rounded-lg border border-gray-200 bg-white px-6 py-8 text-center shadow-theme-md sm:px-12 sm:py-12 dark:border-gray-800">
      {cover.classification && (
        <p className="absolute left-0 right-0 top-3 text-xs font-bold tracking-widest text-red-700">{cover.classification}</p>
      )}
      {org.logo && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={org.logo} alt="" className="mt-4 h-16 w-auto object-contain sm:h-20" />
      )}
      <p className="mt-4 text-sm font-bold uppercase tracking-wide text-gray-800 sm:text-base">{org.name}</p>
      {org.slogan && <p className="text-xs text-gray-500">{org.slogan}</p>}

      <div className="mt-[10%] w-full border-y-2 border-brand-500 py-5 sm:py-8">
        <h2 className="text-xl font-bold text-gray-900 sm:text-3xl">{cover.title || meeting.name}</h2>
        <p className="mt-2 text-sm text-gray-500 sm:text-base">{cover.subtitle || `${meeting.type || 'Board'} Meeting Book`}</p>
      </div>

      <dl className="mt-[8%] grid w-full max-w-md grid-cols-[auto_1fr] gap-x-6 gap-y-2.5 text-left text-xs sm:text-sm">
        {rows
          .filter(([, v]) => v !== null && v !== undefined && v !== '')
          .map(([k, v]) => (
            <React.Fragment key={k}>
              <dt className="text-gray-500">{k}</dt>
              <dd className="font-semibold text-gray-800">{v}</dd>
            </React.Fragment>
          ))}
      </dl>

      {cover.note && <p className="mt-6 max-w-md text-xs text-gray-500">{cover.note}</p>}
      {cover.classification && (
        <p className="absolute bottom-3 left-0 right-0 text-xs font-bold tracking-widest text-red-700">{cover.classification}</p>
      )}
    </div>
  );
}
