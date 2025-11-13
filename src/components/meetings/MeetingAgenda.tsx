"use client";
import React, { useState } from 'react';
import { FileText, Edit, BookOpen, CheckCircle2, ArrowDown } from 'lucide-react';
import FileIcon from '@/components/agenda/FileIcon';
import AgendaSlideOver from '@/components/agenda/AgendaSlideOver';
import QuickAddAgenda from '@/components/agenda/QuickAddAgenda';

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

  const allDocuments = agenda.flatMap(agendaItem => agendaItem.documents || []);

  const getStatusColor = (status: string) => {
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
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
      return 'Invalid date';
    }
  };

  const handleEditAgenda = (agendaItem: Agenda) => {
    setEditingAgenda(agendaItem);
    setIsAgendaSlideOverOpen(true);
  };

  const handleAgendaUpdate = (updatedAgenda: Agenda) => {
    onAgendaUpdate(updatedAgenda);
    setIsAgendaSlideOverOpen(false);
    setEditingAgenda(null);
  };

  const renderAgendaDocuments = (agendaItem: Agenda) => {
    if (!agendaItem.documents || agendaItem.documents.length === 0) {
      return null;
    }

    return (
      <div className="mt-3 border-t border-gray-200 dark:border-gray-700 pt-3">
        <div className="flex items-center gap-2 mb-2">
          <FileText className="h-4 w-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Documents</span>
          <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full">
            {agendaItem.documents.length}
          </span>
        </div>
        <div className="space-y-2">
          {agendaItem.documents.map((document) => (
            <div
              key={document.id}
              className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer group"
              onClick={() => onDocumentView(document)}
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
                  title="View all documents"
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
  };

  return (
    <div className="w-full">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/3">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">Meeting Agenda</h2>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {agenda.length} item{agenda.length !== 1 ? 's' : ''} • {allDocuments.length} documents
          </div>
        </div>

        {/* Quick Add Agenda */}
        <div className="mb-6">
          <QuickAddAgenda 
            meetingId={meetingId} 
            onAgendaAdded={onAgendaAdded} 
          />
        </div>

        {agenda.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 mb-2">No agenda items yet</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mb-4">
              Create your first agenda item to get started
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {agenda.map((agendaItem) => (
              <div
                key={agendaItem.id}
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  selectedAgenda?.id === agendaItem.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-700'
                    : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
                onClick={() => onAgendaSelect(agendaItem)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
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
                        handleEditAgenda(agendaItem);
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
                        title="View all documents"
                      >
                        <BookOpen className="h-4 w-4" />
                      </button>
                    )}
                    {selectedAgenda?.id === agendaItem.id && (
                      <CheckCircle2 className="h-5 w-5 text-blue-500 flex-shrink-0" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
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