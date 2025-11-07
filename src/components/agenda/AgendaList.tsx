// app/components/agendas/AgendasList.tsx
"use client";
import React, { useState } from "react";
import Link from "next/link";

const agendas = [
  {
    id: "1",
    title: "Infrastructure Committee - January 2024",
    committee: "Infrastructure & Energy",
    meetingDate: "2024-01-18",
    status: "draft",
    type: "tier1",
    items: 5,
    documents: 3,
    createdBy: "Secretariat Office",
  },
  {
    id: "2",
    title: "Cabinet Meeting Agenda - Q1 Review",
    committee: "Full Cabinet",
    meetingDate: "2024-01-25",
    status: "published",
    type: "tier2",
    items: 12,
    documents: 8,
    createdBy: "Cabinet Office",
  },
  {
    id: "3",
    title: "Budget Committee - FY2024/25",
    committee: "Budget & Finance",
    meetingDate: "2024-01-20",
    status: "finalized",
    type: "tier1",
    items: 7,
    documents: 4,
    createdBy: "Treasury Department",
  },
];

const statusColors = {
  draft: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  published: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  finalized: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  archived: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
};

const typeColors = {
  tier1: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  tier2: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300",
};

export default function AgendasList() {
  const [filter, setFilter] = useState("all");

  const filteredAgendas = agendas.filter(agenda => 
    filter === "all" || agenda.status === filter
  );

  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="border-b border-gray-200 p-6 dark:border-gray-800">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="h-11 rounded-lg border border-gray-300 bg-transparent px-3 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="finalized">Finalized</option>
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-700">
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 dark:text-gray-300">Agenda</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 dark:text-gray-300">Committee</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 dark:text-gray-300">Meeting Date</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 dark:text-gray-300">Type</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 dark:text-gray-300">Status</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 dark:text-gray-300">Items</th>
                <th className="px-6 py-4 text-right text-sm font-medium text-gray-500 dark:text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {filteredAgendas.map((agenda) => (
                <tr key={agenda.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {agenda.title}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        by {agenda.createdBy}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    {agenda.committee}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {new Date(agenda.meetingDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${typeColors[agenda.type]}`}>
                      {agenda.type.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[agenda.status]}`}>
                      {agenda.status.charAt(0).toUpperCase() + agenda.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    {agenda.items} items • {agenda.documents} docs
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/agenda/${agenda.id}`}
                        className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                      >
                        View
                      </Link>
                      <Link
                        href={`/agenda/${agenda.id}/book`}
                        className="rounded-lg bg-brand-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-600"
                      >
                        Book
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredAgendas.length === 0 && (
          <div className="py-12 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No agendas found</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {filter !== "all" ? "Try adjusting your filter" : "Get started by creating a new agenda"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}