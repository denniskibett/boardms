// app/components/audit/AuditTrail.tsx
"use client";
import React, { useState } from "react";

const auditLogs = [
  {
    id: "1",
    timestamp: "2024-01-18T10:30:00Z",
    user: "H.E. The President",
    action: "APPROVE_MEMO",
    target: "MEM-001 - Infrastructure Development Proposal",
    details: "Memo approved and forwarded for implementation",
    ipAddress: "192.168.1.100",
    userAgent: "Chrome/120.0.0.0",
    severity: "info",
  },
  {
    id: "2",
    timestamp: "2024-01-18T09:15:00Z",
    user: "Cabinet Secretariat",
    action: "SCHEDULE_MEETING",
    target: "Infrastructure Committee Meeting",
    details: "Meeting scheduled for 2024-01-25 at Conference Room A",
    ipAddress: "192.168.1.101",
    userAgent: "Firefox/121.0.0.0",
    severity: "info",
  },
  {
    id: "3",
    timestamp: "2024-01-18T08:45:00Z",
    user: "John Kamau",
    action: "UPDATE_MEMO",
    target: "MEM-001 - Infrastructure Development Proposal",
    details: "Updated project budget and timeline",
    ipAddress: "192.168.1.102",
    userAgent: "Safari/17.2.0",
    severity: "warning",
  },
  {
    id: "4",
    timestamp: "2024-01-17T16:20:00Z",
    user: "System",
    action: "AUTO_BACKUP",
    target: "Database Backup",
    details: "Scheduled system backup completed successfully",
    ipAddress: "127.0.0.1",
    userAgent: "System/1.0",
    severity: "info",
  },
  {
    id: "5",
    timestamp: "2024-01-17T14:30:00Z",
    user: "Dr. Sarah Mwangi",
    action: "CREATE_MEMO",
    target: "MEM-007 - Healthcare Modernization",
    details: "New memo created and submitted for review",
    ipAddress: "192.168.1.103",
    userAgent: "Chrome/120.0.0.0",
    severity: "info",
  },
  {
    id: "6",
    timestamp: "2024-01-17T11:15:00Z",
    user: "Auditor",
    action: "EXPORT_REPORT",
    target: "Monthly Activity Report",
    details: "Comprehensive activity report exported to PDF",
    ipAddress: "192.168.1.104",
    userAgent: "Edge/120.0.0.0",
    severity: "info",
  },
];

const severityColors = {
  info: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  warning: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  error: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  security: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
};

export default function AuditTrail() {
  const [filter, setFilter] = useState("all");
  const [dateRange, setDateRange] = useState("today");

  const filteredLogs = auditLogs.filter(log => 
    filter === "all" || log.severity === filter
  );

  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      {/* Filters */}
      <div className="border-b border-gray-200 p-6 dark:border-gray-800">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="h-11 rounded-lg border border-gray-300 bg-transparent px-3 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
            >
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="custom">Custom Range</option>
            </select>

            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="h-11 rounded-lg border border-gray-300 bg-transparent px-3 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
            >
              <option value="all">All Severity</option>
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="error">Error</option>
              <option value="security">Security</option>
            </select>
          </div>

          <div className="text-sm text-gray-500 dark:text-gray-400">
            {filteredLogs.length} log entries found
          </div>
        </div>
      </div>

      {/* Audit Logs */}
      <div className="p-6">
        <div className="space-y-4">
          {filteredLogs.map((log) => (
            <div
              key={log.id}
              className="rounded-lg border border-gray-200 p-4 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${severityColors[log.severity]}`}>
                      {log.severity.charAt(0).toUpperCase() + log.severity.slice(1)}
                    </span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {log.action.replace(/_/g, ' ')}
                    </span>
                  </div>
                  
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    {log.details}
                  </p>
                  
                  <div className="mt-3 grid grid-cols-1 gap-2 text-xs text-gray-500 dark:text-gray-400 sm:grid-cols-3">
                    <div>
                      <span className="font-medium">User:</span> {log.user}
                    </div>
                    <div>
                      <span className="font-medium">Target:</span> {log.target}
                    </div>
                    <div>
                      <span className="font-medium">IP:</span> {log.ipAddress}
                    </div>
                  </div>
                </div>
                
                <div className="ml-4 text-right">
                  <div className="text-sm text-gray-900 dark:text-white">
                    {new Date(log.timestamp).toLocaleDateString()}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredLogs.length === 0 && (
          <div className="py-12 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2a3 3 0 00-3-3H5a3 3 0 00-3 3v2a3 3 0 003 3h1a3 3 0 003-3zm6 0v-2a3 3 0 00-3-3h-1a3 3 0 00-3 3v2a3 3 0 003 3h1a3 3 0 003-3zm4-4v-2a3 3 0 00-3-3h-1a3 3 0 00-3 3v2a3 3 0 003 3h1a3 3 0 003-3z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No audit logs found</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Try adjusting your filters to see more results
            </p>
          </div>
        )}

        {/* Pagination */}
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Showing 1 to {filteredLogs.length} of {filteredLogs.length} results
          </div>
          <div className="flex gap-2">
            <button className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700">
              Previous
            </button>
            <button className="rounded-lg border border-brand-500 bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600">
              1
            </button>
            <button className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700">
              2
            </button>
            <button className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700">
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}