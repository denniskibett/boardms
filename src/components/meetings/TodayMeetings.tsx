"use client";
import React from 'react';

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
}

export default function TodayMeetings({ meetings }: TodayMeetingsProps) {
  // Get today's meetings
  const getTodaysMeetings = () => {
    if (!Array.isArray(meetings)) return [];
    
    const today = new Date();
    const todayString = today.toDateString();
    
    return meetings.filter(meeting => {
      try {
        const meetingDate = new Date(meeting.start_at);
        return meetingDate.toDateString() === todayString;
      } catch {
        return false;
      }
    });
  };

  const todaysMeetings = getTodaysMeetings();

  // Don't render anything if there are no meetings today
  if (todaysMeetings.length === 0) {
    return null;
  }

  const formatMeetingTime = (startAt: string) => {
    try {
      const date = new Date(startAt);
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch {
      return 'Invalid Time';
    }
  };

  const getTimeUntilMeeting = (startAt: string) => {
    try {
      const now = new Date();
      const meetingTime = new Date(startAt);
      const diffMs = meetingTime.getTime() - now.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMins / 60);

      if (diffMins < 0) {
        return 'Started';
      } else if (diffMins < 60) {
        return `in ${diffMins} min`;
      } else if (diffHours < 24) {
        return `in ${diffHours} hr`;
      } else {
        return 'Today';
      }
    } catch {
      return 'Soon';
    }
  };

  const getMeetingStatus = (startAt: string) => {
    try {
      const now = new Date();
      const meetingTime = new Date(startAt);
      const diffMs = meetingTime.getTime() - now.getTime();
      
      if (diffMs < 0) {
        return { label: 'In Progress', class: 'bg-orange-500 text-white' };
      } else if (diffMs < 30 * 60 * 1000) { // Less than 30 minutes
        return { label: 'Starting Soon', class: 'bg-red-500 text-white' };
      } else if (diffMs < 2 * 60 * 60 * 1000) { // Less than 2 hours
        return { label: 'Upcoming', class: 'bg-blue-500 text-white' };
      } else {
        return { label: 'Scheduled', class: 'bg-green-500 text-white' };
      }
    } catch {
      return { label: 'Scheduled', class: 'bg-gray-500 text-white' };
    }
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-700 rounded-xl shadow-sm mb-6">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-blue-500 rounded-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
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
          <div className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 rounded-full">
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long',
                month: 'long',
                day: 'numeric' 
              })}
            </span>
          </div>
        </div>

        {/* Meetings Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {todaysMeetings.map((meeting) => {
            const status = getMeetingStatus(meeting.start_at);
            const timeUntil = getTimeUntilMeeting(meeting.start_at);
            
            return (
              <div
                key={meeting.id}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex items-start justify-between mb-3">
                  <h4 className="font-bold text-gray-900 dark:text-white leading-tight">
                    {meeting.name}
                  </h4>
                  <span className={`px-2 py-1 text-xs font-bold rounded-full ${status.class}`}>
                    {status.label}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
                    </svg>
                    <span className="font-medium">{formatMeetingTime(meeting.start_at)}</span>
                    <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                      {timeUntil}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
                    </svg>
                    <span>{meeting.location}</span>
                  </div>

                  {meeting.attendees_count && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"/>
                      </svg>
                      <span>{meeting.attendees_count} attendees</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 mt-3">
                  <span 
                    className="px-2 py-1 text-xs font-bold text-white rounded-full"
                    style={{ backgroundColor: meeting.colour || '#3B82F6' }}
                  >
                    {meeting.type}
                  </span>
                  {meeting.committee && (
                    <span className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full">
                      {meeting.committee}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-blue-200 dark:border-blue-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            All times are in your local timezone
          </p>
          <div className="flex gap-2">
            <button className="px-3 py-1 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
              Add to Calendar
            </button>
            <button className="px-3 py-1 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
              Join Meeting
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}