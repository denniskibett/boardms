'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Edit, MoreVertical } from 'lucide-react';

interface Document {
  id: string;
  name: string;
  url: string;
  pages: number;
  type: 'pdf' | 'doc' | 'image' | 'text' | 'docx' | 'ppt' | 'pptx' | 'xls' | 'xlsx';
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
  documents?: any[];

  // Add fields that AgendaSlideOver expects
  name?: string;
  sort_order?: number;
  presenter_id?: number;
  ministry_id?: number;
  cabinet_approval_required?: boolean;
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
      
      // Scroll to the agenda item
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

    // Find the agenda that contains the current document
    let foundAgendaIndex = -1;
    
    for (let i = 0; i < localAgendas.length; i++) {
      const agenda = localAgendas[i];
      if (agenda.documents && agenda.documents.length > 0) {
        // Check if current document belongs to this agenda
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
    
    // Prepare the agenda data for AgendaSlideOver
    const agendaForSlideOver = {
      ...agenda,
      // Map the fields that AgendaSlideOver expects
      name: agenda.title, // Map title to name
      sort_order: agenda.order, // Map order to sort_order
      // Include other fields that might be needed
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

  // Remove the edit button functionality since we're using AgendaSlideOver
  const startEditing = (agenda: AgendaItem) => {
    // Instead of local editing, open the AgendaSlideOver
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
      sort_order: index + 1 // Update sort_order as well
    }));

    setLocalAgendas(updatedAgendas);

    // Update sort_order in database for all reordered agendas
    if (onReorderAgendas) {
      onReorderAgendas(updatedAgendas);
    }

    // Also update each agenda individually to ensure sort_order is saved
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
      // Find the document index in the main documents array
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
                    // Edit Mode - This should not be used anymore since we're using AgendaSlideOver
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">Use the details panel to edit this agenda item.</p>
                    </div>
                  ) : (
                    // View Mode
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
                                {agenda.ministry_name}
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
                          {/* Edit button now opens AgendaSlideOver */}
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
                              handleDeleteAgenda(agenda.id);
                            }}
                            className="p-1 text-gray-400 hover:text-red-500 transition-colors rounded hover:bg-red-50"
                            title="Delete agenda item"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                          {/* More Details button */}
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleShowDetails(agenda);
                            }}
                            className="p-1 text-gray-400 hover:text-purple-500 transition-colors rounded hover:bg-purple-50"
                            title="View agenda details"
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
                      
                      {/* Documents Count */}
                      {hasDocuments && (
                        <div className="flex items-center space-x-1 mt-2">
                          <span className={`text-xs ${
                            isCurrent ? 'text-blue-600' : 'text-green-600'
                          }`}>
                            📎
                          </span>
                          <span className={`text-xs ${
                            isCurrent ? 'text-blue-600' : 'text-green-600'
                          }`}>
                            {agenda.documents!.length} document{agenda.documents!.length !== 1 ? 's' : ''} attached
                          </span>
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
    </div>
  );
}