'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Edit, MoreVertical, FileText, File, Image, FileSpreadsheet, FilePresentation, Trash2, User, Building } from 'lucide-react';

interface Document {
  id: string;
  name: string;
  url: string;
  pages: number;
  type: 'pdf' | 'doc' | 'image' | 'text' | 'docx' | 'ppt' | 'pptx' | 'xls' | 'xlsx' | 'csv';
  size?: string; // Added for file size
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
  ministry_co_sponsors?: string[]; // Added for co-sponsors
  presenter_name?: string; // Added for presenter
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
  onUpdateAgenda: (id: string, updates: Partial<AgendaItem>) => void;
  onDeleteAgenda?: (id: string) => void;
  onReorderAgendas?: (reorderedAgendas: AgendaItem[]) => void;
  currentPage?: number;
  onAgendaItemClick?: (documentIndex: number) => void;
  onShowAgendaDetails?: (agenda: AgendaItem) => void;
  onPageChange: (page: number) => void; 
}

// File type icon mapping
const getFileIcon = (fileType: string) => {
  const type = fileType.toLowerCase();
  if (type.includes('pdf')) return <FileText className="h-4 w-4 text-red-500" />;
  if (type.includes('doc')) return <FileText className="h-4 w-4 text-blue-500" />;
  if (type.includes('image')) return <Image className="h-4 w-4 text-green-500" />;
  if (type.includes('sheet') || type.includes('excel')) return <FileSpreadsheet className="h-4 w-4 text-green-600" />;
  if (type.includes('presentation') || type.includes('powerpoint')) return <FilePresentation className="h-4 w-4 text-orange-500" />;
  return <File className="h-4 w-4 text-gray-500" />;
};

// Format file size
const formatFileSize = (size?: string) => {
  if (!size) return '';
  const bytes = parseInt(size);
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
};

// Delete Confirmation Modal Component
interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  agendaTitle: string;
}

const DeleteModal: React.FC<DeleteModalProps> = ({ isOpen, onClose, onConfirm, agendaTitle }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center p-5 overflow-y-auto z-99999">
      <div 
        className="fixed inset-0 h-full w-full bg-gray-400/50 backdrop-blur-[32px] modal-close-btn"
        onClick={onClose}
      ></div>
      <div 
        className="relative w-full max-w-[600px] rounded-3xl bg-white p-6 dark:bg-gray-900 lg:p-10"
        onClick={e => e.stopPropagation()}
      >
        {/* close btn */}
        <button
          onClick={onClose}
          className="absolute right-3 top-3 z-999 flex h-9.5 w-9.5 items-center justify-center rounded-full bg-gray-100 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white sm:right-6 sm:top-6 sm:h-11 sm:w-11"
        >
          <svg
            className="fill-current"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M6.04289 16.5413C5.65237 16.9318 5.65237 17.565 6.04289 17.9555C6.43342 18.346 7.06658 18.346 7.45711 17.9555L11.9987 13.4139L16.5408 17.956C16.9313 18.3466 17.5645 18.3466 17.955 17.956C18.3455 17.5655 18.3455 16.9323 17.955 16.5418L13.4129 11.9997L17.955 7.4576C18.3455 7.06707 18.3455 6.43391 17.955 6.04338C17.5645 5.65286 16.9313 5.65286 16.5408 6.04338L11.9987 10.5855L7.45711 6.0439C7.06658 5.65338 6.43342 5.65338 6.04289 6.0439C5.65237 6.43442 5.65237 7.06759 6.04289 7.45811L10.5845 11.9997L6.04289 16.5413Z"
              fill=""
            />
          </svg>
        </button>

        <div className="text-center">
          <div className="relative flex items-center justify-center z-1 mb-7">
            <svg
              className="fill-error-50 dark:fill-error-500/15"
              width="90"
              height="90"
              viewBox="0 0 90 90"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M34.364 6.85053C38.6205 -2.28351 51.3795 -2.28351 55.636 6.85053C58.0129 11.951 63.5594 14.6722 68.9556 13.3853C78.6192 11.0807 86.5743 21.2433 82.2185 30.3287C79.7862 35.402 81.1561 41.5165 85.5082 45.0122C93.3019 51.2725 90.4628 63.9451 80.7747 66.1403C75.3648 67.3661 71.5265 72.2695 71.5572 77.9156C71.6123 88.0265 60.1169 93.6664 52.3918 87.3184C48.0781 83.7737 41.9219 83.7737 37.6082 87.3184C29.8831 93.6664 18.3877 88.0266 18.4428 77.9156C18.4735 72.2695 14.6352 67.3661 9.22531 66.1403C-0.462787 63.9451 -3.30193 51.2725 4.49185 45.0122C8.84391 41.5165 10.2138 35.402 7.78151 30.3287C3.42572 21.2433 11.3808 11.0807 21.0444 13.3853C26.4406 14.6722 31.9871 11.951 34.364 6.85053Z"
                fill=""
                fillOpacity=""
              />
            </svg>

            <span className="absolute -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2">
              <svg
                className="fill-error-600 dark:fill-error-500"
                width="38"
                height="38"
                viewBox="0 0 38 38"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M9.62684 11.7496C9.04105 11.1638 9.04105 10.2141 9.62684 9.6283C10.2126 9.04252 11.1624 9.04252 11.7482 9.6283L18.9985 16.8786L26.2485 9.62851C26.8343 9.04273 27.7841 9.04273 28.3699 9.62851C28.9556 10.2143 28.9556 11.164 28.3699 11.7498L21.1198 18.9999L28.3699 26.25C28.9556 26.8358 28.9556 27.7855 28.3699 28.3713C27.7841 28.9571 26.8343 28.9571 26.2485 28.3713L18.9985 21.1212L11.7482 28.3715C11.1624 28.9573 10.2126 28.9573 9.62684 28.3715C9.04105 27.7857 9.04105 26.836 9.62684 26.2502L16.8771 18.9999L9.62684 11.7496Z"
                  fill=""
                />
              </svg>
            </span>
          </div>

          <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90 sm:text-title-sm">
            Delete Agenda Item
          </h4>
          <p className="text-sm leading-6 text-gray-500 dark:text-gray-400 mb-4">
            Are you sure you want to delete the agenda item "{agendaTitle}"?
            This action cannot be undone.
          </p>

          <div className="flex items-center justify-center w-full gap-3 mt-7">
            <button
              type="button"
              onClick={onClose}
              className="flex justify-center w-full px-4 py-3 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg shadow-theme-xs hover:bg-gray-200 sm:w-auto"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className="flex justify-center w-full px-4 py-3 text-sm font-medium text-white rounded-lg bg-error-500 shadow-theme-xs hover:bg-error-600 sm:w-auto"
            >
              Delete Agenda
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Quick Overview Modal Component
interface OverviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  agenda: AgendaItem | null;
}

const OverviewModal: React.FC<OverviewModalProps> = ({ isOpen, onClose, agenda }) => {
  if (!isOpen || !agenda) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center p-5 overflow-y-auto z-99999">
      <div 
        className="fixed inset-0 h-full w-full bg-gray-400/50 backdrop-blur-[32px] modal-close-btn"
        onClick={onClose}
      ></div>
      <div 
        className="relative w-full max-w-[500px] rounded-3xl bg-white p-6 dark:bg-gray-900 lg:p-8"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-3 top-3 z-999 flex h-9.5 w-9.5 items-center justify-center rounded-full bg-gray-100 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white sm:right-4 sm:top-4"
        >
          <svg
            className="fill-current"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M6.04289 16.5413C5.65237 16.9318 5.65237 17.565 6.04289 17.9555C6.43342 18.346 7.06658 18.346 7.45711 17.9555L11.9987 13.4139L16.5408 17.956C16.9313 18.3466 17.5645 18.3466 17.955 17.956C18.3455 17.5655 18.3455 16.9323 17.955 16.5418L13.4129 11.9997L17.955 7.4576C18.3455 7.06707 18.3455 6.43391 17.955 6.04338C17.5645 5.65286 16.9313 5.65286 16.5408 6.04338L11.9987 10.5855L7.45711 6.0439C7.06658 5.65338 6.43342 5.65338 6.04289 6.0439C5.65237 6.43442 5.65237 7.06759 6.04289 7.45811L10.5845 11.9997L6.04289 16.5413Z"
              fill=""
            />
          </svg>
        </button>

        <div className="mb-6">
          <h4 className="mb-4 text-xl font-semibold text-gray-800 dark:text-white/90">
            Agenda Overview
          </h4>
          
          <div className="space-y-4">
            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-1">Title</h5>
              <p className="text-sm text-gray-900">{agenda.title}</p>
            </div>
            
            {agenda.description && (
              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-1">Description</h5>
                <p className="text-sm text-gray-900">{agenda.description}</p>
              </div>
            )}
            
            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-1">Duration</h5>
              <p className="text-sm text-gray-900">{agenda.duration} minutes</p>
            </div>
            
            {agenda.ministry_name && (
              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-1">Ministry</h5>
                <p className="text-sm text-gray-900">{agenda.ministry_name}</p>
              </div>
            )}
            
            {agenda.presenter_name && (
              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-1">Presenter</h5>
                <p className="text-sm text-gray-900">{agenda.presenter_name}</p>
              </div>
            )}
            
            {agenda.status && (
              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-1">Status</h5>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                  agenda.status === 'completed' ? 'bg-green-100 text-green-800' :
                  agenda.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {agenda.status.replace('_', ' ')}
                </span>
              </div>
            )}
            
            {agenda.documents && agenda.documents.length > 0 && (
              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-1">Documents</h5>
                <p className="text-sm text-gray-900">{agenda.documents.length} attached</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function AgendaManager({
  agendas,
  documents,
  onAddAgenda,
  onUpdateAgenda,
  onDeleteAgenda,
  onReorderAgendas,
  currentPage = 0,
  onAgendaItemClick,
  onShowAgendaDetails
}: AgendaManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newAgenda, setNewAgenda] = useState({ title: '', description: '', duration: 30 });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAgenda, setEditAgenda] = useState({ title: '', description: '', duration: 30 });
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [localAgendas, setLocalAgendas] = useState<AgendaItem[]>([]);
  const [currentAgendaIndex, setCurrentAgendaIndex] = useState<number>(0);
  const [agendaToDelete, setAgendaToDelete] = useState<{id: string, title: string} | null>(null);
  const [agendaToView, setAgendaToView] = useState<AgendaItem | null>(null);
  const agendaContainerRef = useRef<HTMLDivElement>(null);

  // Sync local agendas with props
  useEffect(() => {
    console.log('🔄 AgendaManager received agendas:', agendas);
    const sortedAgendas = [...agendas].sort((a, b) => a.order - b.order);
    setLocalAgendas(sortedAgendas);
  }, [agendas]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!agendaContainerRef.current) return;

      switch (event.key) {
        case 'ArrowUp':
          event.preventDefault();
          navigateAgendas(-1);
          break;
        case 'ArrowDown':
          event.preventDefault();
          navigateAgendas(1);
          break;
        case 'Home':
          event.preventDefault();
          setCurrentAgendaIndex(0);
          break;
        case 'End':
          event.preventDefault();
          setCurrentAgendaIndex(localAgendas.length - 1);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [localAgendas.length]);

  const navigateAgendas = (direction: number) => {
    setCurrentAgendaIndex(prev => {
      const newIndex = Math.max(0, Math.min(localAgendas.length - 1, prev + direction));
      
      setTimeout(() => {
        const agendaElement = document.getElementById(`agenda-${newIndex}`);
        if (agendaElement && agendaContainerRef.current) {
          agendaElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'nearest' 
          });
        }
      }, 100);
      
      return newIndex;
    });
  };

  // Find which agenda contains the current document
  useEffect(() => {
    if (documents.length === 0 || localAgendas.length === 0) return;

    let foundAgendaIndex = -1;
    
    for (let i = 0; i < localAgendas.length; i++) {
      const agenda = localAgendas[i];
      if (agenda.documents && agenda.documents.length > 0) {
        const currentDocument = documents[currentPage];
        if (currentDocument && agenda.documents.some((doc: any) => 
          doc.id.toString() === currentDocument.id || 
          doc.file_url === currentDocument.url
        )) {
          foundAgendaIndex = i;
          break;
        }
      }
    }

    if (foundAgendaIndex !== -1 && foundAgendaIndex !== currentAgendaIndex) {
      setCurrentAgendaIndex(foundAgendaIndex);
    }
  }, [currentPage, documents, localAgendas]);

  const handleAddAgenda = () => {
    if (newAgenda.title.trim()) {
      onAddAgenda({
        order: localAgendas.length + 1,
        title: newAgenda.title,
        description: newAgenda.description,
        duration: newAgenda.duration
      });
      setNewAgenda({ title: '', description: '', duration: 30 });
      setIsAdding(false);
    }
  };

  const handleDeleteAgenda = (id: string) => {
    if (onDeleteAgenda) {
      onDeleteAgenda(id);
    }
  };

  const handleShowDetails = (agenda: AgendaItem) => {
    console.log('📋 Opening agenda details for:', agenda);
    
    const agendaForSlideOver = {
      ...agenda,
      name: agenda.title,
      sort_order: agenda.order,
      id: agenda.id,
      meeting_id: agenda.meeting_id,
      description: agenda.description,
      status: agenda.status || 'draft',
      documents: agenda.documents || []
    };
    
    if (onShowAgendaDetails) {
      onShowAgendaDetails(agendaForSlideOver);
    }
  };

  const startEditing = (agenda: AgendaItem) => {
    handleShowDetails(agenda);
  };

  // Enhanced Drag and Drop handlers with sort_order update
  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('text/plain', index.toString());
    e.dataTransfer.effectAllowed = 'move';
    setDragIndex(index);
    
    setTimeout(() => {
      if (e.target instanceof HTMLElement) {
        e.target.classList.add('opacity-50');
      }
    }, 0);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    if (dragIndex !== null && dragIndex !== index) {
      setHoverIndex(index);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (!e.currentTarget.contains(relatedTarget)) {
      setHoverIndex(null);
    }
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    
    const dragIndex = parseInt(e.dataTransfer.getData('text/plain'));
    
    if (isNaN(dragIndex) || dragIndex === dropIndex || dragIndex === null) {
      resetDragState();
      return;
    }

    const reorderedAgendas = [...localAgendas];
    const [movedAgenda] = reorderedAgendas.splice(dragIndex, 1);
    reorderedAgendas.splice(dropIndex, 0, movedAgenda);

    // Update sort_order for all agendas
    const updatedAgendas = reorderedAgendas.map((agenda, index) => ({
      ...agenda,
      order: index + 1,
      sort_order: index + 1
    }));

    setLocalAgendas(updatedAgendas);

    // Update sort_order in database for all reordered agendas
    if (onReorderAgendas) {
      onReorderAgendas(updatedAgendas);
    }

    // Also update each agenda individually
    updatedAgendas.forEach((agenda) => {
      onUpdateAgenda(agenda.id, { 
        order: agenda.order,
        sort_order: agenda.sort_order 
      });
    });

    resetDragState();
  };

  const handleDragEnd = (e: React.DragEvent) => {
    e.preventDefault();
    resetDragState();
    
    if (e.target instanceof HTMLElement) {
      e.target.classList.remove('opacity-50');
    }
  };

  const resetDragState = () => {
    setHoverIndex(null);
    setDragIndex(null);
  };

  const getDisplayNumber = (agenda: AgendaItem, index: number) => {
    return localAgendas.findIndex(a => a.id === agenda.id) + 1;
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const isCurrentAgenda = (index: number) => {
    return index === currentAgendaIndex;
  };

  const handleAgendaClick = (agenda: AgendaItem, index: number) => {
    setCurrentAgendaIndex(index);
    
    // If agenda has documents, navigate to the first document
    if (agenda.documents && agenda.documents.length > 0 && onAgendaItemClick) {
      const firstDocument = agenda.documents[0];
      const documentIndex = documents.findIndex(doc => 
        doc.id === firstDocument.id.toString() || 
        doc.url === firstDocument.file_url
      );
      
      if (documentIndex !== -1) {
        onAgendaItemClick(documentIndex);
      }
    }
  };

  const handleDocumentClick = (agenda: AgendaItem, document: any) => {
    // Find the document in the main documents array and trigger view
    if (onAgendaItemClick) {
      const documentIndex = documents.findIndex(doc => 
        doc.id === document.id.toString() || 
        doc.url === document.file_url
      );
      
      if (documentIndex !== -1) {
        onAgendaItemClick(documentIndex);
      }
    }
  };

  return (
    <div className="p-4 h-full flex flex-col">
      {/* Header */}
      <div className="mb-6 flex-shrink-0">
        <h2 className="text-lg font-semibold text-gray-800">Meeting Agenda</h2>
        <p className="text-sm text-gray-600">
          {localAgendas.length} agenda item{localAgendas.length !== 1 ? 's' : ''}
        </p>
        <div className="mt-2 text-xs text-gray-500">
          Use ↑↓ arrows to navigate • Click agenda to view documents
        </div>
      </div>

      {/* Add Agenda Button */}
      <div className="flex justify-center mb-4 flex-shrink-0">
        <button
          onClick={() => setIsAdding(true)}
          disabled={isAdding}
          className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span>+</span>
          <span>Add Agenda Item</span>
        </button>
      </div>

      {/* Add Agenda Form */}
      {isAdding && (
        <div className="mb-4 bg-blue-50 p-4 rounded-lg border border-blue-200 flex-shrink-0">
          <h4 className="font-semibold text-blue-800 mb-3">Add New Agenda Item</h4>
          <input
            type="text"
            placeholder="Enter agenda title"
            value={newAgenda.title}
            onChange={(e) => setNewAgenda({ ...newAgenda, title: e.target.value })}
            className="w-full p-2 mb-3 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
          <textarea
            placeholder="Enter description (optional)"
            value={newAgenda.description}
            onChange={(e) => setNewAgenda({ ...newAgenda, description: e.target.value })}
            className="w-full p-2 mb-3 border border-gray-300 rounded text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
          />
          <div className="flex items-center justify-between">
            <div className="flex space-x-2">
              <button
                onClick={() => setIsAdding(false)}
                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddAgenda}
                disabled={!newAgenda.title.trim()}
                className="px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Agenda
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Agenda List */}
      <div 
        ref={agendaContainerRef}
        className="flex-1 overflow-y-auto space-y-3"
        style={{ maxHeight: 'none' }}
      >
        {localAgendas.map((agenda, index) => {
          const isEditing = editingId === agenda.id;
          const isDragging = dragIndex === index;
          const isHoverOver = hoverIndex === index;
          const displayNumber = getDisplayNumber(agenda, index);
          const hasDocuments = agenda.documents && agenda.documents.length > 0;
          const isCurrent = isCurrentAgenda(index);

          return (
            <div
              key={agenda.id}
              id={`agenda-${index}`}
              draggable={true}
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              onClick={() => handleAgendaClick(agenda, index)}
              className={`p-4 rounded-lg border group transition-all duration-200 cursor-pointer ${
                isCurrent 
                  ? 'border-blue-400 bg-blue-50 shadow-md ring-2 ring-blue-200' 
                  : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-md'
              } ${
                isDragging ? 'opacity-50 bg-blue-100 scale-95 shadow-lg' : ''
              } ${
                isHoverOver && dragIndex !== null && dragIndex !== index 
                  ? 'border-yellow-400 bg-yellow-50 border-2 mt-2 mb-2 transition-all duration-200' 
                  : ''
              }`}
              style={{
                transform: isDragging ? 'scale(0.95)' : 'scale(1)',
                transition: 'all 0.2s ease'
              }}
            >
              <div className="flex items-start space-x-3">
                {/* Drag Handle and Number */}
                <div className="flex flex-col items-center space-y-1">
                  <div className={`w-6 h-6 flex items-center justify-center rounded text-xs font-medium ${
                    isCurrent ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {displayNumber}
                  </div>
                  <span 
                    className="text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                    title="Drag to reorder"
                  >
                    ⋮⋮
                  </span>
                </div>

                {/* Agenda Content */}
                <div className="flex-1 min-w-0">
                  {isEditing ? (
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">Use the details panel to edit this agenda item.</p>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className={`font-medium text-sm leading-tight ${
                            isCurrent ? 'text-blue-800' : 'text-gray-800'
                          }`}>
                            {agenda.title}
                          </h3>
                          
                          {/* Status and Ministry Badges */}
                          <div className="flex flex-wrap gap-1 mt-1">
                            {agenda.status && (
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(agenda.status)}`}>
                                {agenda.status.replace('_', ' ')}
                              </span>
                            )}
                            {agenda.ministry_name && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                <Building className="h-3 w-3 mr-1" />
                                {agenda.ministry_name}
                              </span>
                            )}
                            {agenda.ministry_co_sponsors && agenda.ministry_co_sponsors.length > 0 && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
                                Co-sponsors: {agenda.ministry_co_sponsors.length}
                              </span>
                            )}
                            {agenda.presenter_name && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-cyan-100 text-cyan-800">
                                <User className="h-3 w-3 mr-1" />
                                {agenda.presenter_name}
                              </span>
                            )}
                            {isCurrent && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                Active
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex items-center space-x-1 flex-shrink-0 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              startEditing(agenda);
                            }}
                            className="p-1 text-gray-400 hover:text-blue-500 transition-colors rounded hover:bg-blue-50"
                            title="Edit agenda item"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setAgendaToDelete({ id: agenda.id, title: agenda.title });
                            }}
                            className="p-1 text-gray-400 hover:text-red-500 transition-colors rounded hover:bg-red-50"
                            title="Delete agenda item"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                          
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setAgendaToView(agenda);
                            }}
                            className="p-1 text-gray-400 hover:text-purple-500 transition-colors rounded hover:bg-purple-50"
                            title="View agenda overview"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      
                      {/* Description */}
                      {agenda.description && (
                        <p className={`text-xs mt-2 break-words ${
                          isCurrent ? 'text-blue-700' : 'text-gray-600'
                        }`}>
                          {agenda.description}
                        </p>
                      )}
                      
                      {/* Documents Section */}
                      {hasDocuments && (
                        <div className="mt-3">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className={`text-xs font-medium ${
                              isCurrent ? 'text-blue-600' : 'text-gray-700'
                            }`}>
                              Documents ({agenda.documents!.length})
                            </span>
                          </div>
                          
                         <div className="space-y-1">
  {agenda.documents!.map((doc, docIndex) => {
    const fileType = doc.file_type || doc.type || doc.format || 'unknown';
    const fileName = doc.name || doc.file_name || 'Unnamed Document';
    const fileSize = doc.file_size
      ? formatFileSize(
          typeof doc.file_size === 'number' ? doc.file_size : undefined
        )
      : 'Unknown size';
    const fileExtension =
      fileType?.split('/').pop()?.toUpperCase() ||
      fileName.split('.').pop()?.toUpperCase() ||
      'UNKNOWN';

    return (
      <div
        key={doc.id || docIndex}
        onClick={(e) => {
          e.stopPropagation();
          handleDocumentClick(agenda, doc);
        }}
        className={`flex items-center space-x-2 p-2 rounded text-xs cursor-pointer ${
          isCurrent
            ? 'bg-blue-100/50 hover:bg-blue-100'
            : 'bg-gray-50 hover:bg-gray-100'
        }`}
      >
        {/* File Icon (picked from file_type) */}
        {getFileIcon(fileType)}

        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-800 truncate">
            {fileName}
          </p>

          <div className="flex items-center space-x-2 text-gray-500">
            <span className="px-1 py-0.5 bg-gray-200 rounded text-[10px]">
              {fileExtension}
            </span>

            <span className="text-[10px]">{fileSize}</span>
          </div>
        </div>
      </div>
    );
  })}
</div>

                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {localAgendas.length === 0 && !isAdding && (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">📋</div>
            <p>No agenda items yet</p>
            <p className="text-sm mt-1">Click <strong>Add Agenda Item</strong> to get started</p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={agendaToDelete !== null}
        onClose={() => setAgendaToDelete(null)}
        onConfirm={() => {
          if (agendaToDelete) {
            handleDeleteAgenda(agendaToDelete.id);
          }
        }}
        agendaTitle={agendaToDelete?.title || ''}
      />

      {/* Overview Modal */}
      <OverviewModal
        isOpen={agendaToView !== null}
        onClose={() => setAgendaToView(null)}
        agenda={agendaToView}
      />
    </div>
  );
}