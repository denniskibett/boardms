// app/components/dashboard/RecentMemos.tsx
"use client";
import React from "react";
import Link from "next/link";

const recentMemos = [
  {
    id: "MEM-001",
    title: "Infrastructure Development Proposal",
    ministry: "Ministry of Transport",
    status: "Under Review",
    statusColor: "blue",
    date: "2024-01-15",
    assignedTo: "Infrastructure Committee",
  },
  {
    id: "MEM-002",
    title: "Healthcare Funding Allocation",
    ministry: "Ministry of Health",
    status: "Approved",
    statusColor: "green",
    date: "2024-01-14",
    assignedTo: "Social Services Committee",
  },
  {
    id: "MEM-003",
    title: "Education Policy Reform",
    ministry: "Ministry of Education",
    status: "Pending",
    statusColor: "yellow",
    date: "2024-01-13",
    assignedTo: "Social Services Committee",
  },
  {
    id: "MEM-004",
    title: "Energy Sector Investment",
    ministry: "Ministry of Energy",
    status: "Revisions Required",
    statusColor: "red",
    date: "2024-01-12",
    assignedTo: "Infrastructure Committee",
  },
];

const statusColors: { [key: string]: string } = {
  blue: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  green: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  yellow: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  red: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

export default function RecentMemos() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xs border border-gray-200 dark:border-gray-700">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Recent Government Memos
          </h3>
          <Link
            href="/memos"
            className="text-sm font-medium text-brand-500 hover:text-brand-600 dark:text-brand-400"
          >
            View All
          </Link>
        </div>
      </div>
      <div className="p-6">
        <div className="space-y-4">
          {recentMemos.map((memo) => (
            <div
              key={memo.id}
              className="flex items-center justify-between p-4 border border-gray-100 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {memo.title}
                  </h4>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[memo.statusColor]}`}
                  >
                    {memo.status}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                  <span>{memo.ministry}</span>
                  <span>•</span>
                  <span>{memo.assignedTo}</span>
                  <span>•</span>
                  <span>{new Date(memo.date).toLocaleDateString()}</span>
                </div>
              </div>
              <button className="ml-4 text-sm font-medium text-brand-500 hover:text-brand-600 dark:text-brand-400">
                View
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}