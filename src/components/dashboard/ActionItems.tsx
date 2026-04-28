"use client";
import React, { useState } from "react";
import { useSystemSettings } from "@/context/SystemSettingsContext";
import {
  CheckSquare,
  AlertCircle,
  Clock,
  Calendar,
  Building2,
  User,
  Flag,
  MoreVertical,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  Filter,
  SortAsc,
  SortDesc,
  RefreshCw,
  Plus,
  Edit,
  Trash2,
  Eye,
  ChevronRight,
  Loader2,
  BarChart4,
  TrendingUp,
  Users,
  Briefcase,
  Tag,
  Target
} from "lucide-react";

const actionItems = [
  {
    id: 1,
    title: "Implement Healthcare Funding",
    ministry: "Ministry of Health",
    dueDate: "2024-02-15",
    priority: "high",
    status: "in-progress",
    assignedBy: "Cabinet Secretary",
    progress: 65,
    category: "Healthcare",
    dependencies: 2
  },
  {
    id: 2,
    title: "Review Education Policy Draft",
    ministry: "Ministry of Education",
    dueDate: "2024-01-25",
    priority: "medium",
    status: "pending",
    assignedBy: "Principal Secretary",
    progress: 30,
    category: "Education",
    dependencies: 1
  },
  {
    id: 3,
    title: "Infrastructure Tender Process",
    ministry: "Ministry of Transport",
    dueDate: "2024-03-01",
    priority: "high",
    status: "not-started",
    assignedBy: "Director General",
    progress: 0,
    category: "Infrastructure",
    dependencies: 3
  },
  {
    id: 4,
    title: "Energy Sector Report",
    ministry: "Ministry of Energy",
    dueDate: "2024-01-30",
    priority: "low",
    status: "completed",
    assignedBy: "Chief Officer",
    progress: 100,
    category: "Energy",
    dependencies: 0
  },
  {
    id: 5,
    title: "Digital Transformation Strategy",
    ministry: "Ministry of ICT",
    dueDate: "2024-02-28",
    priority: "medium",
    status: "in-progress",
    assignedBy: "ICT Authority",
    progress: 45,
    category: "Technology",
    dependencies: 1
  }
];

const priorityConfig: { [key: string]: { color: string; icon: React.ReactNode; label: string } } = {
  high: { 
    color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    icon: <AlertTriangle size={12} />,
    label: "High Priority"
  },
  medium: { 
    color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    icon: <Clock size={12} />,
    label: "Medium Priority"
  },
  low: { 
    color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    icon: <CheckCircle2 size={12} />,
    label: "Low Priority"
  },
};

const statusConfig: { [key: string]: { color: string; icon: React.ReactNode } } = {
  "not-started": { 
    color: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
    icon: <XCircle size={12} />
  },
  "in-progress": { 
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    icon: <Clock size={12} />
  },
  "pending": { 
    color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
    icon: <AlertCircle size={12} />
  },
  "completed": { 
    color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    icon: <CheckCircle2 size={12} />
  },
};

export default function ActionItems() {
  const { getPrimaryColor, getSecondaryColor } = useSystemSettings();
  const [filterPriority, setFilterPriority] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'dueDate' | 'priority' | 'progress'>('dueDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [expandedItem, setExpandedItem] = useState<number | null>(null);

  // Calculate stats
  const totalItems = actionItems.length;
  const completedItems = actionItems.filter(item => item.status === 'completed').length;
  const inProgressItems = actionItems.filter(item => item.status === 'in-progress').length;
  const highPriorityItems = actionItems.filter(item => item.priority === 'high').length;

  // Sort and filter items
  const filteredItems = actionItems
    .filter(item => !filterPriority || item.priority === filterPriority)
    .filter(item => !filterStatus || item.status === filterStatus)
    .sort((a, b) => {
      if (sortBy === 'dueDate') {
        return sortOrder === 'asc' 
          ? new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
          : new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime();
      }
      if (sortBy === 'priority') {
        const priorityWeight = { high: 3, medium: 2, low: 1 };
        return sortOrder === 'asc'
          ? priorityWeight[a.priority] - priorityWeight[b.priority]
          : priorityWeight[b.priority] - priorityWeight[a.priority];
      }
      if (sortBy === 'progress') {
        return sortOrder === 'asc'
          ? a.progress - b.progress
          : b.progress - a.progress;
      }
      return 0;
    });

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-all duration-300">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ backgroundColor: getPrimaryColor() + '20' }}>
              <CheckSquare size={20} style={{ color: getPrimaryColor() }} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Action Items
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Track and manage pending tasks
              </p>
            </div>
          </div>
          
          <button 
            className="p-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-all hover:scale-105"
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
            <Plus size={16} />
            New Action
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-3">
          <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/30 border border-gray-100 dark:border-gray-700">
            <div className="text-xl font-bold text-gray-900 dark:text-white">{totalItems}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
              <Target size={12} />
              Total Actions
            </div>
          </div>
          <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/30 border border-gray-100 dark:border-gray-700">
            <div className="text-xl font-bold text-green-500">{completedItems}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
              <CheckCircle2 size={12} />
              Completed
            </div>
          </div>
          <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/30 border border-gray-100 dark:border-gray-700">
            <div className="text-xl font-bold text-blue-500">{inProgressItems}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
              <Clock size={12} />
              In Progress
            </div>
          </div>
          <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/30 border border-gray-100 dark:border-gray-700">
            <div className="text-xl font-bold text-red-500">{highPriorityItems}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
              <AlertTriangle size={12} />
              High Priority
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Sort */}
      <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700/30 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">Filter:</span>
            
            {/* Priority Filter */}
            <select
              onChange={(e) => setFilterPriority(e.target.value || null)}
              className="px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-700 rounded-lg bg-transparent focus:outline-none focus:ring-2"
              style={{ focusRingColor: getPrimaryColor() + '20' }}
            >
              <option value="">All Priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            
            {/* Status Filter */}
            <select
              onChange={(e) => setFilterStatus(e.target.value || null)}
              className="px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-700 rounded-lg bg-transparent focus:outline-none focus:ring-2"
              style={{ focusRingColor: getPrimaryColor() + '20' }}
            >
              <option value="">All Status</option>
              <option value="not-started">Not Started</option>
              <option value="in-progress">In Progress</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">Sort by:</span>
            
            {/* Sort Options */}
            <button
              onClick={() => setSortBy('dueDate')}
              className={`px-3 py-1.5 text-xs rounded-lg flex items-center gap-1 ${
                sortBy === 'dueDate' 
                  ? 'bg-brand-500 text-white' 
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              <Calendar size={12} />
              Due Date
            </button>
            
            <button
              onClick={() => setSortBy('priority')}
              className={`px-3 py-1.5 text-xs rounded-lg flex items-center gap-1 ${
                sortBy === 'priority' 
                  ? 'bg-brand-500 text-white' 
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              <Flag size={12} />
              Priority
            </button>
            
            <button
              onClick={() => setSortBy('progress')}
              className={`px-3 py-1.5 text-xs rounded-lg flex items-center gap-1 ${
                sortBy === 'progress' 
                  ? 'bg-brand-500 text-white' 
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              <TrendingUp size={12} />
              Progress
            </button>
            
            <button
              onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
              className="p-1.5 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
            >
              {sortOrder === 'asc' ? <SortAsc size={14} /> : <SortDesc size={14} />}
            </button>
          </div>
        </div>
      </div>

      {/* Action Items List */}
      <div className="divide-y divide-gray-100 dark:divide-gray-700">
        {filteredItems.length === 0 ? (
          <div className="p-12 text-center">
            <CheckSquare size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No action items found</p>
          </div>
        ) : (
          filteredItems.map((item) => {
            const isExpanded = expandedItem === item.id;
            const daysUntilDue = Math.ceil((new Date(item.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
            const isOverdue = daysUntilDue < 0;
            
            return (
              <div
                key={item.id}
                className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-200"
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Main Content */}
                  <div className="flex-1">
                    {/* Title and Status Row */}
                    <div className="flex items-center gap-3 mb-3">
                      <h4 className="text-base font-semibold text-gray-900 dark:text-white">
                        {item.title}
                      </h4>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full flex items-center gap-1 ${statusConfig[item.status].color}`}
                      >
                        {statusConfig[item.status].icon}
                        {item.status.replace('-', ' ')}
                      </span>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full flex items-center gap-1 ${priorityConfig[item.priority].color}`}
                        title={priorityConfig[item.priority].label}
                      >
                        {priorityConfig[item.priority].icon}
                        {item.priority}
                      </span>
                    </div>
                    
                    {/* Metadata */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs mb-3">
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Building2 size={12} />
                        <span className="truncate">{item.ministry}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <User size={12} />
                        <span>{item.assignedBy}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Tag size={12} />
                        <span>{item.category}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Calendar size={12} />
                        <span className={isOverdue ? 'text-red-500 font-medium' : ''}>
                          Due: {new Date(item.dueDate).toLocaleDateString()}
                          {isOverdue && ` (${Math.abs(daysUntilDue)} days overdue)`}
                        </span>
                      </div>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500 dark:text-gray-400">Progress</span>
                        <span className="font-medium" style={{ color: getPrimaryColor() }}>
                          {item.progress}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="h-1.5 rounded-full transition-all duration-500"
                          style={{ 
                            width: `${item.progress}%`,
                            backgroundColor: item.progress === 100 ? '#10b981' : getPrimaryColor()
                          }}
                        />
                      </div>
                    </div>
                    
                    {/* Dependencies */}
                    {item.dependencies > 0 && (
                      <div className="mt-3 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <AlertCircle size={12} />
                        <span>{item.dependencies} pending {item.dependencies === 1 ? 'dependency' : 'dependencies'}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex flex-col gap-2">
                    <button className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                      <Eye size={16} />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                      <Edit size={16} />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                      <MoreVertical size={16} />
                    </button>
                  </div>
                </div>
                
                {/* Expandable Details */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <h5 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Details</h5>
                        <p className="text-gray-600 dark:text-gray-400">
                          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore.
                        </p>
                      </div>
                      <div>
                        <h5 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Timeline</h5>
                        <div className="space-y-1 text-gray-600 dark:text-gray-400">
                          <div className="flex justify-between">
                            <span>Created:</span>
                            <span>Jan 15, 2024</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Started:</span>
                            <span>Jan 20, 2024</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Last Updated:</span>
                            <span>Jan 22, 2024</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Expand/Collapse Button */}
                <button
                  onClick={() => setExpandedItem(isExpanded ? null : item.id)}
                  className="mt-2 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 flex items-center gap-1"
                >
                  {isExpanded ? 'Show less' : 'Show more'}
                  <ChevronRight size={12} className={isExpanded ? 'rotate-90' : ''} />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-4 text-gray-500 dark:text-gray-400">
            <span>Showing {filteredItems.length} of {actionItems.length} action items</span>
            <button className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300">
              <RefreshCw size={12} />
              Refresh
            </button>
          </div>
          <button className="flex items-center gap-1 text-brand-500 hover:text-brand-600">
            View All Actions
            <ArrowRight size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}