'use client';
/**
 * The meeting book: cover → contents → every agenda item with its documents, read as one.
 * Documents render "as is" with DocumentReader (lazily, as you scroll). "Download PDF" compiles
 * everything into one PDF with the cover (lib/books/buildBookPdf).
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { BookOpen, ChevronDown, Download, FileText, ListOrdered, Pencil } from 'lucide-react';
import { Btn, Card, StatusBadge, toneForStatus } from '@/components/ui/kit';
import { usePermissions } from '@/hooks/usePermissions';
import type { BookCover, MeetingBookData } from '@/lib/books/types';
import BookCoverView from './BookCoverView';
import CoverForm from './CoverForm';

const DocumentReader = dynamic(() => import('@/components/documents/DocumentReader'), {
  ssr: false,
  loading: () => <div className="h-64 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />,
});

function LazyMount({ children, minHeight = 320 }: { children: React.ReactNode; minHeight?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || show) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && (setShow(true), io.disconnect()), { rootMargin: '800px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, [show]);
  return (
    <div ref={ref} style={show ? undefined : { minHeight }}>
      {show ? children : null}
    </div>
  );
}

export default function MeetingBook({ meetingId, embedded = false }: { meetingId: string | number; embedded?: boolean }) {
  const { can } = usePermissions();
  const [data, setData] = useState<MeetingBookData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [coverOpen, setCoverOpen] = useState(false);
  const [building, setBuilding] = useState<string | null>(null);
  const [tocOpen, setTocOpen] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch(`/api/books/${meetingId}`, { cache: 'no-store' });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Could not load the meeting book');
      setData(body);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load the meeting book');
    }
  }, [meetingId]);

  useEffect(() => {
    load();
  }, [load]);

  // /books/:id?cover=1 opens the cover editor straight away.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('cover') === '1') setCoverOpen(true);
  }, []);

  const download = async () => {
    if (!data) return;
    setBuilding('Preparing…');
    try {
      const { buildBookPdf, downloadPdf } = await import('@/lib/books/buildBookPdf');
      const bytes = await buildBookPdf(data, (p) => setBuilding(`${p.step} (${p.done}/${p.total})`));
      downloadPdf(bytes, `${data.cover.title || data.meeting.name} - meeting book.pdf`);
    } catch (e) {
      console.error(e);
      setError('The PDF could not be built. Try again, or open the documents individually.');
    } finally {
      setBuilding(null);
    }
  };

  const jump = (id: string) => {
    setTocOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (error && !data) {
    return (
      <Card>
        <p className="text-sm text-error-600">{error}</p>
        <Btn variant="outline" size="sm" className="mt-3" onClick={load}>
          Try again
        </Btn>
      </Card>
    );
  }
  if (!data) return <div className="h-96 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800" />;

  const docCount = data.sections.reduce((n, s) => n + s.documents.length, 0);

  const toc = (
    <nav className="space-y-1 text-sm">
      <button type="button" onClick={() => jump('book-cover')} className="block w-full rounded-lg px-3 py-2 text-left text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5">
        Cover
      </button>
      {data.sections.map((s) => (
        <button
          key={s.id}
          type="button"
          onClick={() => jump(`book-item-${s.id}`)}
          className="flex w-full items-start gap-2 rounded-lg px-3 py-2 text-left text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5"
        >
          <span className="w-5 shrink-0 text-gray-400">{s.order}.</span>
          <span className="min-w-0 flex-1">
            <span className="line-clamp-2">{s.title}</span>
            <span className="text-theme-xs text-gray-400">{s.documents.length} document{s.documents.length === 1 ? '' : 's'}</span>
          </span>
        </button>
      ))}
    </nav>
  );

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
            <BookOpen className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold text-gray-800 dark:text-white/90">{data.cover.title || data.meeting.name}</p>
            <p className="text-theme-xs text-gray-500">
              {data.sections.length} agenda items · {docCount} documents
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Btn variant="outline" size="sm" className="lg:hidden" onClick={() => setTocOpen((o) => !o)}>
            <ListOrdered className="h-4 w-4" /> Contents
            <ChevronDown className={`h-4 w-4 transition ${tocOpen ? 'rotate-180' : ''}`} />
          </Btn>
          {can('books', 'edit') && (
            <Btn variant="outline" size="sm" onClick={() => setCoverOpen(true)}>
              <Pencil className="h-4 w-4" /> Edit cover
            </Btn>
          )}
          <Btn size="sm" onClick={download} loading={!!building} disabled={!!building}>
            {!building && <Download className="h-4 w-4" />}
            {building ? 'Building PDF…' : 'Download PDF'}
          </Btn>
        </div>
      </div>
      {building && <p className="-mt-3 truncate text-theme-xs text-gray-500">{building}</p>}
      {error && <p className="text-sm text-error-600">{error}</p>}
      {tocOpen && <Card className="lg:hidden">{toc}</Card>}

      <div className={`grid gap-6 ${embedded ? '' : 'lg:grid-cols-[260px_minmax(0,1fr)]'}`}>
        {!embedded && (
          <aside className="hidden lg:block">
            <div className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto rounded-2xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-white/[0.03]">
              <p className="px-3 pb-2 pt-1 text-theme-xs font-medium text-gray-500">Contents</p>
              {toc}
            </div>
          </aside>
        )}

        <div className="min-w-0 space-y-8">
          <section id="book-cover" className="scroll-mt-24">
            <BookCoverView data={data} />
          </section>

          {data.sections.length === 0 && (
            <Card>
              <p className="text-sm text-gray-500">This meeting has no agenda items yet.</p>
            </Card>
          )}

          {data.sections.map((s) => (
            <section key={s.id} id={`book-item-${s.id}`} className="scroll-mt-24 space-y-4">
              <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-theme-xs font-semibold text-brand-500">AGENDA ITEM {s.order}</p>
                    <h3 className="mt-1 text-lg font-semibold text-gray-800 dark:text-white/90">{s.title}</h3>
                    <p className="mt-1 text-theme-sm text-gray-500">
                      {[s.ministry, s.presenter && `Presenter: ${s.presenter}`].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                  {s.status && <StatusBadge tone={toneForStatus(s.status)}>{s.status}</StatusBadge>}
                </div>
                {s.description && <p className="mt-3 whitespace-pre-line text-theme-sm text-gray-600 dark:text-gray-400">{s.description}</p>}
                {s.documents.length === 0 && <p className="mt-3 text-theme-sm text-gray-400">No documents attached.</p>}
              </div>

              {s.documents.map((d) => (
                <LazyMount key={d.id}>
                  <DocumentReader name={d.name} type={d.file_type} url={d.file_url} height="80vh" />
                </LazyMount>
              ))}
            </section>
          ))}

          {docCount > 0 && (
            <p className="flex items-center justify-center gap-2 pb-6 text-theme-xs text-gray-400">
              <FileText className="h-3.5 w-3.5" /> End of meeting book
            </p>
          )}
        </div>
      </div>

      {can('books', 'edit') && (
        <CoverForm
          open={coverOpen}
          onClose={() => setCoverOpen(false)}
          data={data}
          onSaved={(cover: BookCover) => setData((d) => (d ? { ...d, cover } : d))}
        />
      )}
    </div>
  );
}
