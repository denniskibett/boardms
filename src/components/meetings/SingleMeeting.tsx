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
  CheckCircle2
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
    presenter_name: string;
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
  presenter_name: string;
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

  // Fetch meeting data (which includes agenda)
  useEffect(() => {
    const fetchData = async () => {
      if (!meetingId) return;

      try {
        setIsLoading(true);
        setError(null);

        console.log('🔄 Fetching meeting data for ID:', meetingId);

        const meetingResponse = await fetch(`/api/meetings/${meetingId}`);
        
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
          setAgenda(meetingData.agenda);
        } else {
          setAgenda([]);
        }

      } catch (err) {
        console.error('❌ Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load meeting');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [meetingId]);

  // Refresh meeting data after agenda operations
  const refreshMeetingData = async () => {
    try {
      console.log('🔄 Refreshing meeting data...');
      const meetingResponse = await fetch(`/api/meetings/${meetingId}`);
      
      if (meetingResponse.ok) {
        const meetingData = await meetingResponse.json();
        setMeeting(meetingData);
        
        if (meetingData.agenda) {
          setAgenda(meetingData.agenda);
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

  // Fetch documents when agenda is selected
  useEffect(() => {
    if (!selectedAgenda) {
      setDocuments([]);
      return;
    }

    const fetchDocuments = async () => {
      try {
        console.log('🔄 Fetching documents for agenda:', selectedAgenda.id);
        const response = await fetch(`/api/agenda/documents?agendaId=${selectedAgenda.id}`);
        
        if (response.ok) {
          const docs = await response.json();
          console.log('✅ Fetched documents:', docs);
          setDocuments(docs);
        } else {
          console.error('❌ Failed to fetch documents');
          setDocuments([]);
        }
      } catch (error) {
        console.error('❌ Error fetching documents:', error);
        setDocuments([]);
      }
    };

    fetchDocuments();
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

  // Add detailed meeting information display
  const renderMeetingDetails = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
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
    <div className="max-w-7xl mx-auto p-4 md:p-6">
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
      <QuickAddAgenda 
        meetingId={meetingId} 
        onAgendaAdded={handleAgendaAdded} 
      />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column - Agenda List */}
        <div className="lg:col-span-8 2xl:col-span-9">
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
              <div className="space-y-3">
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
                        {agendaItem.presenter_name && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Presenter: {agendaItem.presenter_name}
                          </p>
                        )}
                        {agendaItem.documents && agendaItem.documents.length > 0 && (
                          <div className="flex items-center gap-2 mt-2">
                            <FileText className="h-3 w-3 text-gray-400" />
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {agendaItem.documents.length} document{agendaItem.documents.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                        )}
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

        {/* Right Column - Agenda Details & Documents */}
        <div className="space-y-6 lg:col-span-4 2xl:col-span-3">
          {/* Selected Agenda Details */}
          {selectedAgenda ? (
            <>
              <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/3">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                    Agenda Details
                  </h2>
                  <button
                    onClick={() => handleEditAgenda(selectedAgenda)}
                    className="p-1 text-gray-400 hover:text-blue-600 dark:text-gray-500 dark:hover:text-blue-400 transition-colors"
                    title="Edit agenda"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Agenda Name
                    </label>
                    <p className="text-sm text-gray-900 dark:text-white mt-1">
                      {selectedAgenda.name}
                    </p>
                  </div>
                  
                  {selectedAgenda.description && (
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Description
                      </label>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 whitespace-pre-wrap">
                        {selectedAgenda.description}
                      </p>
                    </div>
                  )}
                  
                  {selectedAgenda.presenter_name && (
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Presenter
                      </label>
                      <p className="text-sm text-gray-900 dark:text-white mt-1">
                        {selectedAgenda.presenter_name}
                      </p>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Status
                      </label>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs mt-1 ${getStatusColor(selectedAgenda.status)}`}>
                        {selectedAgenda.status}
                      </span>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Order
                      </label>
                      <p className="text-sm text-gray-900 dark:text-white mt-1">
                        #{selectedAgenda.sort_order}
                      </p>
                    </div>
                  </div>
                  
                  {selectedAgenda.memo_id && (
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Memo ID
                      </label>
                      <p className="text-sm text-gray-900 dark:text-white mt-1">
                        {selectedAgenda.memo_id}
                      </p>
                    </div>
                  )}
                  
                  {selectedAgenda.cabinet_approval_required && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                      <div className="flex items-center">
                        <FileText className="h-4 w-4 text-red-600 dark:text-red-400 mr-2" />
                        <span className="text-sm font-medium text-red-800 dark:text-red-300">
                          Requires Cabinet Approval
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Documents Section */}
              <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/3">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                    Supporting Documents
                  </h2>
                  <div className="relative">
                    <input
                      type="file"
                      onChange={handleFileUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      disabled={isUploading}
                      accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png,.txt"
                    />
                    <button
                      disabled={isUploading}
                      className="flex items-center gap-2 rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:bg-gray-400 transition-colors"
                    >
                      {isUploading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4" />
                      )}
                      Upload
                    </button>
                  </div>
                </div>

                {documents.length === 0 ? (
                  <div className="text-center py-8">
                    <File className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">No documents uploaded</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                      Upload supporting files for this agenda item
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50"
                      >
                        <div className="flex items-center min-w-0 flex-1">
                          <FileIcon fileType={doc.file_type} className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {doc.name}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                              <span>{(doc.file_size / 1024 / 1024).toFixed(2)} MB</span>
                              <span>•</span>
                              <span>{new Date(doc.uploaded_at).toLocaleDateString()}</span>
                              <span>•</span>
                              <span className="capitalize">{doc.file_type}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                          <a 
                            href={doc.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 transition-colors"
                            title="Download"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                          </a>
                          <button 
                            className="text-green-600 hover:text-green-700 dark:text-green-400 transition-colors"
                            onClick={() => {
                              // Open document in new tab for viewing
                              window.open(doc.file_url, '_blank');
                            }}
                            title="View"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteDocument(doc.id)}
                            className="text-red-600 hover:text-red-700 dark:text-red-400 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center dark:border-gray-800 dark:bg-white/3">
              <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Select an Agenda Item
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Click on an agenda item from the list to view details and upload documents
              </p>
            </div>
          )}
        </div>
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

export default SingleMeeting;