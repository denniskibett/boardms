// src/components/meetings/TodayMeetings.tsx
"use client";
import React, { useMemo } from 'react';
import Link from 'next/link';
import { Calendar, Clock, MapPin, Users, Tag } from 'lucide-react';

interface Meeting {
  id: string;
  name: string;
  type: string;
  start_at: string;
  location: string;
  chair_id: string;
  status: string;
  description?: string;
  colour: string;
  committee?: string;
  attendees_count?: number;
}

interface TodayMeetingsProps {
  meetings: Meeting[];
  settings?: {
    timezone: string;
    date_format: string;
    time_format: '12' | '24';
  };
  onMeetingClick?: (meeting: Meeting) => void;
}

export default function TodayMeetings({ 
  meetings, 
  settings,
  onMeetingClick 
}: TodayMeetingsProps) {
  
  // System settings with defaults
  const systemSettings = useMemo(() => ({
    timezone: settings?.timezone || 'Africa/Nairobi',
    date_format: settings?.date_format || 'DD/MM/YYYY',
    time_format: settings?.time_format || '24'
  }), [settings]);

  // Get today's meetings with memoization
  const todaysMeetings = useMemo(() => {
    if (!Array.isArray(meetings)) return [];
    
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
    
    return meetings.filter(meeting => {
      try {
        const meetingDate = new Date(meeting.start_at);
        return meetingDate >= todayStart && meetingDate <= todayEnd;
      } catch {
        return false;
      }
    }).sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime());
  }, [meetings]);

  // Format time according to system settings
  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: systemSettings.time_format === '12',
        timeZone: systemSettings.timezone
      });
    } catch {
      return 'Invalid Time';
    }
  };

  // Format date according to system settings
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      
      switch(systemSettings.date_format) {
        case 'DD/MM/YYYY':
          return `${day}/${month}/${year}`;
        case 'MM/DD/YYYY':
          return `${month}/${day}/${year}`;
        case 'YYYY-MM-DD':
        default:
          return `${year}-${month}-${day}`;
      }
    } catch {
      return 'Invalid Date';
    }
  };

  // Get time until meeting
  const getTimeUntilMeeting = (startAt: string) => {
    try {
      const now = new Date();
      const meetingTime = new Date(startAt);
      const diffMs = meetingTime.getTime() - now.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 0) {
        return 'Started';
      } else if (diffMins < 60) {
        return `in ${diffMins} min`;
      } else if (diffHours < 24) {
        return `in ${diffHours} hr`;
      } else {
        return `in ${diffDays} days`;
      }
    } catch {
      return 'Soon';
    }
  };

  // Get meeting status
  const getMeetingStatus = (startAt: string) => {
    try {
      const now = new Date();
      const meetingTime = new Date(startAt);
      const diffMs = meetingTime.getTime() - now.getTime();
      
      if (diffMs < 0) {
        return { 
          label: 'In Progress', 
          class: 'bg-orange-500 text-white',
          icon: '⚡'
        };
      } else if (diffMs < 30 * 60 * 1000) {
        return { 
          label: 'Starting Soon', 
          class: 'bg-red-500 text-white',
          icon: '🔔'
        };
      } else if (diffMs < 2 * 60 * 60 * 1000) {
        return { 
          label: 'Upcoming', 
          class: 'bg-blue-500 text-white',
          icon: '📅'
        };
      } else {
        return { 
          label: 'Scheduled', 
          class: 'bg-green-500 text-white',
          icon: '✓'
        };
      }
    } catch {
      return { 
        label: 'Scheduled', 
        class: 'bg-gray-500 text-white',
        icon: '📌'
      };
    }
  };

  // Don't render anything if there are no meetings today
  if (todaysMeetings.length === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-700 rounded-xl shadow-sm">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-500 rounded-xl">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Today's Meetings
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {todaysMeetings.length} meeting{todaysMeetings.length !== 1 ? 's' : ''} scheduled for today
              </p>
            </div>
          </div>
          <div className="px-4 py-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
              {formatDate(new Date().toISOString())}
            </span>
          </div>
        </div>

        {/* Timezone Info */}
        <div className="mb-4 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
          <Clock size={12} />
          <span>All times in {systemSettings.timezone}</span>
          <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
          <span>{systemSettings.time_format === '12' ? '12h' : '24h'} format</span>
        </div>

        {/* Meetings Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {todaysMeetings.map((meeting) => {
            const status = getMeetingStatus(meeting.start_at);
            const timeUntil = getTimeUntilMeeting(meeting.start_at);
            
            return (
              <Link href={`/meetings/${meeting.id}`} key={meeting.id}>
                <div
                  className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 p-5 hover:shadow-lg transition-all duration-200 hover:border-blue-300 dark:hover:border-blue-600 cursor-pointer group"
                  onClick={() => onMeetingClick?.(meeting)}
                >
                  {/* Status Badge */}
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 flex-1">
                      {meeting.name}
                    </h4>
                    <span className={`px-2.5 py-1 text-xs font-bold rounded-full flex items-center gap-1 ml-2 ${status.class}`}>
                      <span>{status.icon}</span>
                      {status.label}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {/* Time */}
                    <div className="flex items-center gap-2 text-sm">
                      <Clock size={16} className="text-gray-400" />
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        {formatTime(meeting.start_at)}
                        
                      </span>
                      <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full text-gray-600 dark:text-gray-400">
                        {timeUntil}
                      </span>
                    </div>

                    {/* Location */}
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <MapPin size={16} className="text-gray-400" />
                      <span className="truncate">{meeting.location}</span>
                    </div>

                    {/* Attendees */}
                    {meeting.attendees_count && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Users size={16} className="text-gray-400" />
                        <span>{meeting.attendees_count} attendees</span>
                      </div>
                    )}

                    {/* Type & Committee */}
                    <div className="flex flex-wrap gap-2 mt-3">
                      <span 
                        className="px-3 py-1 text-xs font-bold text-white rounded-full flex items-center gap-1"
                        style={{ backgroundColor: meeting.colour || '#3B82F6' }}
                      >
                        <Tag size={12} />
                        {meeting.type}
                      </span>
                      {meeting.committee && (
                        <span className="px-3 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full">
                          {meeting.committee}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-blue-200 dark:border-blue-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Click any meeting to view details
          </p>
          <div className="flex gap-2">
            <button className="px-4 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
              Add to Calendar
            </button>
            {todaysMeetings.some(m => new Date(m.start_at) <= new Date()) && (
              <button className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                Join Active Meeting
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}