// src/components/dashboard/RecentMemos.tsx
"use client";
import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useSystemSettings } from "@/context/SystemSettingsContext";
import { useSession } from "next-auth/react";
import {
  FileText,
  Building2,
  Calendar,
  Users,
  ArrowRight,
  Eye,
  Download,
  Star,
  MoreHorizontal,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Filter,
  Search,
  RefreshCw,
  ChevronRight,
  FileCheck,
  FileWarning,
  FileX,
  FileClock,
  Loader2,
  BookOpen,
  Briefcase,
  Lock
} from "lucide-react";

interface Memo {
  id: string;
  title: string;
  ministry: string;
  department?: string;
  status: string;
  statusColor: string;
  date: string;
  assignedTo: string;
  priority: string;
  type: string;
  author: string;
  attachments: number;
  comments: number;
  requires_legal_review?: boolean;
  legal_review_status?: string;
}

interface RecentMemosProps {
  accessLevel?: string; // 'all', 'ministry_only', 'department_only', 'legal_review', 'coordination'
  ministryId?: string;
  userRole?: string;
}

// Mock data - replace with API call
const allMemos: Memo[] = [
  {
    id: "MEM-001",
    title: "Infrastructure Development Proposal",
    ministry: "Ministry of Transport",
    department: "Transport Department",
    status: "Under Review",
    statusColor: "blue",
    date: "2024-01-15",
    assignedTo: "Infrastructure Committee",
    priority: "high",
    type: "Policy",
    author: "Dr. James Kimani",
    attachments: 3,
    comments: 5,
    requires_legal_review: false,
    legal_review_status: "not_required"
  },
  {
    id: "MEM-002",
    title: "Healthcare Funding Allocation",
    ministry: "Ministry of Health",
    department: "Health Department",
    status: "Approved",
    statusColor: "green",
    date: "2024-01-14",
    assignedTo: "Social Services Committee",
    priority: "high",
    type: "Budget",
    author: "Sarah Wanjiku",
    attachments: 2,
    comments: 8,
    requires_legal_review: false,
    legal_review_status: "approved"
  },
  {
    id: "MEM-003",
    title: "Constitutional Amendment Proposal",
    ministry: "Ministry of Justice",
    department: "Legal Department",
    status: "Legal Review",
    statusColor: "purple",
    date: "2024-01-13",
    assignedTo: "Legal Committee",
    priority: "high",
    type: "Legal",
    author: "Hon. Martha Koome",
    attachments: 5,
    comments: 15,
    requires_legal_review: true,
    legal_review_status: "pending"
  },
  {
    id: "MEM-004",
    title: "Education Policy Reform",
    ministry: "Ministry of Education",
    department: "Education Department",
    status: "Pending",
    statusColor: "yellow",
    date: "2024-01-13",
    assignedTo: "Social Services Committee",
    priority: "medium",
    type: "Policy",
    author: "Prof. David Ochieng",
    attachments: 1,
    comments: 3,
    requires_legal_review: false,
    legal_review_status: "not_required"
  },
  {
    id: "MEM-005",
    title: "Energy Sector Investment",
    ministry: "Ministry of Energy",
    department: "Energy Department",
    status: "Revisions Required",
    statusColor: "red",
    date: "2024-01-12",
    assignedTo: "Infrastructure Committee",
    priority: "high",
    type: "Investment",
    author: "Eng. Michael Njoroge",
    attachments: 4,
    comments: 12,
    requires_legal_review: true,
    legal_review_status: "revisions_needed"
  },
  {
    id: "MEM-006",
    title: "Digital Transformation Strategy",
    ministry: "Ministry of ICT",
    department: "ICT Department",
    status: "Draft",
    statusColor: "gray",
    date: "2024-01-11",
    assignedTo: "ICT Committee",
    priority: "medium",
    type: "Strategy",
    author: "Dr. Grace Mwangi",
    attachments: 2,
    comments: 1,
    requires_legal_review: false,
    legal_review_status: "not_required"
  }
];

const statusConfig: { [key: string]: { color: string; icon: React.ReactNode } } = {
  blue: { 
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    icon: <Clock size={12} />
  },
  green: { 
    color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    icon: <CheckCircle2 size={12} />
  },
  yellow: { 
    color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    icon: <AlertCircle size={12} />
  },
  red: { 
    color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    icon: <XCircle size={12} />
  },
  gray: { 
    color: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
    icon: <FileText size={12} />
  },
  purple: { 
    color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
    icon: <AlertCircle size={12} />
  }
};

const priorityIcons: { [key: string]: React.ReactNode } = {
  high: <AlertCircle size={12} className="text-red-500" />,
  medium: <Clock size={12} className="text-yellow-500" />,
  low: <CheckCircle2 size={12} className="text-green-500" />
};

export default function RecentMemos({ accessLevel, ministryId, userRole: propUserRole }: RecentMemosProps) {
  const { data: session } = useSession();
  const { getPrimaryColor, getSecondaryColor } = useSystemSettings();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [hoveredMemo, setHoveredMemo] = useState<string | null>(null);
  
  // Get user role
  const userRole = propUserRole || session?.user?.role?.toLowerCase().replace(/\s+/g, '_') || '';
  
  // Filter memos based on access level
  const filteredMemosByAccess = useMemo(() => {
    let memos = [...allMemos];
    
    switch (accessLevel) {
      case 'ministry_only':
        // Cabinet Secretary - only see memos from their ministry
        if (ministryId) {
          memos = memos.filter(memo => memo.ministry.toLowerCase().replace(/\s+/g, '_') === ministryId);
        }
        break;
      case 'department_only':
        // Director, Assistant Director - only see memos from their department
        if (ministryId) {
          memos = memos.filter(memo => memo.department?.toLowerCase().replace(/\s+/g, '_') === ministryId);
        }
        break;
      case 'legal_review':
        // Attorney General - only see memos requiring legal review
        memos = memos.filter(memo => memo.requires_legal_review && memo.legal_review_status === 'pending');
        break;
      case 'coordination':
        // Co-officer - see memos needing coordination
        memos = memos.filter(memo => memo.status === 'Pending' || memo.status === 'Under Review');
        break;
      case 'all':
      default:
        // President, Deputy President, Prime CS - see all memos
        break;
    }
    
    return memos;
  }, [accessLevel, ministryId, allMemos]);

  // Apply search and status filters
  const filteredMemos = filteredMemosByAccess.filter(memo => {
    const matchesSearch = memo.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         memo.ministry.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         memo.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = !filterStatus || memo.statusColor === filterStatus;
    return matchesSearch && matchesFilter;
  });

  // Get title based on access level
  const getTitle = () => {
    switch (accessLevel) {
      case 'ministry_only':
        return 'Ministry Memos';
      case 'department_only':
        return 'Department Memos';
      case 'legal_review':
        return 'Pending Legal Reviews';
      case 'coordination':
        return 'Memos Needing Coordination';
      default:
        return 'Recent Government Memos';
    }
  };

  // Get description based on access level
  const getDescription = () => {
    switch (accessLevel) {
      case 'ministry_only':
        return `Memos from your ministry requiring attention`;
      case 'department_only':
        return `Memos from your department`;
      case 'legal_review':
        return `Memos requiring legal review and constitutional compliance checks`;
      case 'coordination':
        return `Memos needing coordination before cabinet submission`;
      default:
        return `Latest ${filteredMemosByAccess.length} memos requiring attention`;
    }
  };

  // If user has no access to memos
  if (accessLevel === 'none') {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-12 text-center">
          <Lock size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No Memo Access
          </h4>
          <p className="text-gray-500 dark:text-gray-400">
            Your role does not have permission to view memos.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-all duration-300">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ backgroundColor: getPrimaryColor() + '20' }}>
              <FileText size={20} style={{ color: getPrimaryColor() }} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {getTitle()}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {getDescription()}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search memos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-transparent focus:outline-none focus:ring-2"
                style={{ focusRingColor: getPrimaryColor() + '20' }}
              />
            </div>
            
            {/* Filter - only show for certain access levels */}
            {accessLevel !== 'legal_review' && (
              <div className="relative">
                <select
                  onChange={(e) => setFilterStatus(e.target.value || null)}
                  className="pl-4 pr-8 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-transparent appearance-none focus:outline-none focus:ring-2"
                  style={{ focusRingColor: getPrimaryColor() + '20' }}
                >
                  <option value="">All Status</option>
                  <option value="blue">Under Review</option>
                  <option value="green">Approved</option>
                  <option value="yellow">Pending</option>
                  <option value="red">Revisions</option>
                  <option value="gray">Draft</option>
                  <option value="purple">Legal Review</option>
                </select>
                <Filter size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
            )}
            
            <Link
              href="/memos"
              className="px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2 transition-all hover:gap-3"
              style={{ 
                backgroundColor: getPrimaryColor(),
                color: 'white'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = getSecondaryColor();
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = getPrimaryColor();
              }}
            >
              View All
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>

      {/* Memos List */}
      <div className="divide-y divide-gray-100 dark:divide-gray-700">
        {filteredMemos.length === 0 ? (
          <div className="p-12 text-center">
            <FileText size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No memos found</p>
          </div>
        ) : (
          filteredMemos.map((memo) => {
            const isHovered = hoveredMemo === memo.id;
            
            return (
              <div
                key={memo.id}
                className="relative p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-200"
                onMouseEnter={() => setHoveredMemo(memo.id)}
                onMouseLeave={() => setHoveredMemo(null)}
                style={{
                  borderLeft: isHovered ? `3px solid ${getPrimaryColor()}` : '3px solid transparent'
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Title and Status Row */}
                    <div className="flex items-center gap-3 mb-3 flex-wrap">
                      <h4 className="text-base font-semibold text-gray-900 dark:text-white truncate">
                        {memo.title}
                      </h4>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full flex items-center gap-1 ${statusConfig[memo.statusColor].color}`}
                        >
                          {statusConfig[memo.statusColor].icon}
                          {memo.status}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                          {priorityIcons[memo.priority]}
                          {memo.priority}
                        </span>
                        {memo.requires_legal_review && memo.legal_review_status === 'pending' && (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300 flex items-center gap-1">
                            <AlertCircle size={12} />
                            Legal Review Required
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Metadata Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <FileText size={12} />
                        <span className="font-medium">{memo.id}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Building2 size={12} />
                        <span className="truncate">{memo.ministry}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Calendar size={12} />
                        <span>{new Date(memo.date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Briefcase size={12} />
                        <span>{memo.type}</span>
                      </div>
                    </div>
                    
                    {/* Assignment and Stats */}
                    <div className="flex items-center gap-4 mt-3 flex-wrap">
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500">
                        <Users size={12} />
                        <span>Assigned to: {memo.assignedTo}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500">
                        <span>By: {memo.author}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500">
                        <FileText size={12} />
                        <span>{memo.attachments}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500">
                        <BookOpen size={12} />
                        <span>{memo.comments} comments</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    <button className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                      <Eye size={16} />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                      <Download size={16} />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                      <Star size={16} />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                      <MoreHorizontal size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-4 text-gray-500 dark:text-gray-400">
            <span>Showing {filteredMemos.length} of {filteredMemosByAccess.length} memos</span>
            <button className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300">
              <RefreshCw size={12} />
              Refresh
            </button>
          </div>
          <button className="flex items-center gap-1 text-brand-500 hover:text-brand-600">
            Load More
            <ChevronRight size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}