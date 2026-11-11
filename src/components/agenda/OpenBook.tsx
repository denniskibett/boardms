// src/components/agenda/OpenBook.tsx
'use client';
/**
 * Open Book for one meeting: agenda editor beside the meeting book (cover + all documents as one).
 * Desktop: agenda column + book. Mobile: "Agenda" / "Book" tabs.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';
import { useOpenBook } from '@/hooks/useOpenBook';
import { usePermissions } from '@/hooks/usePermissions';
import AgendaManager from '@/components/agenda/AgendaManager';
import AgendaSlideOver from '@/components/agenda/AgendaSlideOver';
import MeetingBook from '@/components/books/MeetingBook';
import { Btn, Card } from '@/components/ui/kit';

interface OpenBookProps {
  meetingId?: string;
}

export default function OpenBook({ meetingId }: OpenBookProps) {
  const { can } = usePermissions();
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedAgenda, setSelectedAgenda] = useState<unknown>(null);
  const [tab, setTab] = useState<'agenda' | 'book'>('book');
  const [bookKey, setBookKey] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const { documents, agendas, addAgenda, updateAgenda, deleteAgenda, loading } = useOpenBook(meetingId);

  // Reload the book whenever the agenda or its documents change.
  const signature = JSON.stringify(agendas.map((a) => [a.id, a.order, a.title, a.documents?.length ?? 0]));
  useEffect(() => setBookKey((k) => k + 1), [signature]);

  const scrollToItem = useCallback((agendaId?: number | string) => {
    if (agendaId == null) return;
    setTab('book');
    requestAnimationFrame(() =>
      document.getElementById(`book-item-${agendaId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
    );
  }, []);

  const onAgendaItemClick = (documentIndex: number) => {
    setCurrentPage(documentIndex);
    scrollToItem(documents[documentIndex]?.agenda_id);
  };

  const onReorderAgendas = (reordered: { id: string }[]) =>
    reordered.forEach((a, i) => updateAgenda(a.id, { order: i + 1 }));

  useEffect(() => {
    const onChange = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else rootRef.current?.requestFullscreen?.();
  };

  if (!meetingId || !/^\d+$/.test(String(meetingId))) {
    return (
      <Card>
        <p className="text-sm text-gray-500">Choose a meeting to open its book.</p>
      </Card>
    );
  }

  if (loading) return <div className="h-96 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800" />;

  const canEditAgenda = can('agenda', 'edit') || can('agenda', 'create');

  return (
    <div ref={rootRef} className={fullscreen ? 'h-full overflow-y-auto bg-gray-50 p-4 dark:bg-gray-900' : ''}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        {canEditAgenda ? (
          <div className="inline-flex rounded-lg bg-gray-100 p-0.5 lg:hidden dark:bg-gray-800">
            {(['book', 'agenda'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`rounded-md px-3 py-1.5 text-theme-sm font-medium ${
                  tab === t ? 'bg-white text-gray-900 shadow-theme-xs dark:bg-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                {t === 'book' ? 'Book' : 'Agenda'}
              </button>
            ))}
          </div>
        ) : (
          <span />
        )}
        <Btn variant="outline" size="sm" onClick={toggleFullscreen}>
          {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          {fullscreen ? 'Exit full screen' : 'Full screen'}
        </Btn>
      </div>

      <div className={`grid gap-6 ${canEditAgenda ? 'lg:grid-cols-[320px_minmax(0,1fr)]' : ''}`}>
        {canEditAgenda && (
          <aside className={`${tab === 'agenda' ? 'block' : 'hidden'} lg:block`}>
            <div className="lg:sticky lg:top-24 lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
              <AgendaManager
                agendas={agendas as React.ComponentProps<typeof AgendaManager>['agendas']}
                documents={documents as React.ComponentProps<typeof AgendaManager>['documents']}
                onAddAgenda={addAgenda}
                onUpdateAgenda={updateAgenda}
                onDeleteAgenda={deleteAgenda}
                onReorderAgendas={onReorderAgendas}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
                onAgendaItemClick={onAgendaItemClick}
                onShowAgendaDetails={(agenda: unknown) => setSelectedAgenda(agenda)}
              />
            </div>
          </aside>
        )}

        <div className={`${canEditAgenda && tab !== 'book' ? 'hidden' : 'block'} min-w-0 lg:block`}>
          <MeetingBook key={bookKey} meetingId={meetingId} embedded={canEditAgenda} />
        </div>
      </div>

      {!!selectedAgenda && (
        <AgendaSlideOver
          agenda={selectedAgenda}
          isOpen={!!selectedAgenda}
          onClose={() => setSelectedAgenda(null)}
          onSave={() => setSelectedAgenda(null)}
        />
      )}
    </div>
  );
}
