// app/components/action-letters/ActionLettersList.tsx
"use client";
import React, { useState } from "react";

const actionLetters = [
  {
    id: "ACT-2024-001",
    title: "Implementation of Northern Corridor Infrastructure Development",
    decision: "DEC-2024-001",
    toMda: "Ministry of Transport",
    reference: "CAB/ACT/2024/001",
    issueDate: "2024-01-13",
    dueDate: "2024-06-30",
    status: "acknowledged",
    priority: "high",
    assignedTo: "Permanent Secretary, Transport",
    followUpDate: "2024-02-15",
    attachments: ["Project Plan.pdf", "Budget Allocation.docx"],
  },
  {
    id: "ACT-2024-002",
    title: "Energy Infrastructure Development - Northern Corridor",
    decision: "DEC-2024-001",
    toMda: "Ministry of Energy",
    reference: "CAB/ACT/2024/002",
    issueDate: "2024-01-13",
    dueDate: "2024-06-30",
    status: "in_progress",
    priority: "high",
    assignedTo: "Permanent Secretary, Energy",
    followUpDate: "2024-02-20",
    attachments: ["Energy Plan.pdf"],
  },
  {
    id: "ACT-2024-003",
    title: "Healthcare Infrastructure Modernization",
    decision: "DEC-2024-002",
    toMda: "Ministry of Health",
    reference: "CAB/ACT/2024/003",
    issueDate: "2024-01-11",
    dueDate: "2024-03-31",
    status: "completed",
    priority: "medium",
    assignedTo: "Director General, Health Services",
    followUpDate: "2024-02-10",
    attachments: ["Implementation Report.pdf"],
  },
  {
    id: "ACT-2024-004",
    title: "Education Curriculum Reform Implementation",
    decision: "DEC-2024-003",
    toMda: "Ministry of Education",
    reference: "CAB/ACT/2024/004",
    issueDate: "2024-01-16",
    dueDate: "2024-12-31",
    status: "pending",
    priority: "medium",
    assignedTo: "Director, Curriculum Development",
    followUpDate: "2024-03-01",
    attachments: ["Curriculum Framework.pdf"],
  },
];

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  acknowledged: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  in_progress: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  overdue: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

const priorityColors = {
  low: "text-green-600 dark:text-green-400",
  medium: "text-yellow-600 dark:text-yellow-400",
  high: "text-orange-600 dark:text-orange-400",
  urgent: "text-red-600 dark:text-red-400",
};

export default function ActionLettersList() {
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredLetters = actionLetters.filter(letter => {
    const matchesFilter = filter === "all" || letter.status === filter;
    const matchesSearch = letter.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         letter.toMda.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         letter.id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xs border border-gray-200 dark:border-gray-700">
      {/* Header with Filters */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search action letters..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="acknowledged">Acknowledged</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
        </div>
      </div>

      {/* Action Letters Table */}
      <div className="overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Action Letter
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                To MDA
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Reference
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Due Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Priority
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {filteredLetters.map((letter) => (
              <tr key={letter.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-6 py-4">
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {letter.title}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {letter.id} • Decision: {letter.decision}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {letter.toMda}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {letter.reference}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {new Date(letter.dueDate).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[letter.status]}`}>
                    {letter.status.replace('_', ' ').charAt(0).toUpperCase() + letter.status.replace('_', ' ').slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className={`text-sm font-medium ${priorityColors[letter.priority]}`}>
                    {letter.priority.charAt(0).toUpperCase() + letter.priority.slice(1)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button className="text-brand-500 hover:text-brand-600 dark:text-brand-400 mr-4">
                    View
                  </button>
                  <button className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
                    Track
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredLetters.length === 0 && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No action letters found</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {searchTerm ? "Try adjusting your search terms" : "No action letters available"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}