"use client";
import React from 'react';
import { Calendar, Clock, MapPin, Edit } from 'lucide-react';
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
  chair_image?: string;
}

interface MeetingDetailsProps {
  meeting: Meeting;
  onEdit: () => void;
}

const MeetingDetails: React.FC<MeetingDetailsProps> = ({ meeting, onEdit }) => {
  const calculateEndTime = () => {
    if (!meeting?.start_at || !meeting?.period) return 'N/A';
    
    try {
      const startTime = new Date(meeting.start_at);
      const durationMinutes = parseInt(meeting.period) || 0;
      const endTime = new Date(startTime.getTime() + durationMinutes * 60000);
      return formatMeetingDate(endTime.toISOString(), true);
    } catch (error) {
      console.error('Error calculating end time:', error);
      return 'N/A';
    }
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

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {meeting.name}
          </h2>
          
          <div className="space-y-3">
            <div className="flex items-center gap-4 text-lg text-gray-700 dark:text-gray-300">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-500" />
                <span className="font-medium">Start:</span>
                <span>{formatMeetingDate(meeting.start_at, true)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-green-500" />
                <span className="font-medium">End:</span>
                <span>{calculateEndTime()}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <MapPin className="w-4 h-4" />
              <span>{meeting.location}</span>
            </div>

            {meeting.description && (
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-gray-700 dark:text-gray-300">{meeting.description}</p>
              </div>
            )}
          </div>
        </div>
        
        <button
          onClick={onEdit}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30"
        >
          <Edit className="w-4 h-4" />
          Edit Event Details
        </button>
      </div>
    </div>
  );
};

export default MeetingDetails;