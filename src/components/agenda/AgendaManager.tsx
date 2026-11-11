'use client';
// Agenda sidebar for the open book: ordered items, their documents, drag-to-reorder and item actions.
// Fits a ~320px column on desktop and full width on mobile.

import React, { useEffect, useRef, useState } from 'react';
import { GripVertical, Plus } from 'lucide-react';
import { ActionsMenu, Btn, ConfirmDialog, StatusBadge, TextArea, TextInput, toneForStatus } from '@/components/ui/kit';
import { usePermissions } from '@/hooks/usePermissions';
import FileIcon from '@/components/agenda/FileIcon';

interface Document {
  id: string;
  name: string;
  url: string;
  pages: number;
  type: 'pdf' | 'doc' | 'image' | 'text' | 'docx' | 'ppt' | 'pptx' | 'xls' | 'xlsx' | 'csv';
  size?: string;
}

interface AgendaItem {
  id: string;
  order: number;
  title: string;
  description: string;
  duration: number;
  isDocument?: boolean;
  documentIndex?: number;
  linkedDocumentId?: string;
  linkedDocumentName?: string;
  meeting_id?: number;
  status?: string;
  ministry_name?: string;
  ministry_co_sponsors?: string[];
  presenter_name?: string;
  presenter_id?: number;
  ministry_id?: number;
  cabinet_approval_required?: boolean;
  documents?: {
    id: number;
    name: string;
    file_url: string;
    file_type: string;
    file_size?: string;
    agenda_id: number;
  }[];
}

interface AgendaManagerProps {
  agendas: AgendaItem[];
  documents: Document[];
  onAddAgenda: (agenda: Omit<AgendaItem, 'id'>) => void;
  onUpdateAgenda: (id: string, updates: Partial<AgendaItem> & { sort_order?: number }) => void;
  onDeleteAgenda?: (id: string) => void;
  onReorderAgendas?: (reorderedAgendas: AgendaItem[]) => void;
  currentPage?: number;
  onAgendaItemClick?: (documentIndex: number) => void;
  onShowAgendaDetails?: (agenda: AgendaItem) => void;
  onPageChange: (page: number) => void;
}

export default function AgendaManager({
  agendas,
  documents,
  onAddAgenda,
  onUpdateAgenda,
  onDeleteAgenda,
  onReorderAgendas,
  currentPage = 0,
  onAgendaItemClick,
  onShowAgendaDetails,
}: AgendaManagerProps) {
  const { can } = usePermissions();
  const canCreate = can('agenda', 'create');
  const canEdit = can('agenda', 'edit');
  const canDelete = can('agenda', 'delete');

  const [items, setItems] = useState<AgendaItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ title: '', description: '' });
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [toDelete, setToDelete] = useState<AgendaItem | null>(null);
  const listRef = useRef<HTMLOListElement>(null);

  useEffect(() => {
    setItems([...agendas].sort((a, b) => a.order - b.order));
  }, [agendas]);

  // Highlight the item that owns the document currently shown in the book.
  useEffect(() => {
    const doc = documents[currentPage];
    if (!doc) return;
    const i = items.findIndex((a) => a.documents?.some((d) => String(d.id) === String(doc.id) || d.file_url === doc.url));
    if (i !== -1) setCurrentIndex(i);
  }, [currentPage, documents, items]);

  const docIndexFor = (d: { id: number | string; file_url: string }) =>
    documents.findIndex((doc) => String(doc.id) === String(d.id) || doc.url === d.file_url);

  const selectItem = (agenda: AgendaItem, index: number) => {
    setCurrentIndex(index);
    const first = agenda.documents?.[0];
    if (first && onAgendaItemClick) {
      const i = docIndexFor(first);
      if (i !== -1) onAgendaItemClick(i);
    }
  };

  const showDetails = (agenda: AgendaItem) =>
    onShowAgendaDetails?.({
      ...agenda,
      name: agenda.title,
      sort_order: agenda.order,
      status: agenda.status || 'draft',
      documents: agenda.documents || [],
    } as AgendaItem);

  // Arrow keys move between items while focus is inside the list.
  const onListKeyDown = (e: React.KeyboardEvent) => {
    if (!['ArrowUp', 'ArrowDown', 'Home', 'End'].includes(e.key)) return;
    e.preventDefault();
    const last = items.length - 1;
    const next =
      e.key === 'Home' ? 0 : e.key === 'End' ? last : Math.max(0, Math.min(last, currentIndex + (e.key === 'ArrowUp' ? -1 : 1)));
    setCurrentIndex(next);
    listRef.current?.querySelector<HTMLElement>(`[data-index="${next}"]`)?.focus();
  };

  const submitAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.title.trim()) return;
    onAddAgenda({ order: items.length + 1, title: draft.title.trim(), description: draft.description.trim(), duration: 30 });
    setDraft({ title: '', description: '' });
    setAdding(false);
  };

  const drop = (to: number) => {
    const from = dragIndex;
    setDragIndex(null);
    setOverIndex(null);
    if (from === null || from === to) return;
    const reordered = [...items];
    const [moved] = reordered.splice(from, 1);
    reordered.splice(to, 0, moved);
    const updated = reordered.map((a, i) => ({ ...a, order: i + 1 }));
    setItems(updated);
    setCurrentIndex(to);
    if (onReorderAgendas) onReorderAgendas(updated);
    else updated.forEach((a) => onUpdateAgenda(a.id, { order: a.order, sort_order: a.order }));
  };

  return (
    <div className="flex h-full min-w-0 flex-col p-4">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-gray-800 dark:text-white/90">Agenda</h2>
          <p className="text-theme-xs text-gray-500 dark:text-gray-400">
            {items.length} item{items.length === 1 ? '' : 's'}
            {canEdit && items.length > 1 ? ' · drag to reorder' : ''}
          </p>
        </div>
        {canCreate && !adding && (
          <Btn size="sm" variant="outline" onClick={() => setAdding(true)}>
            <Plus className="h-4 w-4" />
            Add
          </Btn>
        )}
      </div>

      {adding && (
        <form onSubmit={submitAdd} className="mb-4 space-y-2 rounded-xl border border-gray-200 p-3 dark:border-gray-800">
          <TextInput
            autoFocus
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            placeholder="Agenda item title"
            aria-label="Agenda item title"
          />
          <TextArea
            rows={2}
            value={draft.description}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            placeholder="Description (optional)"
            aria-label="Description"
          />
          <div className="flex justify-end gap-2">
            <Btn size="sm" variant="ghost" onClick={() => setAdding(false)}>
              Cancel
            </Btn>
            <Btn size="sm" type="submit" disabled={!draft.title.trim()}>
              Add item
            </Btn>
          </div>
        </form>
      )}

      {items.length === 0 ? (
        <p className="py-8 text-center text-theme-sm text-gray-500 dark:text-gray-400">No agenda items yet.</p>
      ) : (
        <ol ref={listRef} onKeyDown={onListKeyDown} className="custom-scrollbar -mx-1 flex-1 space-y-2 overflow-y-auto px-1">
          {items.map((agenda, index) => {
            const current = index === currentIndex;
            const isOver = overIndex === index && dragIndex !== null && dragIndex !== index;
            return (
              <li
                key={agenda.id}
                data-index={index}
                tabIndex={0}
                draggable={canEdit}
                onDragStart={(e) => {
                  e.dataTransfer.effectAllowed = 'move';
                  e.dataTransfer.setData('text/plain', String(index));
                  setDragIndex(index);
                }}
                onDragOver={(e) => {
                  if (dragIndex === null) return;
                  e.preventDefault();
                  setOverIndex(index);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  drop(index);
                }}
                onDragEnd={() => {
                  setDragIndex(null);
                  setOverIndex(null);
                }}
                onClick={() => selectItem(agenda, index)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') selectItem(agenda, index);
                }}
                className={`cursor-pointer rounded-xl border p-3 outline-none transition focus-visible:ring-3 focus-visible:ring-brand-500/20 ${
                  current
                    ? 'border-brand-300 bg-brand-25 dark:border-brand-500/40 dark:bg-brand-500/10'
                    : 'border-gray-200 bg-white hover:border-gray-300 dark:border-gray-800 dark:bg-white/[0.03] dark:hover:border-gray-700'
                } ${dragIndex === index ? 'opacity-50' : ''} ${isOver ? 'border-dashed border-brand-400' : ''}`}
              >
                <div className="flex items-start gap-2">
                  {canEdit && (
                    <GripVertical className="mt-0.5 h-4 w-4 shrink-0 cursor-grab text-gray-400" aria-hidden="true" />
                  )}
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-100 text-theme-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="break-words text-theme-sm font-medium text-gray-800 dark:text-white/90">{agenda.title}</p>
                    {(agenda.presenter_name || agenda.ministry_name) && (
                      <p className="mt-0.5 truncate text-theme-xs text-gray-500 dark:text-gray-400">
                        {[agenda.presenter_name, agenda.ministry_name].filter(Boolean).join(' · ')}
                      </p>
                    )}
                    {agenda.status && (
                      <div className="mt-1.5">
                        <StatusBadge tone={toneForStatus(agenda.status)}>{agenda.status.replace(/_/g, ' ')}</StatusBadge>
                      </div>
                    )}
                  </div>
                  <div onClick={(e) => e.stopPropagation()}>
                    <ActionsMenu
                      items={[
                        { label: canEdit ? 'Edit details' : 'Details', onClick: () => showDetails(agenda), hidden: !onShowAgendaDetails },
                        {
                          label: 'Delete',
                          danger: true,
                          separator: true,
                          hidden: !canDelete || !onDeleteAgenda,
                          onClick: () => setToDelete(agenda),
                        },
                      ]}
                    />
                  </div>
                </div>

                {!!agenda.documents?.length && (
                  <ul className="mt-2 space-y-1 border-t border-gray-100 pt-2 dark:border-gray-800">
                    {agenda.documents.map((d) => {
                      const i = docIndexFor(d);
                      const active = i !== -1 && i === currentPage;
                      return (
                        <li key={d.id}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCurrentIndex(index);
                              if (i !== -1) onAgendaItemClick?.(i);
                            }}
                            className={`flex w-full items-center gap-2 rounded-md px-2 py-1 text-left text-theme-xs ${
                              active
                                ? 'bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400'
                                : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-white/5'
                            }`}
                          >
                            <FileIcon fileType={d.file_type} fileName={d.name} className="h-4 w-4" />
                            <span className="truncate">{d.name}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
        </ol>
      )}

      <ConfirmDialog
        open={!!toDelete}
        title="Delete agenda item?"
        message={`"${toDelete?.title}" will be removed from this meeting. This cannot be undone.`}
        onConfirm={() => {
          if (toDelete) onDeleteAgenda?.(toDelete.id);
          setToDelete(null);
        }}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
