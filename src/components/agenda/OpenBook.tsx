'use client';

import React, { useState, useEffect } from 'react';
import { useOpenBook } from '@/hooks/useOpenBook';
import BookViewer from '@/components/agenda/BookViewer';
import AgendaManager from '@/components/agenda/AgendaManager';
import AgendaSlideOver from '@/components/agenda/AgendaSlideOver';
import AnnotationToolbar from '@/components/agenda/AnnotationToolbar';

interface OpenBookProps {
  meetingId?: string;
}

export default function OpenBook({ meetingId }: OpenBookProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [isAnnotating, setIsAnnotating] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedAgenda, setSelectedAgenda] = useState<any>(null);
  const [showAgendaDetails, setShowAgendaDetails] = useState(false);
  
  const {
    documents,
    agendas,    addAgenda,
    updateAgenda,
    deleteAgenda,
    loading
  } = useOpenBook(meetingId);

  // Handle agenda item click to navigate to document
  const handleAgendaItemClick = (documentIndex: number) => {
    console.log('🔗 Agenda navigation clicked - Document index:', documentIndex);
    console.log('📄 Total documents:', documents.length);
    
    if (documentIndex >= 0 && documentIndex < documents.length) {
      console.log('✅ Setting current page to:', documentIndex);
      setCurrentPage(documentIndex);
    } else {
      console.error('❌ Invalid document index:', documentIndex);
    }
  };

  // Handle agenda details slideover
  const handleShowAgendaDetails = (agenda: any) => {
    console.log('📋 Opening agenda details for:', agenda);
    setSelectedAgenda(agenda);
    setShowAgendaDetails(true);
  };

  // Handle agenda save from slideover
  const handleAgendaSave = (savedAgenda: any) => {
    console.log('💾 Agenda saved:', savedAgenda);
    // The agenda will be automatically refreshed via the useOpenBook hook
    setShowAgendaDetails(false);
    setSelectedAgenda(null);
  };

  // Handle agenda reordering
  const handleReorderAgendas = (reorderedAgendas: any[]) => {
    reorderedAgendas.forEach((agenda, index) => {
      updateAgenda(agenda.id, { order: index + 1 });
    });
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Handle ESC key to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFullscreen]);

  // Prevent body scroll when in fullscreen
  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isFullscreen]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
      {isFullscreen && (
        <button
          onClick={toggleFullscreen}
          className="fixed top-4 right-4 z-50 p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-lg"
          title="Exit Fullscreen (ESC)"
        >
          ✕ Exit Fullscreen
        </button>
      )}

      {/* Agenda SlideOver */}
      {showAgendaDetails && (
        <AgendaSlideOver
          agenda={selectedAgenda}
          isOpen={showAgendaDetails}
          onClose={() => {
            setShowAgendaDetails(false);
            setSelectedAgenda(null);
          }}
          onSave={handleAgendaSave}
        />
      )}

      <div className={`${isFullscreen ? 'fixed inset-0 z-40 bg-white' : 'h-screen'} flex flex-col bg-gray-50 rounded-lg shadow-lg`}>
        {/* Header */}
        <div className="flex-shrink-0 bg-white border-b">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-gray-800">Open Book</h1>
              {/* <DocumentUpload onUpload={uploadDocument} /> */}
            </div>
            
            <div className="flex items-center space-x-4">
              <AnnotationToolbar
                isAnnotating={isAnnotating}
                onToggleAnnotating={() => setIsAnnotating(!isAnnotating)}
              />
              
              {!isFullscreen && (
                <button
                  onClick={toggleFullscreen}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <span>⛶</span>
                  <span>Fullscreen</span>
                </button>
              )}
              
              {isFullscreen && (
                <button
                  onClick={toggleFullscreen}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
                >
                  <span>✕</span>
                  <span>Exit Fullscreen</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Agenda Panel */}
          <div className="w-96 bg-white border-r flex flex-col">
            <div className="flex-1 overflow-y-auto">
              <AgendaManager
                agendas={agendas}
                documents={documents}
                onAddAgenda={addAgenda}
                onUpdateAgenda={updateAgenda}
                onDeleteAgenda={deleteAgenda}
                onReorderAgendas={handleReorderAgendas}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
                onAgendaItemClick={handleAgendaItemClick}
                onShowAgendaDetails={handleShowAgendaDetails}
              />
            </div>
          </div>

          {/* Book Viewer */}
          <div className="flex-1 bg-gray-100 min-w-0 overflow-hidden">
            <BookViewer
              documents={documents}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
              isFullscreen={isFullscreen}
              onAgendaItemClick={handleAgendaItemClick}
            />
          </div>
        </div>
      </div>
    </>
  );
}