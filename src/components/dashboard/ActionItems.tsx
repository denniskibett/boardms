"use client";
import React from "react";

const actionItems = [
  {
    id: 1,
    title: "Implement Healthcare Funding",
    ministry: "Ministry of Health",
    dueDate: "2024-02-15",
    priority: "high",
    status: "in-progress",
  },
  {
    id: 2,
    title: "Review Education Policy Draft",
    ministry: "Ministry of Education",
    dueDate: "2024-01-25",
    priority: "medium",
    status: "pending",
  },
  {
    id: 3,
    title: "Infrastructure Tender Process",
    ministry: "Ministry of Transport",
    dueDate: "2024-03-01",
    priority: "high",
    status: "not-started",
  },
  {
    id: 4,
    title: "Energy Sector Report",
    ministry: "Ministry of Energy",
    dueDate: "2024-01-30",
    priority: "low",
    status: "completed",
  },
];

const priorityColors: { [key: string]: string } = {
  high: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  low: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
};

const statusColors: { [key: string]: string } = {
  "not-started": "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
  "in-progress": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  pending: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
};

export default function ActionItems() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xs border border-gray-200 dark:border-gray-700">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Action Items
        </h3>
      </div>
      <div className="p-6">
        <div className="space-y-4">
          {actionItems.map((item) => (
            <div
              key={item.id}
              className="p-4 border border-gray-100 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white flex-1">
                  {item.title}
                </h4>
                <span
                  className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${priorityColors[item.priority]}`}
                >
                  {item.priority}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-2">
                <span>{item.ministry}</span>
                <span>Due: {new Date(item.dueDate).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[item.status]}`}
                >
                  {item.status.replace("-", " ")}
                </span>
                <div className="flex gap-2">
                  <button className="text-xs text-brand-500 hover:text-brand-600 dark:text-brand-400">
                    View
                  </button>
                  <button className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
                    Update
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}