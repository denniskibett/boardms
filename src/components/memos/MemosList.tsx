"use client";
import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import CreateMemoSlideOver from "./CreateMemoSlideOver";

interface Memo {
  id: string;
  title: string;
  summary: string;
  memo_type: string;
  priority: string;
  status: string;
  created_at: string;
  updated_at: string;
  submitting_ministry_id: number;
  ministry_name: string;
  created_by: number;
}

const statusColors = {
  draft: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
  submitted: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  under_review: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  approved: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

const priorityColors = {
  low: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
  medium: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  high: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  urgent: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

export default function MemosList() {
  const [memos, setMemos] = useState<Memo[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const { data: session } = useSession();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const handleMemoCreated = (newMemo: Memo) => {setMemos((prevMemos) => [newMemo, ...prevMemos]);
  }

  useEffect(() => {
    fetchMyMemos();
  }, [session]);

  const fetchMyMemos = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/memos/my');
      if (response.ok) {
        const data = await response.json();
        setMemos(data);
      }
    } catch (error) {
      console.error('Error fetching memos:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredMemos = memos.filter(memo => 
    filter === "all" || memo.status === filter
  );

  const getStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      draft: "Draft",
      submitted: "Submitted",
      under_review: "Under Review",
      approved: "Approved",
      rejected: "Rejected"
    };
    return labels[status] || status;
  };

  const getPriorityLabel = (priority: string) => {
    const labels: { [key: string]: string } = {
      low: "Low",
      medium: "Medium",
      high: "High",
      urgent: "Urgent"
    };
    return labels[priority] || priority;
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      {/* Header with Filters */}
      <div className="border-b border-gray-200 p-6 dark:border-gray-800">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              My Memos ({filteredMemos.length})
            </h3>
          </div>
          
          <div className="flex items-center gap-3">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="h-11 rounded-lg border border-gray-300 bg-transparent px-3 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="submitted">Submitted</option>
              <option value="under_review">Under Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Memos List */}
      <div className="p-6">
        {filteredMemos.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No memos found</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {filter === "all" ? "Get started by creating your first memo." : `No memos with ${filter} status.`}
            </p>
            {filter === "all" && (
              <div className="mt-6">
                {/* <Link
                  href="/memos/create"
                  className="inline-flex items-center rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
                >
                  Create New Memo
                </Link> */}
                {/* Slide-over Component */}
                      <CreateMemoSlideOver
                        isOpen={isCreateModalOpen}
                        onClose={() => setIsCreateModalOpen(false)}
                        onMemoCreated={handleMemoCreated}
                      />
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredMemos.map((memo) => (
              <div
                key={memo.id}
                className="flex items-center justify-between rounded-lg border border-gray-200 p-6 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50"
              >
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                        {memo.title}
                      </h4>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                        {memo.summary}
                      </p>
                      <div className="mt-3 flex items-center gap-4">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[memo.status]}`}>
                          {getStatusLabel(memo.status)}
                        </span>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${priorityColors[memo.priority]}`}>
                          {getPriorityLabel(memo.priority)}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {memo.ministry_name}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(memo.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="ml-6 flex items-center gap-2">
                  <Link
                    href={`/memos/${memo.id}`}
                    className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    View
                  </Link>
                  {memo.status === 'draft' && (
                    <Link
                      href={`/memos/${memo.id}/edit`}
                      className="rounded-lg bg-brand-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-600"
                    >
                      Edit
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}