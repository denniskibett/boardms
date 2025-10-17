// app/components/memos/AllMemosList.tsx - UPDATED
"use client";
import React, { useState } from "react";

const mockAllMemos = [
  {
    id: "MEM-001",
    title: "Infrastructure Development Proposal for Northern Corridor",
    ministry: "Ministry of Transport",
    status: "under_review",
    statusText: "Under Review",
    committee: "Infrastructure & Energy",
    createdAt: "2024-01-15",
    priority: "high",
    submittedBy: "John Kamau",
  },
  {
    id: "MEM-002",
    title: "Healthcare Funding Allocation Q1 2024",
    ministry: "Ministry of Health",
    status: "approved",
    statusText: "Approved",
    committee: "Social Services",
    createdAt: "2024-01-10",
    priority: "medium",
    submittedBy: "Dr. Sarah Mwangi",
  },
  {
    id: "MEM-006",
    title: "Agricultural Subsidy Program",
    ministry: "Ministry of Agriculture",
    status: "submitted",
    statusText: "Submitted",
    committee: "National Development",
    createdAt: "2024-01-17",
    priority: "high",
    submittedBy: "Peter Njeru",
  },
  {
    id: "MEM-007",
    title: "Digital Transformation Strategy",
    ministry: "Ministry of ICT",
    status: "draft",
    statusText: "Draft",
    committee: "Infrastructure & Energy",
    createdAt: "2024-01-16",
    priority: "medium",
    submittedBy: "Grace Omondi",
  },
];

// Add the missing statusColors constant
const statusColors = {
  draft: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
  submitted: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  under_review: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  revisions: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  approved: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

export default function AllMemosList() {
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredMemos = mockAllMemos.filter(memo => {
    const matchesFilter = filter === "all" || memo.status === filter;
    const matchesSearch = memo.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         memo.ministry.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         memo.id.toLowerCase().includes(searchTerm.toLowerCase());
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
                placeholder="Search all memos..."
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
              <option value="draft">Draft</option>
              <option value="submitted">Submitted</option>
              <option value="under_review">Under Review</option>
              <option value="approved">Approved</option>
            </select>
          </div>
        </div>
      </div>

      {/* Memos Table */}
      <div className="overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Memo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Ministry
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Submitted By
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Committee
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {filteredMemos.map((memo) => (
              <tr key={memo.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-6 py-4">
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {memo.title}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {memo.id}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {memo.ministry}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {memo.submittedBy}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {memo.committee}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[memo.status]}`}>
                    {memo.statusText}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {new Date(memo.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button className="text-brand-500 hover:text-brand-600 dark:text-brand-400">
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredMemos.length === 0 && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No memos found</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {searchTerm ? "Try adjusting your search terms" : "No memos available"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}