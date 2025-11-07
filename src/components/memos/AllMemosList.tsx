"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import CreateMemoSlideOver from "./CreateMemoSlideOver";
import EditMemoSlideOver from "./EditMemoSlideOver";

interface Memo {
  id: string;
  name: string;
  summary: string;
  memo_type: string;
  priority: string;
  status: string;
  created_at: string;
  updated_at: string;
  ministry_id: number;
  state_department_id: number | null;
  agency_id: number | null;
  ministry_name: string;
  state_department_name: string | null;
  agency_name: string | null;
  created_by: number;
  creator_name: string;
  creator_email?: string;
  ministry_acronym?: string;
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

const memoTypeColors = {
  cabinet: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  interior: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300",
  treasury: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300",
  presidential: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300",
  committee: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300",
  information: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300",
  decision: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300",
};

export default function AllMemosList() {
  const [memos, setMemos] = useState<Memo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingMemoId, setEditingMemoId] = useState<string | null>(null);

  useEffect(() => {
    fetchAllMemos();
  }, []);

  const fetchAllMemos = async () => {
  try {
    setLoading(true);
    setError(null);
    console.log('Fetching memos from /api/memos...');
    
    const response = await fetch('/api/memos');
    
    if (!response.ok) {
      throw new Error(`Failed to fetch memos: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log('Fetched memos result:', result);
    
    // Access the data property from the API response
    const memosData = result.data || [];
    console.log('Number of memos received:', memosData.length);
    
    if (memosData.length > 0) {
      console.log('Sample memo structure:', memosData[0]);
    }
    
    setMemos(memosData);
  } catch (error) {
    console.error('Error fetching memos:', error);
    setError(error instanceof Error ? error.message : 'Failed to fetch memos');
  } finally {
    setLoading(false);
  }
};

  const handleEditClick = (memoId: string) => {
    console.log('Edit clicked for memo:', memoId);
    setEditingMemoId(memoId);
    setIsEditModalOpen(true);
  };

  const handleMemoUpdated = () => {
    console.log('Memo updated, refreshing list...');
    fetchAllMemos();
  };

  const handleMemoCreated = () => {
    console.log('Memo created, refreshing list...');
    fetchAllMemos();
  };

  const filteredMemos = memos.filter(memo => {
    const matchesFilter = filter === "all" || memo.status === filter;
    const matchesSearch = 
      memo.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      memo.summary?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      memo.ministry_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (memo.state_department_name && memo.state_department_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (memo.agency_name && memo.agency_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      memo.creator_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      memo.memo_type?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

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

  const getMemoTypeLabel = (memoType: string) => {
    const labels: { [key: string]: string } = {
      cabinet: "Cabinet",
      interior: "Interior",
      treasury: "Treasury",
      presidential: "Presidential",
      committee: "Committee",
      information: "Information",
      decision: "Decision"
    };
    return labels[memoType] || memoType;
  };

  const getSubmittingEntity = (memo: Memo) => {
    if (memo.agency_name) {
      return memo.agency_name;
    } else if (memo.state_department_name) {
      return memo.state_department_name;
    } else {
      return memo.ministry_name;
    }
  };

  const getEntityHierarchy = (memo: Memo) => {
    const parts = [memo.ministry_name];
    if (memo.state_department_name) parts.push(memo.state_department_name);
    if (memo.agency_name) parts.push(memo.agency_name);
    return parts.join(' • ');
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
        <div className="animate-pulse space-y-4">
          <div className="flex justify-between items-center">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          </div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
        <div className="text-center py-8">
          <div className="mx-auto h-12 w-12 text-red-500">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">Error Loading Memos</h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{error}</p>
          <button
            onClick={fetchAllMemos}
            className="mt-4 inline-flex items-center rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        {/* Header with Filters and Create Button */}
        <div className="border-b border-gray-200 p-6 dark:border-gray-800">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search memos by name, summary, ministry, or creator..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 pl-10 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 sm:w-80"
                />
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              
              {/* Stats */}
              <div className="hidden sm:flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                <span>Total: {memos.length}</span>
                <span>Showing: {filteredMemos.length}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="h-11 rounded-lg border border-gray-300 bg-transparent px-3 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
              >
                <option value="all">All Status ({memos.length})</option>
                <option value="draft">Draft ({memos.filter(m => m.status === 'draft').length})</option>
                <option value="submitted">Submitted ({memos.filter(m => m.status === 'submitted').length})</option>
                <option value="under_review">Under Review ({memos.filter(m => m.status === 'under_review').length})</option>
                <option value="approved">Approved ({memos.filter(m => m.status === 'approved').length})</option>
                <option value="rejected">Rejected ({memos.filter(m => m.status === 'rejected').length})</option>
              </select>
              <button
                onClick={fetchAllMemos}
                className="h-11 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Refresh
              </button>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="h-11 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 focus:outline-hidden focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
              >
                Create New Memo
              </button>
            </div>
          </div>
        </div>

        {/* Debug Info - Remove in production */}
        {process.env.NODE_ENV === 'development' && memos.length === 0 && (
          <div className="p-4 bg-yellow-50 border-b border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-yellow-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-sm text-yellow-700 dark:text-yellow-300">
                No memos found. Check if the API endpoint is returning data.
              </span>
            </div>
          </div>
        )}

        {/* Memos Table */}
        <div className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-700">
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 dark:text-gray-300">Memo Name</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 dark:text-gray-300">Submitting Entity</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 dark:text-gray-300">Type</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 dark:text-gray-300">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 dark:text-gray-300">Priority</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 dark:text-gray-300">Created By</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 dark:text-gray-300">Date</th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-gray-500 dark:text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {filteredMemos.map((memo) => (
                  <tr key={memo.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {memo.name || 'Untitled Memo'}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
                          {memo.summary || 'No summary available'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {getSubmittingEntity(memo) || 'Unknown Entity'}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {getEntityHierarchy(memo)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${memoTypeColors[memo.memo_type] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'}`}>
                        {getMemoTypeLabel(memo.memo_type)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[memo.status] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'}`}>
                        {getStatusLabel(memo.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${priorityColors[memo.priority] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'}`}>
                        {getPriorityLabel(memo.priority)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {memo.creator_name || 'Unknown User'}
                      </div>
                      {memo.creator_email && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {memo.creator_email}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {new Date(memo.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/memos/${memo.id}`}
                          className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                        >
                          View
                        </Link>
                        <button
                          onClick={() => handleEditClick(memo.id)}
                          className="rounded-lg border border-brand-300 bg-brand-50 px-3 py-1.5 text-sm font-medium text-brand-700 hover:bg-brand-100 dark:border-brand-700 dark:bg-brand-900/30 dark:text-brand-300 dark:hover:bg-brand-900/50"
                        >
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredMemos.length === 0 && !loading && (
            <div className="py-12 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No memos found</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {searchTerm || filter !== "all" 
                  ? "Try adjusting your search terms or filters" 
                  : "No memos have been created yet"}
              </p>
              {!searchTerm && filter === "all" && memos.length === 0 && (
                <div className="mt-4">
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="inline-flex items-center rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
                  >
                    Create Your First Memo
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Create Memo Slide-over */}
      <CreateMemoSlideOver
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onMemoCreated={handleMemoCreated}
      />

      {/* Edit Memo Slide-over - SINGLE INSTANCE OUTSIDE THE TABLE */}
      <EditMemoSlideOver
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingMemoId(null);
        }}
        onMemoUpdated={handleMemoUpdated}
        memoId={editingMemoId}
      />
    </>
  );
}