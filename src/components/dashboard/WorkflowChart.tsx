"use client";
import React, { useState } from "react";
import { useSystemSettings } from "@/context/SystemSettingsContext";
import {
  BarChart3,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  PieChart,
  Layers,
  ArrowUp,
  ArrowDown,
  Activity,
  Eye,
  Info,
  Download,
  Calendar,
  Filter,
  RefreshCw,
  Loader2,
  Users,  // ✅ Import Users directly from lucide-react
  BookOpen,
  Briefcase,
  Target
} from "lucide-react";

export default function WorkflowChart() {
  const { getPrimaryColor, getSecondaryColor } = useSystemSettings();
  const [viewMode, setViewMode] = useState<'percentage' | 'count'>('percentage');
  const [hoveredStage, setHoveredStage] = useState<string | null>(null);
  
  const workflowData = [
    { stage: "Draft", count: 8, color: "bg-gray-400", icon: <FileText size={14} />, description: "Memos in initial draft stage" },
    { stage: "Submitted", count: 12, color: "bg-blue-500", icon: <Clock size={14} />, description: "Memos submitted for review" },
    { stage: "Committee Review", count: 6, color: "bg-yellow-500", icon: <Users size={14} />, description: "Under committee evaluation" },
    { stage: "Cabinet Review", count: 4, color: "bg-purple-500", icon: <Activity size={14} />, description: "Cabinet level review" },
    { stage: "Approved", count: 23, color: "bg-green-500", icon: <CheckCircle2 size={14} />, description: "Approved memos" },
    { stage: "Implemented", count: 18, color: "bg-teal-500", icon: <TrendingUp size={14} />, description: "Successfully implemented" },
  ];
  
  const total = workflowData.reduce((sum, item) => sum + item.count, 0);
  
  // Calculate trends (mock data - in real app would come from API)
  const trends = {
    draft: { value: '+12%', direction: 'up' },
    submitted: { value: '+8%', direction: 'up' },
    approved: { value: '+5%', direction: 'up' },
    implemented: { value: '+15%', direction: 'up' }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-xl transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg" style={{ backgroundColor: getPrimaryColor() + '20' }}>
            <BarChart3 size={20} style={{ color: getPrimaryColor() }} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Workflow Overview
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Current memo distribution across stages
            </p>
          </div>
        </div>
        
        {/* View Toggle and Actions */}
        <div className="flex items-center gap-2">
          <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setViewMode('percentage')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                viewMode === 'percentage'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              %
            </button>
            <button
              onClick={() => setViewMode('count')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                viewMode === 'count'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              #
            </button>
          </div>
          
          <button className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-700">
          <div className="text-2xl font-bold" style={{ color: getPrimaryColor() }}>
            {total}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
            <Layers size={12} />
            Total Memos
          </div>
        </div>
        <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-700">
          <div className="text-2xl font-bold" style={{ color: getSecondaryColor() }}>
            {workflowData[4].count + workflowData[5].count}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
            <CheckCircle2 size={12} />
            Completed
          </div>
        </div>
        <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-700">
          <div className="text-2xl font-bold text-amber-500">
            {workflowData[2].count + workflowData[3].count}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
            <Clock size={12} />
            In Review
          </div>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="space-y-4">
        {workflowData.map((item, index) => {
          const percentage = (item.count / total) * 100;
          const isHovered = hoveredStage === item.stage;
          
          return (
            <div 
              key={index} 
              className="relative group"
              onMouseEnter={() => setHoveredStage(item.stage)}
              onMouseLeave={() => setHoveredStage(null)}
            >
              <div className="flex items-center gap-4">
                {/* Stage Label with Icon */}
                <div className="w-32 flex items-center gap-2">
                  <div className="p-1 rounded" style={{ backgroundColor: item.color.replace('bg-', '') + '20' }}>
                    {item.icon}
                  </div>
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {item.stage}
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="flex-1">
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                    <span className="flex items-center gap-1">
                      {item.count} memos
                      {isHovered && (
                        <span className="text-gray-400 text-[10px] animate-fadeIn">
                          {item.description}
                        </span>
                      )}
                    </span>
                    <span className="font-medium" style={{ color: getPrimaryColor() }}>
                      {viewMode === 'percentage' ? `${percentage.toFixed(1)}%` : item.count}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-2.5 rounded-full transition-all duration-500 ease-out ${item.color} relative`}
                      style={{ 
                        width: `${percentage}%`,
                        boxShadow: isHovered ? `0 0 8px ${item.color.replace('bg-', '')}` : 'none'
                      }}
                    >
                      {percentage > 5 && (
                        <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Trend Indicators */}
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
            <TrendingUp size={16} />
            Weekly Trends
          </h4>
          <button className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 flex items-center gap-1">
            <Calendar size={12} />
            Last 7 days
          </button>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
            <span className="text-xs text-gray-600 dark:text-gray-400">Draft</span>
            <div className="flex items-center gap-1">
              {trends.draft.direction === 'up' ? (
                <ArrowUp size={12} className="text-green-500" />
              ) : (
                <ArrowDown size={12} className="text-red-500" />
              )}
              <span className={`text-xs font-medium ${
                trends.draft.direction === 'up' ? 'text-green-500' : 'text-red-500'
              }`}>
                {trends.draft.value}
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
            <span className="text-xs text-gray-600 dark:text-gray-400">Submitted</span>
            <div className="flex items-center gap-1">
              <ArrowUp size={12} className="text-green-500" />
              <span className="text-xs font-medium text-green-500">{trends.submitted.value}</span>
            </div>
          </div>
          <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
            <span className="text-xs text-gray-600 dark:text-gray-400">Approved</span>
            <div className="flex items-center gap-1">
              <ArrowUp size={12} className="text-green-500" />
              <span className="text-xs font-medium text-green-500">{trends.approved.value}</span>
            </div>
          </div>
          <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
            <span className="text-xs text-gray-600 dark:text-gray-400">Implemented</span>
            <div className="flex items-center gap-1">
              <ArrowUp size={12} className="text-green-500" />
              <span className="text-xs font-medium text-green-500">{trends.implemented.value}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400">Workflow Stages</h4>
          <button className="text-xs text-brand-500 hover:text-brand-600 flex items-center gap-1">
            <Download size={12} />
            Export
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
          {workflowData.map((item, index) => (
            <div key={index} className="flex items-center gap-2 p-1 hover:bg-gray-50 dark:hover:bg-gray-700/30 rounded">
              <div className={`w-2 h-2 rounded-full ${item.color}`}></div>
              <span className="text-gray-600 dark:text-gray-400 flex-1">{item.stage}</span>
              <span className="text-gray-900 dark:text-white font-medium">{item.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}