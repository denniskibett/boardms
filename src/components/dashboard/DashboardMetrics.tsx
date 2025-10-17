"use client";
import React from "react";

const metrics = [
  {
    title: "Pending Memos",
    value: "12",
    change: "+2",
    changeType: "positive" as const,
    description: "Awaiting review",
    color: "blue",
  },
  {
    title: "Upcoming Meetings",
    value: "5",
    change: "+1",
    changeType: "positive" as const,
    description: "Next 7 days",
    color: "green",
  },
  {
    title: "Action Items",
    value: "8",
    change: "-3",
    changeType: "negative" as const,
    description: "Requiring attention",
    color: "orange",
  },
  {
    title: "Decisions Made",
    value: "23",
    change: "+5",
    changeType: "positive" as const,
    description: "This month",
    color: "purple",
  },
];

export default function DashboardMetrics() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
      {metrics.map((metric, index) => (
        <div
          key={index}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-xs p-6 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {metric.title}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {metric.value}
              </p>
            </div>
            <div
              className={`p-3 rounded-full ${
                metric.color === "blue"
                  ? "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300"
                  : metric.color === "green"
                  ? "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300"
                  : metric.color === "orange"
                  ? "bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-300"
                  : "bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300"
              }`}
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"/>
              </svg>
            </div>
          </div>
          <div className="flex items-center mt-2">
            <span
              className={`text-sm font-medium ${
                metric.changeType === "positive"
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {metric.change}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">
              {metric.description}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}