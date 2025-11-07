// app/components/meetings/MeetingMinutesList.tsx
"use client";
import React, { useState } from "react";

const minutes = [
  {
    id: "1",
    meetingTitle: "Infrastructure Committee Meeting",
    committee: "Infrastructure & Energy",
    date: "2024-01-11",
    status: "approved",
    attendees: 12,
    decisions: 5,
    preparedBy: "Secretariat Office",
  },
  {
    id: "2",
    meetingTitle: "Budget Review Session",
    committee: "Budget & Finance",
    date: "2024-01-05",
    status: "approved",
    attendees: 8,
    decisions: 3,
    preparedBy: "Treasury Department",
  },
  {
    id: "3",
    meetingTitle: "Social Services Quarterly",
    committee: "Social Services",
    date: "2024-01-08",
    status: "draft",
    attendees: 15,
    decisions: 8,
    preparedBy: "Health Ministry",
  },
];

const statusColors = {
  draft: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  approved: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  pending: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
};

export default function MeetingMinutesList() {
  const [filter, setFilter] = useState("all");

  const filteredMinutes = minutes.filter(minute => 
    filter === "all" || minute.status === filter
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xs border border-gray-200 dark:border-gray-700">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Meeting
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Committee
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Attendees
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Decisions
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {filteredMinutes.map((minute) => (
              <tr key={minute.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-6 py-4">
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {minute.meetingTitle}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Prepared by: {minute.preparedBy}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {minute.committee}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {new Date(minute.date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[minute.status]}`}>
                    {minute.status.charAt(0).toUpperCase() + minute.status.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {minute.attendees}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {minute.decisions}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button className="text-brand-500 hover:text-brand-600 dark:text-brand-400 mr-4">
                    View
                  </button>
                  {minute.status === 'draft' && (
                    <button className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
                      Edit
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredMinutes.length === 0 && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No minutes found</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {filter !== "all" ? "Try adjusting your filter" : "No meeting minutes available"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}