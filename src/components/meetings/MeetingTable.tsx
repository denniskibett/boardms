// src/components/meetings/MeetingTable.tsx
"use client";
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from "next/link";
import { useSystemSettings } from "@/context/SystemSettingsContext";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  FileText,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Download,
  Printer,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  SortAsc,
  SortDesc
} from "lucide-react";

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
  created_at?: string;
  updated_at?: string;
}

interface MeetingTableProps {
  meetings?: Meeting[];
  loading?: boolean;
  onRefresh?: () => void;
  onEdit?: (meeting: Meeting) => void;
}

type SortField = 'name' | 'type' | 'start_at' | 'location' | 'status' | 'committee';
type SortOrder = 'asc' | 'desc';

export default function MeetingTable({ meetings: propMeetings, loading = false, onRefresh, onEdit }: MeetingTableProps) {
  const { getPrimaryColor } = useSystemSettings();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('start_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  // Use provided meetings
  useEffect(() => {
    if (propMeetings) {
      setMeetings(propMeetings);
    }
  }, [propMeetings]);

  // Get unique types and statuses for filters
  const uniqueTypes = useMemo(() => {
    return [...new Set(meetings.map(m => m.type))];
  }, [meetings]);

  const uniqueStatuses = useMemo(() => {
    return [...new Set(meetings.map(m => m.status))];
  }, [meetings]);

  // Filter meetings
  const filteredMeetings = useMemo(() => {
    return meetings.filter(meeting => {
      const matchesSearch = meeting.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           meeting.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (meeting.committee?.toLowerCase() || '').includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || meeting.status === statusFilter;
      const matchesType = typeFilter === 'all' || meeting.type === typeFilter;
      
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [meetings, searchTerm, statusFilter, typeFilter]);

  // Sort meetings
  const sortedMeetings = useMemo(() => {
    return [...filteredMeetings].sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      if (sortField === 'start_at') {
        aValue = new Date(a.start_at).getTime();
        bValue = new Date(b.start_at).getTime();
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredMeetings, sortField, sortOrder]);

  // Pagination
  const totalPages = useMemo(() => {
    return Math.ceil(sortedMeetings.length / itemsPerPage);
  }, [sortedMeetings.length, itemsPerPage]);

  const paginatedMeetings = useMemo(() => {
    return sortedMeetings.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
  }, [sortedMeetings, currentPage, itemsPerPage]);

  const handleSort = useCallback((field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  }, [sortField]);

  // Handle select all
  useEffect(() => {
    if (selectAll) {
      setSelectedRows(paginatedMeetings.map(m => m.id));
    } else {
      if (selectedRows.length > 0 && selectedRows.length === paginatedMeetings.length) {
        setSelectedRows([]);
      }
    }
  }, [selectAll, paginatedMeetings]);

  const toggleRowSelection = useCallback((id: string) => {
    setSelectedRows(prev => {
      if (prev.includes(id)) {
        return prev.filter(rowId => rowId !== id);
      } else {
        return [...prev, id];
      }
    });
    if (selectAll) {
      setSelectAll(false);
    }
  }, [selectAll]);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    setSelectedRows([]);
    setSelectAll(false);
    setOpenDropdownId(null);
  }, []);

  const formatDate = useCallback((dateString: string) => {
    try {
      const date = new Date(dateString);
      return {
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        full: date.toLocaleString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric',
          hour: '2-digit', 
          minute: '2-digit' 
        })
      };
    } catch {
      return { date: 'Invalid', time: 'Invalid', full: 'Invalid' };
    }
  }, []);

  const getStatusBadge = useCallback((status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('scheduled') || statusLower.includes('upcoming')) {
      return { bg: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300', icon: <Calendar size={12} /> };
    } else if (statusLower.includes('in progress') || statusLower.includes('ongoing')) {
      return { bg: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300', icon: <Clock size={12} /> };
    } else if (statusLower.includes('completed') || statusLower.includes('done')) {
      return { bg: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300', icon: <CheckCircle size={12} /> };
    } else if (statusLower.includes('cancelled')) {
      return { bg: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300', icon: <XCircle size={12} /> };
    } else {
      return { bg: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300', icon: <AlertCircle size={12} /> };
    }
  }, []);

  if (loading && meetings.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-600 dark:text-gray-400">Loading meetings...</span>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Table Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-wrap items-center gap-3">
          {/* Left side */}
          <div className="flex items-center gap-3 flex-1">
            <div className="p-2 rounded-lg" style={{ backgroundColor: getPrimaryColor() + '20' }}>
              <FileText size={20} style={{ color: getPrimaryColor() }} />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {filteredMeetings.length} meetings
              </span>
              
              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-transparent focus:outline-none focus:ring-2 min-w-[120px]"
              >
                <option value="all">All Status</option>
                {uniqueStatuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>

              {/* Type Filter */}
              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-transparent focus:outline-none focus:ring-2 min-w-[120px]"
              >
                <option value="all">All Types</option>
                {uniqueTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>

              {/* Items Per Page */}
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-transparent focus:outline-none focus:ring-2"
              >
                <option value="10">10/page</option>
                <option value="25">25/page</option>
                <option value="50">50/page</option>
                <option value="100">100/page</option>
              </select>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search meetings..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9 pr-4 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-transparent focus:outline-none focus:ring-2 w-64"
              />
            </div>

            {/* Action Buttons */}
            <button 
              onClick={onRefresh}
              className="p-1.5 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              title="Refresh"
            >
              <RefreshCw size={16} />
            </button>
            <button className="p-1.5 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700" title="Export">
              <Download size={16} />
            </button>
            <button className="p-1.5 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700" title="Print">
              <Printer size={16} />
            </button>
          </div>
        </div>

        {/* Selected Rows Bar */}
        {selectedRows.length > 0 && (
          <div className="mt-3 flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <span className="text-sm text-blue-700 dark:text-blue-300">
              {selectedRows.length} meeting{selectedRows.length > 1 ? 's' : ''} selected
            </span>
            <button className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600">
              Delete
            </button>
            <button className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600">
              Bulk Edit
            </button>
            <button 
              className="ml-auto text-xs text-blue-700 dark:text-blue-300 hover:underline"
              onClick={() => {
                setSelectedRows([]);
                setSelectAll(false);
              }}
            >
              Clear selection
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-700/50 border-y border-gray-200 dark:border-gray-700">
            <tr>
              <th className="px-4 py-3 text-left w-10">
                <input
                  type="checkbox"
                  checked={selectAll && paginatedMeetings.length > 0}
                  onChange={(e) => setSelectAll(e.target.checked)}
                  className="rounded border-gray-300 text-brand-500 focus:ring-brand-500 dark:border-gray-600"
                />
              </th>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort('name')}
                  className="flex items-center gap-1 font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                >
                  Meeting
                  {sortField === 'name' && (
                    sortOrder === 'asc' ? <SortAsc size={14} /> : <SortDesc size={14} />
                  )}
                </button>
              </th>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort('type')}
                  className="flex items-center gap-1 font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                >
                  Type
                  {sortField === 'type' && (
                    sortOrder === 'asc' ? <SortAsc size={14} /> : <SortDesc size={14} />
                  )}
                </button>
              </th>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort('start_at')}
                  className="flex items-center gap-1 font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                >
                  Date & Time
                  {sortField === 'start_at' && (
                    sortOrder === 'asc' ? <SortAsc size={14} /> : <SortDesc size={14} />
                  )}
                </button>
              </th>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort('location')}
                  className="flex items-center gap-1 font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                >
                  Location
                  {sortField === 'location' && (
                    sortOrder === 'asc' ? <SortAsc size={14} /> : <SortDesc size={14} />
                  )}
                </button>
              </th>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort('committee')}
                  className="flex items-center gap-1 font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                >
                  Committee
                  {sortField === 'committee' && (
                    sortOrder === 'asc' ? <SortAsc size={14} /> : <SortDesc size={14} />
                  )}
                </button>
              </th>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort('status')}
                  className="flex items-center gap-1 font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                >
                  Status
                  {sortField === 'status' && (
                    sortOrder === 'asc' ? <SortAsc size={14} /> : <SortDesc size={14} />
                  )}
                </button>
              </th>
              <th className="px-4 py-3 text-left">Attendees</th>
              <th className="px-4 py-3 text-right w-20">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {paginatedMeetings.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center">
                  <Calendar size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">No meetings found</p>
                </td>
              </tr>
            ) : (
              paginatedMeetings.map((meeting) => {
                const formattedDate = formatDate(meeting.start_at);
                const statusBadge = getStatusBadge(meeting.status);
                
                return (
                  <tr 
                    key={meeting.id} 
                    className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                      selectedRows.includes(meeting.id) ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedRows.includes(meeting.id)}
                        onChange={() => toggleRowSelection(meeting.id)}
                        className="rounded border-gray-300 text-brand-500 focus:ring-brand-500 dark:border-gray-600"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/meetings/${meeting.id}`} className="block group">
                        <div className="font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                          {meeting.name}
                        </div>
                        {meeting.description && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[200px]">
                            {meeting.description}
                          </div>
                        )}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span 
                        className="px-2 py-1 text-xs font-medium text-white rounded-full"
                        style={{ backgroundColor: meeting.colour || getPrimaryColor() }}
                      >
                        {meeting.type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-900 dark:text-white">
                          {formattedDate.date}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                          <Clock size={10} />
                          {formattedDate.time}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-sm text-gray-700 dark:text-gray-300">
                        <MapPin size={14} className="text-gray-400" />
                        <span className="truncate max-w-[120px]">{meeting.location}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      {meeting.committee || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full inline-flex items-center gap-1 ${statusBadge.bg}`}>
                        {statusBadge.icon}
                        <span className="truncate max-w-[80px]">{meeting.status}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {meeting.attendees_count ? (
                        <div className="flex items-center gap-1 text-sm text-gray-700 dark:text-gray-300">
                          <Users size={14} className="text-gray-400" />
                          {meeting.attendees_count}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/meetings/${meeting.id}`}
                          className="p-1.5 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                          title="View"
                        >
                          <Eye size={16} />
                        </Link>
                        <button
                          onClick={() => onEdit && onEdit(meeting)}
                          className="p-1.5 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                          title="Edit"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => setOpenDropdownId(openDropdownId === meeting.id ? null : meeting.id)}
                          className="p-1.5 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                          title="More actions"
                        >
                          <MoreHorizontal size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, sortedMeetings.length)} of {sortedMeetings.length} meetings
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handlePageChange(1)}
            disabled={currentPage === 1}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronsLeft size={16} />
          </button>
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="px-3 py-1 text-sm text-gray-700 dark:text-gray-300">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight size={16} />
          </button>
          <button
            onClick={() => handlePageChange(totalPages)}
            disabled={currentPage === totalPages}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronsRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}