// app/components/decisions/DecisionsList.tsx
"use client";
import React, { useState } from "react";

const decisions = [
  {
    id: "DEC-001",
    title: "Approval of Infrastructure Development Plan",
    memo: "MEM-001 - Infrastructure Development Proposal",
    committee: "Infrastructure & Energy",
    decisionDate: "2024-01-12",
    status: "implemented",
    implementationDeadline: "2024-06-30",
    responsibleMinistry: "Ministry of Transport",
  },
  {
    id: "DEC-002",
    title: "Healthcare Funding Allocation Approved",
    memo: "MEM-002 - Healthcare Funding Allocation",
    committee: "Social Services",
    decisionDate: "2024-01-10",
    status: "in_progress",
    implementationDeadline: "2024-03-31",
    responsibleMinistry: "Ministry of Health",
  },
  {
    id: "DEC-003",
    title: "Education Policy Reform Framework Endorsed",
    memo: "MEM-003 - Education Policy Reform",
    committee: "Social Services",
    decisionDate: "2024-01-15",
    status: "pending",
    implementationDeadline: "2024-12-31",
    responsibleMinistry: "Ministry of Education",
  },
];

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  implemented: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  delayed: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

export default function DecisionsList() {
  const [filter, setFilter] = useState("all");

  const filteredDecisions = decisions.filter(decision => 
    filter === "all" || decision.status === filter
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
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="implemented">Implemented</option>
              <option value="delayed">Delayed</option>
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Decision
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Source Memo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Committee
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Decision Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Responsible Ministry
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {filteredDecisions.map((decision) => (
              <tr key={decision.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-6 py-4">
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {decision.title}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {decision.id}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {decision.memo}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {decision.committee}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {new Date(decision.decisionDate).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[decision.status]}`}>
                    {decision.status.replace('_', ' ').charAt(0).toUpperCase() + decision.status.replace('_', ' ').slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {decision.responsibleMinistry}
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

        {filteredDecisions.length === 0 && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No decisions found</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {filter !== "all" ? "Try adjusting your filter" : "No cabinet decisions available"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}