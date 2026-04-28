"use client";
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { FileText, Edit, BookOpen, CheckCircle2, ArrowDown, GripVertical } from 'lucide-react';
import FileIcon from '@/components/agendaold/FileIcon';
import AgendaSlideOver from '@/components/agendaold/AgendaSlideOver';
import QuickAddAgenda from '@/components/agendaold/QuickAddAgenda';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  restrictToVerticalAxis,
  restrictToParentElement,
} from '@dnd-kit/modifiers';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useMeetingsData } from '@/hooks/useMeetingsData';

interface AgendaDocument {
  id: string;
  agenda_id: string;
  name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  uploaded_by: string;
  uploaded_at: string;
  metadata: any;
  uploaded_by_name?: string;
  uploaded_by_email?: string;
}

interface Agenda {
  id: string;
  name: string;
  description: string;
  status: string;
  sort_order: number;
  presenter_id: string;
  ministry_id: string | null;
  memo_id: string | null;
  cabinet_approval_required: boolean;
  meeting_id: string;
  created_at: string;
  updated_at: string;
  documents?: AgendaDocument[];
  ministry?: {
    id: string;
    name: string;
  };
}

interface MeetingAgendaProps {
  meetingId: string;
  agenda: Agenda[];
  selectedAgenda: Agenda | null;
  onAgendaSelect: (agenda: Agenda) => void;
  onAgendaUpdate: (updatedAgenda: Agenda) => void;
  onAgendaAdded: () => void;
  onDocumentView: (document?: AgendaDocument) => void;
  onDocumentDownload: (document: AgendaDocument) => void;
}

// Create a SortableAgendaItem component
const SortableAgendaItem = ({
  agendaItem,
  selectedAgenda,
  onAgendaSelect,
  onEditAgenda,
  onDocumentView,
  onDocumentDownload,
  renderAgendaDocuments,
  getStatusColor,
  isSelected,
}: {
  agendaItem: Agenda;
  selectedAgenda: Agenda | null;
  onAgendaSelect: (agenda: Agenda) => void;
  onEditAgenda: (agenda: Agenda) => void;
  onDocumentView: (document?: AgendaDocument) => void;
  onDocumentDownload: (document: AgendaDocument) => void;
  renderAgendaDocuments: (agendaItem: Agenda) => React.ReactNode;
  getStatusColor: (status: string) => string;
  isSelected: boolean;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: agendaItem.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 999 : 'auto',
    cursor: isDragging ? 'grabbing' : 'default',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`p-4 border rounded-lg transition-all ${
        isSelected
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-700'
          : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
      } ${isDragging ? 'shadow-lg' : ''}`}
      onClick={() => onAgendaSelect(agendaItem)}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            {/* Drag Handle */}
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing p-1 -ml-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              title="Drag to reorder"
              onClick={(e) => e.stopPropagation()}
            >
              <GripVertical className="h-4 w-4 text-gray-400" />
            </div>
            
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
              #{agendaItem.sort_order}
            </span>
            <h3 className="font-medium text-gray-900 dark:text-white">
              {agendaItem.name}
            </h3>
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${getStatusColor(agendaItem.status)}`}>
              {agendaItem.status}
            </span>
            {agendaItem.cabinet_approval_required && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
                Cabinet Approval
              </span>
            )}
          </div>
          {agendaItem.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
              {agendaItem.description}
            </p>
          )}
          {agendaItem.presenter_id && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Presenter: {agendaItem.presenter_id}
            </p>
          )}
          
          {/* Render documents for this agenda item */}
          {renderAgendaDocuments(agendaItem)}
        </div>
        <div className="flex items-center gap-2 ml-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEditAgenda(agendaItem);
            }}
            className="p-1 text-gray-400 hover:text-blue-600 dark:text-gray-500 dark:hover:text-blue-400 transition-colors"
            title="Edit agenda"
          >
            <Edit className="h-4 w-4" />
          </button>
          {agendaItem.documents && agendaItem.documents.length > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAgendaSelect(agendaItem);
                onDocumentView();
              }}
              className="p-1 text-gray-400 hover:text-green-600 dark:text-gray-500 dark:hover:text-green-400 transition-colors"
              title="View all attachments"
            >
              <BookOpen className="h-4 w-4" />
            </button>
          )}
          {isSelected && (
            <CheckCircle2 className="h-5 w-5 text-blue-500 flex-shrink-0" />
          )}
        </div>
      </div>
    </div>
  );
};

const MeetingAgenda: React.FC<MeetingAgendaProps> = ({
  meetingId,
  agenda,
  selectedAgenda,
  onAgendaSelect,
  onAgendaUpdate,
  onAgendaAdded,
  onDocumentView,
  onDocumentDownload
}) => {
  const [editingAgenda, setEditingAgenda] = useState<Agenda | null>(null);
  const [isAgendaSlideOverOpen, setIsAgendaSlideOverOpen] = useState(false);
  const [localAgenda, setLocalAgenda] = useState<Agenda[]>([]);
  const [isReordering, setIsReordering] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  
  // Use the meetings data hook for all data operations
  const meetingsData = useMeetingsData();

  // Update local agenda when props change
  useEffect(() => {
    setLocalAgenda(agenda);
  }, [agenda]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Prevent drag on click
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const allDocuments = useMemo(() => 
    localAgenda.flatMap(agendaItem => agendaItem.documents || []),
    [localAgenda]
  );

  const getStatusColor = useCallback((status: string) => {
    const statusColors: { [key: string]: string } = {
      'scheduled': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      'confirmed': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      'in progress': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      'completed': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      'cancelled': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      'postponed': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
      'draft': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    };
    
    const normalizedStatus = status.toLowerCase();
    return statusColors[normalizedStatus] || 'bg-gray-100 text-gray-800';
  }, []);

  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  const formatDate = useCallback((dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
      return 'Invalid date';
    }
  }, []);

  const handleEditAgenda = useCallback((agendaItem: Agenda) => {
    setEditingAgenda(agendaItem);
    setIsAgendaSlideOverOpen(true);
  }, []);

  const handleAgendaUpdate = useCallback((updatedAgenda: Agenda) => {
    onAgendaUpdate(updatedAgenda);
    setIsAgendaSlideOverOpen(false);
    setEditingAgenda(null);
    
    // Update local agenda with the updated item
    setLocalAgenda(prev => 
      prev.map(item => 
        item.id === updatedAgenda.id ? updatedAgenda : item
      )
    );
  }, [onAgendaUpdate]);

  const handleAgendaAdded = useCallback(async () => {
    setIsAdding(true);
    try {
      await onAgendaAdded();
    } catch (error) {
      console.error('Error adding agenda:', error);
    } finally {
      setIsAdding(false);
    }
  }, [onAgendaAdded]);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) {
      return;
    }

    setIsReordering(true);

    try {
      // Find indices
      const oldIndex = localAgenda.findIndex(item => item.id === active.id);
      const newIndex = localAgenda.findIndex(item => item.id === over.id);

      // Create new sorted array
      const reorderedAgenda = arrayMove(localAgenda, oldIndex, newIndex);
      
      // Update sort_order values based on new positions
      const updatedAgenda = reorderedAgenda.map((item, index) => ({
        ...item,
        sort_order: index + 1 // Start from 1
      }));

      // Store original agenda for potential revert
      const originalAgenda = [...localAgenda];

      // Update local state immediately for smooth UI
      setLocalAgenda(updatedAgenda);

      // Find which items actually changed position
      const changedItems = updatedAgenda.filter((item, index) => {
        const originalItem = originalAgenda.find(orig => orig.id === item.id);
        return originalItem && originalItem.sort_order !== item.sort_order;
      });

      console.log('📊 Items that need updating:', changedItems.map(item => ({
        id: item.id,
        name: item.name,
        old_order: originalAgenda.find(orig => orig.id === item.id)?.sort_order,
        new_order: item.sort_order
      })));

      // Update each changed item using the meetingsData hook
      // IMPORTANT: Send ALL required fields that the API expects
      const updatePromises = changedItems.map(item => {
        console.log(`📤 Updating agenda ${item.id} to position ${item.sort_order}`);
        
        // Prepare update data with ALL required fields from the existing item
        // This ensures we don't miss any fields that the API requires
        const updateData = {
          name: item.name, // Required field!
          description: item.description || '',
          status: item.status || 'draft',
          sort_order: item.sort_order,
          presenter_id: item.presenter_id || null,
          ministry_id: item.ministry_id || null,
          cabinet_approval_required: item.cabinet_approval_required || false
        };

        // Use the meetingsData.updateAgenda method which handles caching and API calls
        return meetingsData.updateAgenda(item.id, updateData, meetingId);
      });

      // Wait for all updates to complete
      await Promise.all(updatePromises);
      
      console.log('✅ All agenda items updated successfully');

      // Trigger a background refresh after a short delay to ensure consistency
      setTimeout(() => {
        meetingsData.fetchAgendas(meetingId, true).catch(console.error);
      }, 1000);
      
    } catch (error) {
      console.error('Error updating agenda order:', error);
      // Revert to original order on error
      setLocalAgenda(agenda);
    } finally {
      setIsReordering(false);
    }
  }, [localAgenda, meetingId, agenda, meetingsData]);

  const renderAgendaDocuments = useCallback((agendaItem: Agenda) => {
    if (!agendaItem.documents || agendaItem.documents.length === 0) {
      return null;
    }

    return (
      <div className="mt-3 border-t border-gray-200 dark:border-gray-700 pt-3">
        <div className="flex items-center gap-2 mb-2">
          <FileText className="h-4 w-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Attachments</span>
          <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full">
            {agendaItem.documents.length}
          </span>
        </div>
        <div className="space-y-2">
          {agendaItem.documents.map((document) => (
            <div
              key={document.id}
              className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer group"
              onClick={(e) => {
                e.stopPropagation();
                onDocumentView(document);
              }}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <FileIcon fileType={document.file_type} className="w-4 h-4 text-blue-500 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
                    {document.name}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <span>{formatFileSize(document.file_size)}</span>
                    <span>•</span>
                    <span>{formatDate(document.uploaded_at)}</span>
                    {document.uploaded_by_name && (
                      <>
                        <span>•</span>
                        <span>By {document.uploaded_by_name}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDocumentView(document);
                  }}
                  className="p-1 text-gray-400 hover:text-blue-600 dark:text-gray-500 dark:hover:text-blue-400 transition-colors"
                  title="View all attachments"
                >
                  <BookOpen className="h-4 w-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDocumentDownload(document);
                  }}
                  className="p-1 text-gray-400 hover:text-green-600 dark:text-gray-500 dark:hover:text-green-400 transition-colors"
                  title="Download document"
                >
                  <ArrowDown className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }, [onDocumentView, onDocumentDownload, formatFileSize, formatDate]);

  return (
    <div className="w-full">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/3">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">Meeting Agenda</h2>
          <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-3">
            {(isReordering || isAdding) && (
              <span className="text-blue-500 animate-pulse">
                {isReordering ? 'Updating order...' : 'Adding item...'}
              </span>
            )}
            <span>
              {localAgenda.length} item{localAgenda.length !== 1 ? 's' : ''} • {allDocuments.length} attachments
            </span>
          </div>
        </div>

        {/* Quick Add Agenda */}
        <div className="mb-6">
          <QuickAddAgenda 
            meetingId={meetingId} 
            onAgendaAdded={handleAgendaAdded}
          />
        </div>

        {localAgenda.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 mb-2">No agenda items yet</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mb-4">
              Create your first agenda item to get started
            </p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
            modifiers={[restrictToVerticalAxis, restrictToParentElement]}
          >
            <SortableContext
              items={localAgenda.map(item => item.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-4">
                {localAgenda.map((agendaItem) => (
                  <SortableAgendaItem
                    key={agendaItem.id}
                    agendaItem={agendaItem}
                    selectedAgenda={selectedAgenda}
                    onAgendaSelect={onAgendaSelect}
                    onEditAgenda={handleEditAgenda}
                    onDocumentView={onDocumentView}
                    onDocumentDownload={onDocumentDownload}
                    renderAgendaDocuments={renderAgendaDocuments}
                    getStatusColor={getStatusColor}
                    isSelected={selectedAgenda?.id === agendaItem.id}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* Agenda Slide Over for Detailed Editing */}
      <AgendaSlideOver
        agenda={editingAgenda}
        isOpen={isAgendaSlideOverOpen}
        onClose={() => {
          setIsAgendaSlideOverOpen(false);
          setEditingAgenda(null);
        }}
        onSave={handleAgendaUpdate}
      />
    </div>
  );
};

export default MeetingAgenda;