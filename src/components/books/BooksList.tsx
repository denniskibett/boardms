'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable, PageHeader, StatusBadge, toneForStatus, type Column } from '@/components/ui/kit';
import { usePermissions } from '@/hooks/usePermissions';
import type { MeetingBookData } from '@/lib/books/types';

interface Row {
  id: number;
  name: string;
  type?: string | null;
  start_at?: string | null;
  location?: string | null;
  status?: string | null;
  agenda_count: number;
  document_count: number;
}

const fmt = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

export default function BooksList() {
  const router = useRouter();
  const { can } = usePermissions();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [building, setBuilding] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/books', { cache: 'no-store' })
      .then(async (r) => {
        const body = await r.json();
        if (!r.ok) throw new Error(body.error || 'Could not load meetings');
        setRows(body);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const download = async (row: Row) => {
    setBuilding(row.id);
    try {
      const res = await fetch(`/api/books/${row.id}`);
      const data: MeetingBookData = await res.json();
      if (!res.ok) throw new Error();
      const { buildBookPdf, downloadPdf } = await import('@/lib/books/buildBookPdf');
      downloadPdf(await buildBookPdf(data), `${data.cover.title || data.meeting.name} - meeting book.pdf`);
    } catch {
      setError(`Could not build the book for “${row.name}”.`);
    } finally {
      setBuilding(null);
    }
  };

  const columns: Column<Row>[] = [
    {
      key: 'name',
      header: 'Meeting',
      sortable: true,
      cell: (r) => (
        <div>
          <p className="font-medium text-gray-800 dark:text-white/90">{r.name}</p>
          <p className="text-theme-xs text-gray-500">{r.type || 'Meeting'}</p>
        </div>
      ),
    },
    { key: 'start_at', header: 'Date', sortable: true, cell: (r) => fmt(r.start_at) },
    { key: 'location', header: 'Venue', hideBelow: 'md', cell: (r) => r.location || '—' },
    { key: 'agenda_count', header: 'Items', sortable: true, hideBelow: 'sm', cell: (r) => r.agenda_count },
    { key: 'document_count', header: 'Documents', sortable: true, cell: (r) => r.document_count },
    {
      key: 'status',
      header: 'Status',
      hideBelow: 'lg',
      cell: (r) => (r.status ? <StatusBadge tone={toneForStatus(r.status)}>{r.status}</StatusBadge> : '—'),
    },
  ];

  return (
    <>
      <PageHeader title="Meeting Books" description="Each meeting's agenda and papers compiled into one book with a cover." />
      <DataTable
        rows={rows}
        columns={columns}
        rowKey={(r) => r.id}
        loading={loading}
        error={error}
        searchKeys={(r) => [r.name, r.type, r.location, r.status]}
        searchPlaceholder="Search meetings…"
        initialSort={{ key: 'start_at', dir: 'desc' }}
        onRowClick={(r) => router.push(`/books/${r.id}`)}
        emptyTitle="No meetings yet"
        actions={(r) => [
          { label: 'Open book', onClick: () => router.push(`/books/${r.id}`) },
          {
            label: building === r.id ? 'Building PDF…' : 'Download PDF',
            onClick: () => download(r),
            disabled: building !== null,
          },
          { label: 'Edit cover', onClick: () => router.push(`/books/${r.id}?cover=1`), hidden: !can('books', 'edit') },
          { label: 'Open meeting', onClick: () => router.push(`/meetings/${r.id}`), separator: true, hidden: !can('meetings') },
        ]}
      />
    </>
  );
}
