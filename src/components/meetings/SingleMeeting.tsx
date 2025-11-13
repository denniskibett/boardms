"use client";
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  XCircle,
  Loader2,
  Trash2,
  Download,
  BookOpen,
  File,
  Eye,
  CheckCircle2,
  X,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Search,
  Users,
  Plus
} from 'lucide-react';
import MeetingDetails from './MeetingDetails';
import MeetingInvitees from './MeetingInvitees';
import MeetingAgenda from './MeetingAgenda';
import MeetingParticipants from '@/components/meetings/MeetingParticipants';
import AgendaSlideOver from '@/components/agenda/AgendaSlideOver';
import FileIcon from '@/components/agenda/FileIcon';

interface Meeting {
  id: string;
  name: string;
  type: string;
  start_at: string;
  period: string;
  actual_end: string;
  location: string;
  chair_id: string;
  status: string;
  description: string;
  colour: string;
  created_at: string;
  updated_at: string;
  chair_name?: string;
  chair_email?: string;
  chair_role?: string;
  chair_image?: string;
  created_by_name?: string;
  approved_by_name?: string;
  participants?: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    image?: string;
  }>;
  agenda?: Array<{
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
  }>;
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

interface SystemSettings {
  timezone: string;
  date_format: string;
}

interface DocumentContent {
  id: string;
  agendaId: string;
  agendaName: string;
  document: AgendaDocument;
  htmlContent: string;
  pageCount: number;
  currentPage: number;
}

const SingleMeeting: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const meetingId = params.id as string;

  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [agenda, setAgenda] = useState<Agenda[]>([]);
  const [selectedAgenda, setSelectedAgenda] = useState<Agenda | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Document Viewer State
  const [isDocumentViewerOpen, setIsDocumentViewerOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<AgendaDocument | null>(null);
  const [currentDocumentIndex, setCurrentDocumentIndex] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [documentContents, setDocumentContents] = useState<DocumentContent[]>([]);
  const [currentContentIndex, setCurrentContentIndex] = useState(0);
  const [isConverting, setIsConverting] = useState(false);

  // Slide-over states
  const [isParticipantsSlideOverOpen, setIsParticipantsSlideOverOpen] = useState(false);
  const [isAgendaSlideOverOpen, setIsAgendaSlideOverOpen] = useState(false);

  // Get all documents from all agenda items
  const allDocuments = agenda.flatMap(agendaItem => agendaItem.documents || []);

  // Fetch meeting data with abort controller to prevent memory leaks
  useEffect(() => {
    const abortController = new AbortController();
    
    const fetchData = async () => {
      if (!meetingId) return;

      try {
        setIsLoading(true);
        setError(null);

        console.log('🔄 Fetching meeting data for ID:', meetingId);

        const meetingResponse = await fetch(`/api/meetings/${meetingId}`, {
          signal: abortController.signal
        });
        
        if (!meetingResponse.ok) {
          if (meetingResponse.status === 404) {
            throw new Error('Meeting not found');
          }
          throw new Error(`Failed to fetch meeting: ${meetingResponse.status}`);
        }
        
        const meetingData = await meetingResponse.json();
        console.log('✅ Meeting data loaded:', meetingData);
        
        setMeeting(meetingData);
        
        // Set agenda from the meeting data
        if (meetingData.agenda) {
          // Fetch documents for each agenda item
          const agendaWithDocuments = await Promise.all(
            meetingData.agenda.map(async (agendaItem: Agenda) => {
              try {
                const docsResponse = await fetch(`/api/agenda/documents?agendaId=${agendaItem.id}`);
                if (docsResponse.ok) {
                  const documents = await docsResponse.json();
                  return { ...agendaItem, documents };
                }
                return agendaItem;
              } catch (error) {
                console.error(`Error fetching documents for agenda ${agendaItem.id}:`, error);
                return agendaItem;
              }
            })
          );
          setAgenda(agendaWithDocuments);
          
          // Auto-select first agenda with documents
          const firstAgendaWithDocs = agendaWithDocuments.find(agenda => agenda.documents && agenda.documents.length > 0);
          if (firstAgendaWithDocs) {
            setSelectedAgenda(firstAgendaWithDocs);
          } else if (agendaWithDocuments.length > 0) {
            setSelectedAgenda(agendaWithDocuments[0]);
          }
        } else {
          setAgenda([]);
        }

      } catch (err) {
        // Only set error if it's not an abort error
        if (err.name !== 'AbortError') {
          console.error('❌ Error fetching data:', err);
          setError(err instanceof Error ? err.message : 'Failed to load meeting');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    // Cleanup function to abort fetch if component unmounts
    return () => {
      abortController.abort();
    };
  }, [meetingId]);

  // Convert documents to HTML content when agenda is selected
  useEffect(() => {
    const convertDocumentsToHTML = async () => {
      if (!selectedAgenda || !selectedAgenda.documents || selectedAgenda.documents.length === 0) {
        setDocumentContents([]);
        return;
      }

      setIsConverting(true);
      const contents: DocumentContent[] = [];

      for (const document of selectedAgenda.documents) {
        try {
          console.log('🔄 Converting document to HTML:', document.name);
          const htmlContent = await convertToHTML(document);
          
          contents.push({
            id: document.id,
            agendaId: selectedAgenda.id,
            agendaName: selectedAgenda.name,
            document: document,
            htmlContent: htmlContent,
            pageCount: 1,
            currentPage: 1
          });
        } catch (error) {
          console.error('❌ Failed to convert document:', document.name, error);
          // Add fallback content
          contents.push({
            id: document.id,
            agendaId: selectedAgenda.id,
            agendaName: selectedAgenda.name,
            document: document,
            htmlContent: `
              <div class="document-fallback">
                <h3>${document.name}</h3>
                <p>This document format cannot be previewed in the browser.</p>
                <p>File type: ${document.file_type}</p>
                <p>Size: ${formatFileSize(document.file_size)}</p>
              </div>
            `,
            pageCount: 1,
            currentPage: 1
          });
        }
      }

      setDocumentContents(contents);
      setIsConverting(false);
      console.log('✅ Document conversion completed:', contents.length, 'documents converted');
    };

    convertDocumentsToHTML();
  }, [selectedAgenda]);

  // Convert various file types to HTML
  const convertToHTML = async (document: AgendaDocument): Promise<string> => {
    const fileExtension = document.name.split('.').pop()?.toLowerCase() || '';
    
    // For images
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(fileExtension)) {
      return `
        <div class="image-document">
          <img src="${document.file_url}" alt="${document.name}" style="max-width: 100%; height: auto;" />
          <div class="image-caption">
            <strong>${document.name}</strong>
          </div>
        </div>
      `;
    }

    // For PDF files - using PDF.js
    if (fileExtension === 'pdf') {
      return await convertPDFToHTML(document);
    }

    // For Word documents - using Mammoth.js
    if (['doc', 'docx'].includes(fileExtension)) {
      return await convertWordToHTML(document);
    }

    // For Excel files
    if (['xls', 'xlsx'].includes(fileExtension)) {
      return `
        <div class="excel-fallback">
          <h3>Excel Document: ${document.name}</h3>
          <p>Excel files are best viewed by downloading and opening in Microsoft Excel.</p>
          <p>File size: ${formatFileSize(document.file_size)}</p>
        </div>
      `;
    }

    // For PowerPoint files
    if (['ppt', 'pptx'].includes(fileExtension)) {
      return `
        <div class="powerpoint-fallback">
          <h3>PowerPoint Presentation: ${document.name}</h3>
          <p>Presentation files are best viewed by downloading and opening in Microsoft PowerPoint.</p>
          <p>File size: ${formatFileSize(document.file_size)}</p>
        </div>
      `;
    }

    // For text files
    if (['txt', 'md'].includes(fileExtension)) {
      try {
        const response = await fetch(document.file_url);
        const text = await response.text();
        return `
          <div class="text-document">
            <pre>${text}</pre>
          </div>
        `;
      } catch (error) {
        throw new Error('Failed to read text file');
      }
    }

    // Default fallback
    return `
      <div class="unknown-format">
        <h3>${document.name}</h3>
        <p>This file format (${fileExtension}) cannot be previewed in the browser.</p>
        <p>Please download the file to view its contents.</p>
      </div>
    `;
  };

  // Convert PDF to HTML using PDF.js
  const convertPDFToHTML = async (document: AgendaDocument): Promise<string> => {
    return new Promise((resolve, reject) => {
      // Dynamically import PDF.js
      import('pdfjs-dist').then(pdfjsLib => {
        pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js`;

        const loadingTask = pdfjsLib.getDocument(document.file_url);
        loadingTask.promise.then((pdf: any) => {
          let htmlContent = `<div class="pdf-document">`;
          htmlContent += `<h3>${document.name}</h3>`;
          htmlContent += `<div class="pdf-pages">`;

          // Only render first few pages for performance
          const pageCount = Math.min(pdf.numPages, 10);
          const pagePromises = [];

          for (let i = 1; i <= pageCount; i++) {
            pagePromises.push(
              pdf.getPage(i).then((page: any) => {
                const viewport = page.getViewport({ scale: 1.5 });
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;

                const renderContext = {
                  canvasContext: context,
                  viewport: viewport
                };

                return page.render(renderContext).promise.then(() => {
                  return `<div class="pdf-page">
                    <div class="page-number">Page ${i}</div>
                    <img src="${canvas.toDataURL()}" alt="Page ${i}" />
                  </div>`;
                });
              })
            );
          }

          Promise.all(pagePromises).then(pages => {
            htmlContent += pages.join('');
            htmlContent += `</div></div>`;
            resolve(htmlContent);
          });
        }).catch(reject);
      }).catch(reject);
    });
  };

  // Convert Word documents to HTML using Mammoth.js
  const convertWordToHTML = async (document: AgendaDocument): Promise<string> => {
    return new Promise((resolve, reject) => {
      import('mammoth').then(mammoth => {
        fetch(document.file_url)
          .then(response => response.arrayBuffer())
          .then(arrayBuffer => {
            mammoth.convertToHtml({ arrayBuffer })
              .then((result: any) => {
                const htmlContent = `
                  <div class="word-document">
                    <h3>${document.name}</h3>
                    <div class="word-content">
                      ${result.value}
                    </div>
                  </div>
                `;
                resolve(htmlContent);
              })
              .catch(reject);
          })
          .catch(reject);
      }).catch(reject);
    });
  };

  // Refresh meeting data after agenda operations
  const refreshMeetingData = async () => {
    try {
      console.log('🔄 Refreshing meeting data...');
      const meetingResponse = await fetch(`/api/meetings/${meetingId}`);
      
      if (meetingResponse.ok) {
        const meetingData = await meetingResponse.json();
        setMeeting(meetingData);
        
        if (meetingData.agenda) {
          // Fetch documents for each agenda item
          const agendaWithDocuments = await Promise.all(
            meetingData.agenda.map(async (agendaItem: Agenda) => {
              try {
                const docsResponse = await fetch(`/api/agenda/documents?agendaId=${agendaItem.id}`);
                if (docsResponse.ok) {
                  const documents = await docsResponse.json();
                  return { ...agendaItem, documents };
                }
                return agendaItem;
              } catch (error) {
                console.error(`Error fetching documents for agenda ${agendaItem.id}:`, error);
                return agendaItem;
              }
            })
          );
          setAgenda(agendaWithDocuments);
        } else {
          setAgenda([]);
        }
        
        console.log('✅ Meeting data refreshed');
      }
    } catch (error) {
      console.error('❌ Error refreshing meeting data:', error);
    }
  };

  // Document Viewer Functions
  const openDocumentViewer = (document?: AgendaDocument) => {
    if (document) {
      const agendaItem = agenda.find(agenda => agenda.documents?.some(doc => doc.id === document.id));
      if (agendaItem) {
        setSelectedAgenda(agendaItem);
      }
    }
    
    if (selectedAgenda && selectedAgenda.documents && selectedAgenda.documents.length > 0) {
      setIsDocumentViewerOpen(true);
      setCurrentContentIndex(0);
      setZoomLevel(1);
      setRotation(0);
    }
  };

  const closeDocumentViewer = () => {
    setIsDocumentViewerOpen(false);
    setSelectedDocument(null);
    setCurrentContentIndex(0);
    setZoomLevel(1);
    setRotation(0);
    setSearchTerm('');
  };

  const navigateContent = (direction: 'prev' | 'next') => {
    if (documentContents.length === 0) return;

    let newIndex;
    if (direction === 'next') {
      newIndex = (currentContentIndex + 1) % documentContents.length;
    } else {
      newIndex = (currentContentIndex - 1 + documentContents.length) % documentContents.length;
    }

    setCurrentContentIndex(newIndex);
  };

  const navigateAgenda = (direction: 'prev' | 'next') => {
    if (agenda.length === 0) return;

    const currentIndex = agenda.findIndex(a => a.id === selectedAgenda?.id);
    let newIndex;
    
    if (direction === 'next') {
      newIndex = (currentIndex + 1) % agenda.length;
    } else {
      newIndex = (currentIndex - 1 + agenda.length) % agenda.length;
    }

    const newAgenda = agenda[newIndex];
    setSelectedAgenda(newAgenda);
    
    // If document viewer is open, reset to first document of new agenda
    if (isDocumentViewerOpen) {
      setCurrentContentIndex(0);
    }
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.25, 0.5));
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handleFullscreen = () => {
    const viewer = document.getElementById('document-viewer-content');
    if (viewer) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        viewer.requestFullscreen();
      }
    }
  };

  const handleSearch = () => {
    if (!searchTerm.trim()) return;
    
    setIsSearching(true);
    const contentElement = document.getElementById('document-content');
    if (contentElement) {
      const text = contentElement.innerText || contentElement.textContent || '';
      const regex = new RegExp(searchTerm, 'gi');
      const matches = text.match(regex);
      
      if (matches) {
        // Highlight matches (simplified implementation)
        const highlightedContent = documentContents[currentContentIndex].htmlContent.replace(
          regex, 
          match => `<mark class="search-highlight">${match}</mark>`
        );
        
        // Create a temporary element to update the content
        const tempElement = document.createElement('div');
        tempElement.innerHTML = highlightedContent;
        contentElement.innerHTML = tempElement.innerHTML;
      }
    }
    setIsSearching(false);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isDocumentViewerOpen) return;

      switch (e.key) {
        case 'Escape':
          closeDocumentViewer();
          break;
        case 'ArrowLeft':
          navigateContent('prev');
          break;
        case 'ArrowRight':
          navigateContent('next');
          break;
        case 'ArrowUp':
          navigateAgenda('prev');
          break;
        case 'ArrowDown':
          navigateAgenda('next');
          break;
        case '+':
        case '=':
          handleZoomIn();
          break;
        case '-':
          handleZoomOut();
          break;
        case '0':
          handleResetZoom();
          break;
        case 'r':
          handleRotate();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isDocumentViewerOpen, currentContentIndex, documentContents, selectedAgenda, agenda]);

  const handleDownloadDocument = async (document: AgendaDocument) => {
    try {
      const response = await fetch(document.file_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = document.name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading document:', error);
      alert('Failed to download document');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleEdit = () => {
    router.push(`/meetings/edit/${meetingId}`);
  };

  const handleDelete = async () => {
    if (!meeting || !confirm('Are you sure you want to delete this meeting? This will also delete all associated agenda and documents. This action cannot be undone.')) {
      return;
    }

    try {
      setIsDeleting(true);
      console.log('🔄 Deleting meeting:', meetingId);
      
      const response = await fetch(`/api/meetings/${meetingId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete meeting');
      }
      
      console.log('✅ Meeting deleted');
      router.push('/calendar');
      router.refresh();

    } catch (err) {
      console.error('❌ Error deleting meeting:', err);
      alert(err instanceof Error ? err.message : 'Failed to delete meeting. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAgendaUpdate = (updatedAgenda: Agenda) => {
    console.log('🔄 Updating agenda in state:', updatedAgenda);
    
    // Update agenda list
    setAgenda(prev => prev.map(agendaItem => 
      agendaItem.id === updatedAgenda.id ? updatedAgenda : agendaItem
    ));
    
    // Update selected agenda if it's the one being edited
    if (selectedAgenda?.id === updatedAgenda.id) {
      setSelectedAgenda(updatedAgenda);
    }
    
    // Also update the meeting data
    if (meeting) {
      setMeeting(prev => prev ? {
        ...prev,
        agenda: prev.agenda ? prev.agenda.map(agendaItem => 
          agendaItem.id === updatedAgenda.id ? updatedAgenda : agendaItem
        ) : [updatedAgenda]
      } : null);
    }
  };

  // Action Cards Configuration
  const actionCards = [
    {
      id: 'participants',
      title: 'Manage Participants',
      description: 'Add, remove, and track RSVP status',
      icon: Users,
      color: 'blue',
      onClick: () => setIsParticipantsSlideOverOpen(true)
    },
    {
      id: 'agenda',
      title: 'Add Agenda Item',
      description: 'Create new agenda items and upload documents',
      icon: BookOpen,
      color: 'green',
      onClick: () => setIsAgendaSlideOverOpen(true)
    },
    {
      id: 'documents',
      title: 'View Documents',
      description: 'Browse all meeting documents',
      icon: File,
      color: 'purple',
      onClick: () => {
        if (allDocuments.length > 0) {
          openDocumentViewer();
        }
      },
      disabled: allDocuments.length === 0
    }
  ];

  // Render Document Viewer
  const renderDocumentViewer = () => {
    if (!isDocumentViewerOpen || !selectedAgenda || documentContents.length === 0) return null;

    const currentContent = documentContents[currentContentIndex];

    return (
      <div className="fixed inset-0 z-50 flex bg-white dark:bg-gray-900">
        {/* Left Panel - Meeting & Agenda Info (30%) */}
        <div className="w-1/3 border-r border-gray-200 dark:border-gray-700 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Meeting Documents
              </h2>
              <button
                onClick={closeDocumentViewer}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {meeting?.name}
            </p>
          </div>

          {/* Current Agenda Info */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-blue-50 dark:bg-blue-900/20">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              Current Agenda
            </h3>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              {selectedAgenda.name}
            </p>
            {selectedAgenda.description && (
              <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                {selectedAgenda.description}
              </p>
            )}
            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={() => navigateAgenda('prev')}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
              >
                <ChevronLeft className="w-3 h-3" />
                Prev Agenda
              </button>
              <button
                onClick={() => navigateAgenda('next')}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
              >
                Next Agenda
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Agenda List */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4">
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                Meeting Agenda ({agenda.length})
              </h4>
              <div className="space-y-2">
                {agenda.map((agendaItem, index) => (
                  <div
                    key={agendaItem.id}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedAgenda.id === agendaItem.id
                        ? 'bg-blue-100 border border-blue-300 dark:bg-blue-900 dark:border-blue-700'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                    onClick={() => {
                      setSelectedAgenda(agendaItem);
                      setCurrentContentIndex(0);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          #{index + 1}
                        </span>
                        <span className={`text-sm font-medium ${
                          selectedAgenda.id === agendaItem.id
                            ? 'text-blue-900 dark:text-blue-100'
                            : 'text-gray-900 dark:text-gray-100'
                        }`}>
                          {agendaItem.name}
                        </span>
                      </div>
                      {agendaItem.documents && agendaItem.documents.length > 0 && (
                        <span className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-full">
                          {agendaItem.documents.length}
                        </span>
                      )}
                    </div>
                    {selectedAgenda.id === agendaItem.id && (
                      <div className="mt-2 text-xs text-blue-600 dark:text-blue-400">
                        ✓ Currently viewing
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Document List for Current Agenda */}
          <div className="border-t border-gray-200 dark:border-gray-700">
            <div className="p-4">
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                Documents in this Agenda ({documentContents.length})
              </h4>
              <div className="space-y-2">
                {documentContents.map((content, index) => (
                  <div
                    key={content.id}
                    className={`p-2 rounded cursor-pointer transition-colors ${
                      currentContentIndex === index
                        ? 'bg-green-100 border border-green-300 dark:bg-green-900 dark:border-green-700'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                    onClick={() => setCurrentContentIndex(index)}
                  >
                    <div className="flex items-center gap-2">
                      <FileIcon 
                        fileType={content.document.file_type} 
                        className="w-4 h-4 text-gray-400" 
                      />
                      <span className={`text-sm truncate ${
                        currentContentIndex === index
                          ? 'text-green-900 dark:text-green-100 font-medium'
                          : 'text-gray-700 dark:text-gray-300'
                      }`}>
                        {content.document.name}
                      </span>
                    </div>
                    {currentContentIndex === index && (
                      <div className="mt-1 text-xs text-green-600 dark:text-green-400">
                        ✓ Currently viewing
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Document Content (70%) */}
        <div className="flex-1 flex flex-col">
          {/* Document Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <FileIcon 
                fileType={currentContent.document.file_type} 
                className="w-5 h-5 text-blue-500 flex-shrink-0" 
              />
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                  {currentContent.document.name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {formatFileSize(currentContent.document.file_size)} • 
                  Document {currentContentIndex + 1} of {documentContents.length} • 
                  Agenda: {currentContent.agendaName}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Search */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Search in document..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                />
                <button
                  onClick={handleSearch}
                  disabled={isSearching}
                  className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <Search className="w-4 h-4" />
                </button>
              </div>

              {/* Navigation */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => navigateContent('prev')}
                  disabled={documentContents.length <= 1}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-sm text-gray-500 dark:text-gray-400 mx-1">
                  {currentContentIndex + 1} / {documentContents.length}
                </span>
                <button
                  onClick={() => navigateContent('next')}
                  disabled={documentContents.length <= 1}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {/* View Controls */}
              <div className="flex items-center gap-1">
                <button
                  onClick={handleZoomOut}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <button
                  onClick={handleZoomIn}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={handleResetZoom}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleDownloadDocument(currentContent.document)}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={handleFullscreen}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Document Content */}
          <div 
            id="document-viewer-content"
            className="flex-1 bg-gray-50 dark:bg-gray-800 overflow-auto relative"
          >
            {isConverting ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">Converting document to readable format...</p>
                </div>
              </div>
            ) : (
              <div 
                id="document-content"
                className="p-8 max-w-4xl mx-auto bg-white dark:bg-gray-900 shadow-lg min-h-full"
                style={{
                  transform: `scale(${zoomLevel})`,
                  transformOrigin: 'top center'
                }}
                dangerouslySetInnerHTML={{ __html: currentContent.htmlContent }}
              />
            )}
          </div>

          {/* Footer Navigation */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Use ↑↓ arrows to navigate agendas • ←→ arrows to navigate documents
              </div>
              
              {documentContents.length > 1 && (
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => navigateContent('prev')}
                    className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous Document
                  </button>
                  
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Document {currentContentIndex + 1} of {documentContents.length}
                  </span>
                  
                  <button
                    onClick={() => navigateContent('next')}
                    className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
                  >
                    Next Document
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading meeting details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Meeting Not Found</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => router.push('/calendar')}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Calendar
          </button>
        </div>
      </div>
    );
  }

  if (!meeting) {
    return null;
  }

  return (
    <div className="w-full p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">Details</h2>
        <nav>
          <ol className="flex items-center gap-1.5">
            <li>
              <button
                onClick={() => router.push('/calendar')}
                className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Calendar
              </button>
            </li>
            <li className="text-sm text-gray-800 dark:text-white/90">Details</li>
          </ol>
        </nav>
      </div>

      

      {/* Meeting Details */}
      <MeetingDetails meeting={meeting} onEdit={handleEdit} />

      {/* Meeting Invitees */}
      <MeetingInvitees meeting={meeting} />

      {/* Action Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {actionCards.map((card) => {
          const Icon = card.icon;
          const colorClasses = {
            blue: 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800',
            green: 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800',
            purple: 'bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800',
          };
          const iconColors = {
            blue: 'text-blue-600 dark:text-blue-400',
            green: 'text-green-600 dark:text-green-400',
            purple: 'text-purple-600 dark:text-purple-400',
          };

          return (
            <button
              key={card.id}
              onClick={card.onClick}
              disabled={card.disabled}
              className={`
                p-6 rounded-xl border-2 text-left transition-all duration-200 hover:shadow-md
                ${colorClasses[card.color as keyof typeof colorClasses]}
                ${card.disabled 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'hover:scale-105 cursor-pointer'
                }
              `}
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-lg ${colorClasses[card.color as keyof typeof colorClasses]}`}>
                  <Icon className={`w-6 h-6 ${iconColors[card.color as keyof typeof iconColors]}`} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                    {card.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {card.description}
                  </p>
                  {card.disabled && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      No documents available
                    </p>
                  )}
                </div>
                <Plus className="w-5 h-5 text-gray-400 flex-shrink-0" />
              </div>
            </button>
          );
        })}
      </div>

      {/* Meeting Agenda */}
      <MeetingAgenda
        meetingId={meetingId}
        agenda={agenda}
        selectedAgenda={selectedAgenda}
        onAgendaSelect={setSelectedAgenda}
        onAgendaUpdate={handleAgendaUpdate}
        onAgendaAdded={refreshMeetingData}
        onDocumentView={openDocumentViewer}
        onDocumentDownload={handleDownloadDocument}
      />

      {/* Participants Slide-over */}
      {isParticipantsSlideOverOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            {/* Background overlay */}
            <div 
              className="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => setIsParticipantsSlideOverOpen(false)}
            />
            
            {/* Slide-over panel */}
            <div className="absolute inset-y-0 right-0 pl-10 max-w-full flex">
              <div className="relative w-screen max-w-2xl">
                <div className="h-full flex flex-col bg-white dark:bg-gray-900 shadow-xl">
                  {/* Header */}
                  <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Meeting Participants
                      </h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {meeting?.name}
                      </p>
                    </div>
                    <button
                      onClick={() => setIsParticipantsSlideOverOpen(false)}
                      className="p-2 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  {/* Content */}
                  <div className="flex-1 overflow-y-auto">
                    <div className="p-6">
                      <MeetingParticipants 
                        meetingId={parseInt(meetingId)} 
                        onParticipantsUpdate={(updatedParticipants) => {
                          if (meeting) {
                            setMeeting({
                              ...meeting,
                              participants: updatedParticipants
                            });
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Agenda Slide-over */}
      {isAgendaSlideOverOpen && (
        <AgendaSlideOver
          isOpen={isAgendaSlideOverOpen}
          onClose={() => setIsAgendaSlideOverOpen(false)}
          meetingId={meetingId}
          onAgendaAdded={refreshMeetingData}
        />
      )}

      {/* Document Viewer */}
      {renderDocumentViewer()}

      {/* Add CSS for document styling */}
      <style jsx global>{`
        .document-content {
          line-height: 1.6;
          color: #374151;
        }
        .document-content h1, 
        .document-content h2, 
        .document-content h3, 
        .document-content h4 {
          margin: 1.5em 0 0.5em 0;
          color: #111827;
        }
        .document-content p {
          margin: 1em 0;
        }
        .document-content img {
          max-width: 100%;
          height: auto;
        }
        .search-highlight {
          background-color: yellow;
          color: black;
        }
        .pdf-page {
          margin: 2em 0;
          border: 1px solid #e5e7eb;
          padding: 1em;
          background: white;
        }
        .page-number {
          text-align: center;
          font-size: 0.875em;
          color: #6b7280;
          margin-bottom: 0.5em;
        }
        .image-document {
          text-align: center;
        }
        .image-caption {
          margin-top: 1em;
          font-style: italic;
          color: #6b7280;
        }
        .word-content {
          font-family: 'Times New Roman', serif;
        }
        .dark .document-content {
          color: #d1d5db;
        }
        .dark .document-content h1,
        .dark .document-content h2,
        .dark .document-content h3,
        .dark .document-content h4 {
          color: #f9fafb;
        }
      `}</style>
    </div>
  );
};

export default SingleMeeting;