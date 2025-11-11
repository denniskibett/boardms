"use client";
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  MapPin,
  Clock,
  Calendar,
  Users,
  User,
  FileText,
  Tag,
  CheckCircle,
  XCircle,
  Loader2,
  ArrowLeft,
  Edit,
  Trash2,
  Globe,
  Mail,
  Plus,
  Upload,
  File,
  Eye,
  CheckCircle2,
  Download,
  X,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  ZoomIn,
  ZoomOut,
  RotateCcw
} from 'lucide-react';
import { formatSystemDate } from '@/lib/utils/date-utils';
import FileIcon from '@/components/agenda/FileIcon';
import AgendaSlideOver from '@/components/agenda/AgendaSlideOver';
import QuickAddAgenda from '@/components/agenda/QuickAddAgenda';

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
  created_by_name?: string;
  approved_by_name?: string;
  participants?: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
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

const SingleMeeting: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const meetingId = params.id as string;

  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [agenda, setAgenda] = useState<Agenda[]>([]);
  const [selectedAgenda, setSelectedAgenda] = useState<Agenda | null>(null);
  const [documents, setDocuments] = useState<AgendaDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAgendaSlideOverOpen, setIsAgendaSlideOverOpen] = useState(false);
  const [editingAgenda, setEditingAgenda] = useState<Agenda | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    timezone: 'UTC',
    date_format: 'YYYY-MM-DD'
  });

  // Document Viewer State
  const [isDocumentViewerOpen, setIsDocumentViewerOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<AgendaDocument | null>(null);
  const [currentDocumentIndex, setCurrentDocumentIndex] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);

  // Fetch system settings
  useEffect(() => {
    const fetchSystemSettings = async () => {
      try {
        const response = await fetch('/api/settings');
        if (response.ok) {
          const settings = await response.json();
          setSystemSettings({
            timezone: settings.timezone || 'UTC',
            date_format: settings.date_format || 'YYYY-MM-DD'
          });
        }
      } catch (error) {
        console.error('Failed to fetch system settings:', error);
      }
    };

    fetchSystemSettings();
  }, []);

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

  // Get all documents from all agenda items
  const allDocuments = agenda.flatMap(agendaItem => agendaItem.documents || []);

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

  // Handle agenda creation
  const handleAgendaAdded = async () => {
    await refreshMeetingData();
  };

  // Handle agenda edit click
  const handleEditAgenda = (agendaItem: Agenda) => {
    setEditingAgenda(agendaItem);
    setIsAgendaSlideOverOpen(true);
  };

  // Handle agenda update from slideover
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

  // Document Viewer Functions
  const openDocumentViewer = (document: AgendaDocument) => {
    const documentIndex = allDocuments.findIndex(doc => doc.id === document.id);
    setSelectedDocument(document);
    setCurrentDocumentIndex(documentIndex);
    setZoomLevel(1);
    setRotation(0);
    setIsDocumentViewerOpen(true);
  };

  const closeDocumentViewer = () => {
    setIsDocumentViewerOpen(false);
    setSelectedDocument(null);
    setCurrentDocumentIndex(0);
    setZoomLevel(1);
    setRotation(0);
  };

  const navigateDocument = (direction: 'prev' | 'next') => {
    if (allDocuments.length === 0) return;

    let newIndex;
    if (direction === 'next') {
      newIndex = (currentDocumentIndex + 1) % allDocuments.length;
    } else {
      newIndex = (currentDocumentIndex - 1 + allDocuments.length) % allDocuments.length;
    }

    setCurrentDocumentIndex(newIndex);
    setSelectedDocument(allDocuments[newIndex]);
    setZoomLevel(1);
    setRotation(0);
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

  // Keyboard navigation for document viewer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isDocumentViewerOpen) return;

      switch (e.key) {
        case 'Escape':
          closeDocumentViewer();
          break;
        case 'ArrowLeft':
          navigateDocument('prev');
          break;
        case 'ArrowRight':
          navigateDocument('next');
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
  }, [isDocumentViewerOpen, currentDocumentIndex, allDocuments]);

  // Fetch documents when agenda is selected with abort controller
  useEffect(() => {
    if (!selectedAgenda) {
      setDocuments([]);
      return;
    }

    const abortController = new AbortController();

    const fetchDocuments = async () => {
      try {
        console.log('🔄 Fetching documents for agenda:', selectedAgenda.id);
        const response = await fetch(`/api/agenda/documents?agendaId=${selectedAgenda.id}`, {
          signal: abortController.signal
        });
        
        if (response.ok) {
          const docs = await response.json();
          console.log('✅ Fetched documents:', docs);
          setDocuments(docs);
        } else {
          console.error('❌ Failed to fetch documents');
          setDocuments([]);
        }
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('❌ Error fetching documents:', error);
          setDocuments([]);
        }
      }
    };

    fetchDocuments();

    // Cleanup function
    return () => {
      abortController.abort();
    };
  }, [selectedAgenda]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedAgenda || !event.target.files?.length) return;

    const file = event.target.files[0];
    const formData = new FormData();
    formData.append('file', file);
    formData.append('agendaId', selectedAgenda.id);
    formData.append('name', file.name);

    try {
      setIsUploading(true);
      console.log('🔄 Uploading file:', file.name);
      
      const response = await fetch('/api/agenda/documents', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const newDoc = await response.json();
        console.log('✅ File uploaded:', newDoc);
        
        setDocuments(prev => [...prev, newDoc]);
        event.target.value = '';
        
        // Update the selected agenda to reflect new document count
        const updatedAgenda = { 
          ...selectedAgenda,
          documents: [...(selectedAgenda.documents || []), newDoc]
        };
        setSelectedAgenda(updatedAgenda);
        
        // Also update the agenda list
        setAgenda(prev => prev.map(agendaItem => 
          agendaItem.id === selectedAgenda.id ? updatedAgenda : agendaItem
        ));
        
        alert('File uploaded successfully!');
      } else {
        const error = await response.json();
        console.error('❌ Upload failed:', error);
        alert(`Upload failed: ${error.error}`);
      }
    } catch (error) {
      console.error('❌ Error uploading file:', error);
      alert('Failed to upload file. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      console.log('🔄 Deleting document:', documentId);
      const response = await fetch(`/api/agenda/documents?documentId=${documentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        console.log('✅ Document deleted');
        setDocuments(prev => prev.filter(doc => doc.id !== documentId));
        
        // Update the selected agenda to reflect document removal
        if (selectedAgenda) {
          const updatedAgenda = {
            ...selectedAgenda,
            documents: (selectedAgenda.documents || []).filter(doc => doc.id !== documentId)
          };
          setSelectedAgenda(updatedAgenda);
          
          // Also update the agenda list
          setAgenda(prev => prev.map(agendaItem => 
            agendaItem.id === selectedAgenda.id ? updatedAgenda : agendaItem
          ));
        }
        
        alert('Document deleted successfully!');
      } else {
        const error = await response.json();
        console.error('❌ Delete failed:', error);
        alert(`Delete failed: ${error.error}`);
      }
    } catch (error) {
      console.error('❌ Failed to delete document:', error);
      alert('Failed to delete document');
    }
  };

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

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
      return 'Invalid date';
    }
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

  const getStatusIcon = (status: string | null | undefined) => {
    if (!status) return Clock;
    
    const statusIcons: { [key: string]: any } = {
      'scheduled': Clock,
      'confirmed': CheckCircle,
      'in progress': Loader2,
      'completed': CheckCircle,
      'cancelled': XCircle,
      'postponed': Clock,
      'draft': FileText
    };
    
    const normalizedStatus = status.toLowerCase();
    return statusIcons[normalizedStatus] || Clock;
  };

  const getStatusColor = (status: string | null | undefined) => {
    if (!status) return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    
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

  const formatMeetingDate = (dateString: string, includeTime: boolean = true) => {
    try {
      const date = new Date(dateString);
      return formatSystemDate(date, includeTime);
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  // Render Document Viewer
  const renderDocumentViewer = () => {
    if (!isDocumentViewerOpen || !selectedDocument) return null;

    const isImage = selectedDocument.file_type === 'image';
    const isPDF = selectedDocument.file_type === 'pdf';

    return (
      <div className="fixed inset-0 z-50 flex">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 transition-opacity"
          onClick={closeDocumentViewer}
        />
        
        {/* Document Viewer Panel - Takes half screen on the right */}
        <div className="fixed right-0 top-0 h-full w-1/2 bg-white dark:bg-gray-900 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <FileIcon fileType={selectedDocument.file_type} className="w-5 h-5 text-blue-500 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                  {selectedDocument.name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {formatFileSize(selectedDocument.file_size)} • {currentDocumentIndex + 1} of {allDocuments.length}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Navigation Controls */}
              <div className="flex items-center gap-1 mr-4">
                <button
                  onClick={() => navigateDocument('prev')}
                  disabled={allDocuments.length <= 1}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Previous document"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-sm text-gray-500 dark:text-gray-400 mx-1">
                  {currentDocumentIndex + 1} / {allDocuments.length}
                </span>
                <button
                  onClick={() => navigateDocument('next')}
                  disabled={allDocuments.length <= 1}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Next document"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {/* View Controls */}
              <div className="flex items-center gap-1 mr-4">
                {isImage && (
                  <>
                    <button
                      onClick={handleZoomOut}
                      className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                      title="Zoom out"
                    >
                      <ZoomOut className="w-4 h-4" />
                    </button>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {Math.round(zoomLevel * 100)}%
                    </span>
                    <button
                      onClick={handleZoomIn}
                      className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                      title="Zoom in"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleResetZoom}
                      className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                      title="Reset zoom"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleRotate}
                      className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                      title="Rotate"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>
                  </>
                )}
                <button
                  onClick={handleFullscreen}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  title="Fullscreen"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleDownloadDocument(selectedDocument)}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  title="Download"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={closeDocumentViewer}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  title="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Document Content */}
          <div 
            id="document-viewer-content"
            className="flex-1 bg-gray-100 dark:bg-gray-800 overflow-auto flex items-center justify-center p-4"
          >
            {isImage ? (
              <img
                src={selectedDocument.file_url}
                alt={selectedDocument.name}
                className="max-w-full max-h-full object-contain transition-transform duration-200"
                style={{
                  transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                  cursor: zoomLevel > 1 ? 'grab' : 'default'
                }}
                onMouseDown={(e) => {
                  if (zoomLevel > 1) {
                    const img = e.currentTarget;
                    let isDragging = false;
                    let startX = e.clientX;
                    let startY = e.clientY;
                    let scrollLeft = img.parentElement?.scrollLeft || 0;
                    let scrollTop = img.parentElement?.scrollTop || 0;

                    const handleMouseMove = (e: MouseEvent) => {
                      if (!isDragging) return;
                      const x = e.clientX;
                      const y = e.clientY;
                      const walkX = (startX - x) * 2;
                      const walkY = (startY - y) * 2;
                      
                      if (img.parentElement) {
                        img.parentElement.scrollLeft = scrollLeft + walkX;
                        img.parentElement.scrollTop = scrollTop + walkY;
                      }
                    };

                    const handleMouseUp = () => {
                      isDragging = false;
                      document.removeEventListener('mousemove', handleMouseMove);
                      document.removeEventListener('mouseup', handleMouseUp);
                    };

                    isDragging = true;
                    document.addEventListener('mousemove', handleMouseMove);
                    document.addEventListener('mouseup', handleMouseUp);
                  }
                }}
              />
            ) : isPDF ? (
              <iframe
                src={selectedDocument.file_url}
                className="w-full h-full border-0"
                title={selectedDocument.name}
              />
            ) : (
              <div className="text-center">
                <FileIcon fileType={selectedDocument.file_type} className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Preview not available
                </p>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  This file type cannot be previewed in the browser.
                </p>
                <button
                  onClick={() => handleDownloadDocument(selectedDocument)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mx-auto"
                >
                  <Download className="w-4 h-4" />
                  Download to view
                </button>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
            <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
              <div>
                Uploaded by {selectedDocument.uploaded_by_name || 'Unknown'} • {formatDate(selectedDocument.uploaded_at)}
              </div>
              <div className="flex items-center gap-4">
                <span>Use arrow keys to navigate</span>
                <span>ESC to close</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Add detailed meeting information display
  const renderMeetingDetails = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/3">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">Meeting Information</h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Meeting Type</label>
            <p className="text-sm text-gray-900 dark:text-white mt-1">{meeting.type}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Location</label>
            <div className="flex items-center mt-1">
              <MapPin className="h-4 w-4 text-gray-400 mr-2" />
              <p className="text-sm text-gray-900 dark:text-white">{meeting.location}</p>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Duration</label>
            <div className="flex items-center mt-1">
              <Clock className="h-4 w-4 text-gray-400 mr-2" />
              <p className="text-sm text-gray-900 dark:text-white">{meeting.period} minutes</p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/3">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">People</h3>
        <div className="space-y-4">
          {meeting.chair_name && (
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Chair Person</label>
              <div className="flex items-center mt-1">
                <User className="h-4 w-4 text-gray-400 mr-2" />
                <div>
                  <p className="text-sm text-gray-900 dark:text-white">{meeting.chair_name}</p>
                  {meeting.chair_role && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">{meeting.chair_role}</p>
                  )}
                  {meeting.chair_email && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">{meeting.chair_email}</p>
                  )}
                </div>
              </div>
            </div>
          )}
          {meeting.participants && meeting.participants.length > 0 && (
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Participants ({meeting.participants.length})
              </label>
              <div className="mt-2 space-y-2">
                {meeting.participants.slice(0, 3).map((participant) => (
                  <div key={participant.id} className="flex items-center">
                    <Users className="h-4 w-4 text-gray-400 mr-2" />
                    <div>
                      <p className="text-sm text-gray-900 dark:text-white">{participant.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{participant.role}</p>
                    </div>
                  </div>
                ))}
                {meeting.participants.length > 3 && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    +{meeting.participants.length - 3} more participants
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Render documents for an agenda item
  const renderAgendaDocuments = (agendaItem: Agenda) => {
    if (!agendaItem.documents || agendaItem.documents.length === 0) {
      return null;
    }

    return (
      <div className="mt-3 border-t border-gray-200 dark:border-gray-700 pt-3">
        <div className="flex items-center gap-2 mb-2">
          <FileText className="h-4 w-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Documents</span>
        </div>
        <div className="space-y-2">
          {agendaItem.documents.map((document) => (
            <div
              key={document.id}
              className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
              onClick={() => openDocumentViewer(document)}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <FileIcon fileType={document.file_type} className="w-4 h-4 text-blue-500 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
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
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openDocumentViewer(document);
                  }}
                  className="p-1 text-gray-400 hover:text-blue-600 dark:text-gray-500 dark:hover:text-blue-400 transition-colors"
                  title="View document"
                >
                  <Eye className="h-4 w-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownloadDocument(document);
                  }}
                  className="p-1 text-gray-400 hover:text-green-600 dark:text-gray-500 dark:hover:text-green-400 transition-colors"
                  title="Download document"
                >
                  <Download className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
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

  const StatusIcon = getStatusIcon(meeting.status);

  return (
    <div className="w-full p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">Meeting Details</h2>
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
            <li className="text-sm text-gray-800 dark:text-white/90">Meeting Details</li>
          </ol>
        </nav>
      </div>

      {/* Meeting Header Card */}
      <div className="flex flex-col justify-between gap-6 rounded-2xl border border-gray-200 bg-white px-6 py-5 sm:flex-row sm:items-center dark:border-gray-800 dark:bg-white/3 mb-6">
        <div className="flex flex-col gap-2.5 divide-gray-300 sm:flex-row sm:divide-x dark:divide-gray-700">
          <div className="flex items-center gap-2 sm:pr-3">
            <span className="text-base font-medium text-gray-700 dark:text-gray-400">
              Meeting: {meeting.name}
            </span>
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(meeting.status)}`}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {meeting.status}
            </span>
          </div>
          <p className="text-sm text-gray-500 sm:pl-3 dark:text-gray-400">
            Date: {formatMeetingDate(meeting.start_at, true)}
          </p>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={handleEdit}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            <Edit className="h-4 w-4" />
            Edit Meeting
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:bg-gray-400 transition-colors"
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            Delete
          </button>
        </div>
      </div>

      {/* Detailed Meeting Information */}
      {renderMeetingDetails()}

      {/* Quick Add Agenda */}
      <div className="mb-6">
        <QuickAddAgenda 
          meetingId={meetingId} 
          onAgendaAdded={handleAgendaAdded} 
        />
      </div>

      {/* Agenda Section - Full Width */}
      <div className="w-full">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/3">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">Meeting Agenda</h2>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {agenda.length} item{agenda.length !== 1 ? 's' : ''}
            </div>
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
                  onClick={() => setSelectedAgenda(agendaItem)}
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
      </div>

      {/* Document Viewer */}
      {renderDocumentViewer()}

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

export default SingleMeeting;