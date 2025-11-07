// app/components/meetings/SingleMeeting.tsx
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
  Mail
} from 'lucide-react';
import { formatSystemDate } from '@/lib/utils/date-utils';

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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
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

  // Fetch meeting data
  useEffect(() => {
    const fetchMeeting = async () => {
      if (!meetingId) return;

      try {
        setIsLoading(true);
        setError(null);

        console.log('🔍 Fetching meeting with ID:', meetingId);
        const response = await fetch(`/api/meetings/${meetingId}`);

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Meeting not found');
          }
          throw new Error('Failed to fetch meeting');
        }

        const meetingData = await response.json();
        console.log('✅ Meeting data received:', meetingData);
        setMeeting(meetingData);

      } catch (err) {
        console.error('❌ Error fetching meeting:', err);
        setError(err instanceof Error ? err.message : 'Failed to load meeting');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMeeting();
  }, [meetingId]);

  const handleEdit = () => {
    router.push(`/meetings/edit/${meetingId}`);
  };

  const handleDelete = async () => {
    if (!meeting || !confirm('Are you sure you want to delete this meeting? This action cannot be undone.')) {
      return;
    }

    try {
      setIsDeleting(true);
      const response = await fetch(`/api/meetings/${meetingId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete meeting');
      }

      // Redirect to calendar after successful deletion
      router.push('/calendar');
      router.refresh();

    } catch (err) {
      console.error('❌ Error deleting meeting:', err);
      alert('Failed to delete meeting. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusIcon = (status: string) => {
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

  const formatMeetingDate = (dateString: string, includeTime: boolean = true) => {
    try {
      const date = new Date(dateString);
      return formatSystemDate(date, includeTime);
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  const calculateEndTime = (startAt: string, period: string) => {
    try {
      const startDate = new Date(startAt);
      const endDate = new Date(startDate.getTime() + parseInt(period) * 60000);
      return formatSystemDate(endDate, true);
    } catch (error) {
      console.error('Error calculating end time:', error);
      return 'Invalid duration';
    }
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
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <button
            onClick={() => router.push('/calendar')}
            className="flex items-center mr-4 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Meeting Details</h1>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={handleEdit}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4 mr-2" />
            )}
            Delete
          </button>
        </div>
      </div>

      {/* Meeting Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Header with Colour Accent */}
        <div 
          className="h-2"
          style={{ backgroundColor: meeting.colour || '#3b82f6' }}
        />

        <div className="p-6">
          {/* Title and Status */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {meeting.name}
              </h2>
              <div className="flex items-center flex-wrap gap-3">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(meeting.status)}`}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {meeting.status}
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                  <Tag className="h-3 w-3 mr-1" />
                  {meeting.type}
                </span>
              </div>
            </div>
            
            {/* Colour Indicator */}
            <div className="flex items-center">
              <div 
                className="w-8 h-8 rounded-full border-2 border-gray-300 dark:border-gray-600"
                style={{ backgroundColor: meeting.colour || '#3b82f6' }}
                title="Meeting Colour"
              />
            </div>
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Date & Time Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-blue-500" />
                Date & Time
              </h3>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Start Time:</span>
                  <span className="text-sm text-gray-900 dark:text-white font-medium">
                    {formatMeetingDate(meeting.start_at, true)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Duration:</span>
                  <span className="text-sm text-gray-900 dark:text-white font-medium">
                    {meeting.period} minutes
                  </span>
                </div>
                
                <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">End Time:</span>
                  <span className="text-sm text-gray-900 dark:text-white font-medium">
                    {calculateEndTime(meeting.start_at, meeting.period)}
                  </span>
                </div>

                <div className="flex justify-between items-center py-2">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center">
                    <Globe className="h-4 w-4 mr-1" />
                    Timezone:
                  </span>
                  <span className="text-sm text-gray-900 dark:text-white font-medium">
                    {systemSettings.timezone}
                  </span>
                </div>
              </div>
            </div>

            {/* Location & Chair Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <MapPin className="h-5 w-5 mr-2 text-green-500" />
                Location & Chair
              </h3>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Location:</span>
                  <span className="text-sm text-gray-900 dark:text-white font-medium">
                    {meeting.location}
                  </span>
                </div>
                
                {meeting.chair_name && (
                  <>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Chair Person:</span>
                      <span className="text-sm text-gray-900 dark:text-white font-medium">
                        {meeting.chair_name}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Chair Role:</span>
                      <span className="text-sm text-gray-900 dark:text-white font-medium">
                        {meeting.chair_role}
                      </span>
                    </div>
                    
                    {meeting.chair_email && (
                      <div className="flex justify-between items-center py-2">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center">
                          <Mail className="h-4 w-4 mr-1" />
                          Chair Email:
                        </span>
                        <a 
                          href={`mailto:${meeting.chair_email}`}
                          className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium"
                        >
                          {meeting.chair_email}
                        </a>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          {meeting.description && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center mb-3">
                <FileText className="h-5 w-5 mr-2 text-purple-500" />
                Description & Agenda
              </h3>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {meeting.description}
                </p>
              </div>
            </div>
          )}

          {/* Participants */}
          {meeting.participants && meeting.participants.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center mb-3">
                <Users className="h-5 w-5 mr-2 text-orange-500" />
                Participants ({meeting.participants.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {meeting.participants.map((participant) => (
                  <div
                    key={participant.id}
                    className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <div className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full mr-3">
                      <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {participant.name}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {participant.role} • {participant.email}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
              <div>
                <span className="font-medium">Created by:</span> {meeting.created_by_name || 'System'}
              </div>
              <div>
                <span className="font-medium">Created at:</span> {formatMeetingDate(meeting.created_at, true)}
              </div>
              {meeting.approved_by_name && (
                <div>
                  <span className="font-medium">Approved by:</span> {meeting.approved_by_name}
                </div>
              )}
              <div>
                <span className="font-medium">Last updated:</span> {formatMeetingDate(meeting.updated_at, true)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SingleMeeting;