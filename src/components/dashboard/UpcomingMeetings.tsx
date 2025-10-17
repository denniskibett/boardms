"use client";
import React from "react";

const upcomingMeetings = [
  {
    id: 1,
    title: "Infrastructure Committee Meeting",
    committee: "Infrastructure & Energy",
    date: "2024-01-18",
    time: "10:00 AM",
    location: "Conference Room A",
    attendees: 12,
  },
  {
    id: 2,
    title: "Budget Review Session",
    committee: "Budget & Finance",
    date: "2024-01-19",
    time: "2:00 PM",
    location: "Conference Room B",
    attendees: 8,
  },
  {
    id: 3,
    title: "Social Services Quarterly",
    committee: "Social Services",
    date: "2024-01-22",
    time: "9:30 AM",
    location: "Virtual Meeting",
    attendees: 15,
  },
];

export default function UpcomingMeetings() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xs border border-gray-200 dark:border-gray-700">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Upcoming Meetings
        </h3>
      </div>
      <div className="p-6">
        <div className="space-y-4">
          {upcomingMeetings.map((meeting) => (
            <div
              key={meeting.id}
              className="p-4 border border-gray-100 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                {meeting.title}
              </h4>
              <div className="space-y-1 text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
                  </svg>
                  <span>
                    {new Date(meeting.date).toLocaleDateString()} at {meeting.time}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
                  </svg>
                  <span>{meeting.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"/>
                  </svg>
                  <span>{meeting.attendees} attendees</span>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <span className="text-xs font-medium px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 rounded-full">
                  {meeting.committee}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}