// app/components/agenda/AgendasList.tsx
"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";

interface Agenda {
  id: string;
  name: string;
  description: string;
  status: "draft" | "published" | "finalized" | "archived" | "confirmed" | "pending" | "in_progress";
  sort_order: number;
  presenter_name: string;
  ministry_id: string | null;
  memo_id: string | null;
  cabinet_approval_required: boolean;
  meeting_id: string;
  created_at: string;
  updated_at: string;
  meeting?: {
    id: string;
    title: string;
    committee: string;
    meeting_date: string;
    type: "tier1" | "tier2" | "tier3";
  };
  ministry?: {
    id: string;
    name: string;
  };
  _count?: {
    files: number;
    annotations: number;
  };
}

const statusColors = {
  draft: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  published: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  finalized: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  archived: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
  confirmed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
};

const typeColors = {
  tier1: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  tier2: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300",
  tier3: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300",
};

const cabinetApprovalColors = {
  true: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  false: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
};

export default function AgendasList() {
  const [filter, setFilter] = useState("all");
  const [agendas, setAgendas] = useState<Agenda[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchAgendas();
  }, []);

  const fetchAgendas = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/agendas');
      const data = await response.json();
      setAgendas(data);
    } catch (error) {
      console.error('Error fetching agendas:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredAgendas = agendas.filter(agenda => {
    const matchesFilter = filter === "all" || agenda.status === filter;
    const matchesSearch = agenda.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         agenda.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         agenda.presenter_name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getMeetingInfo = (agenda: Agenda) => {
    // In real app, this would come from the meeting relation
    return agenda.meeting || {
      title: `Meeting ${agenda.meeting_id}`,
      committee: "Cabinet Office",
      meeting_date: agenda.created_at,
      type: agenda.cabinet_approval_required ? "tier2" : "tier1" as const
    };
  };

  const getMinistryName = (agenda: Agenda) => {
    return agenda.ministry?.name || (agenda.ministry_id ? "Ministry" : "General");
  };

  const getFileCount = (agenda: Agenda) => {
    return agenda._count?.files || 0;
  };

  const getAnnotationCount = (agenda: Agenda) => {
    return agenda._count?.annotations || 0;
  };

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="p-8 text-center">
          <div className="animate-pulse">Loading agendas...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="border-b border-gray-200 p-6 dark:border-gray-800">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative">
              <input
                type="text"
                placeholder="Search agendas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-11 w-full sm:w-64 rounded-lg border border-gray-300 bg-transparent pl-10 pr-3 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
              />
              <svg
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="h-11 rounded-lg border border-gray-300 bg-transparent px-3 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="finalized">Finalized</option>
              <option value="confirmed">Confirmed</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          
          <Link
            href="/agenda/create"
            className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600"
          >
            Create Agenda
          </Link>
        </div>
      </div>

      <div className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-700">
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 dark:text-gray-300">Agenda Item</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 dark:text-gray-300">Presenter</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 dark:text-gray-300">Ministry</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 dark:text-gray-300">Meeting</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 dark:text-gray-300">Type</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 dark:text-gray-300">Cabinet</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 dark:text-gray-300">Status</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 dark:text-gray-300">Files</th>
                <th className="px-6 py-4 text-right text-sm font-medium text-gray-500 dark:text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {filteredAgendas.map((agenda) => {
                const meetingInfo = getMeetingInfo(agenda);
                const ministryName = getMinistryName(agenda);
                const fileCount = getFileCount(agenda);
                const annotationCount = getAnnotationCount(agenda);
                
                return (
                  <tr key={agenda.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {agenda.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                          {agenda.description}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          Order: {agenda.sort_order}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      {agenda.presenter_name || "TBD"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {ministryName}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {meetingInfo.committee}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(meetingInfo.meeting_date).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${typeColors[meetingInfo.type]}`}>
                        {meetingInfo.type.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cabinetApprovalColors[agenda.cabinet_approval_required.toString()]}`}>
                        {agenda.cabinet_approval_required ? "Cabinet Approval" : "Standard"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[agenda.status]}`}>
                        {agenda.status.split('_').map(word => 
                          word.charAt(0).toUpperCase() + word.slice(1)
                        ).join(' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      {fileCount} files • {annotationCount} notes
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
                );
              })}
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
              {filter !== "all" || searchTerm ? "Try adjusting your filters or search term" : "Get started by creating a new agenda"}
            </p>
            {!searchTerm && filter === "all" && (
              <div className="mt-4">
                <Link
                  href="/agenda/create"
                  className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
                >
                  Create New Agenda
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}