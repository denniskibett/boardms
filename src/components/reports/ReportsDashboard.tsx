// app/components/reports/ReportsDashboard.tsx
"use client";
import React from "react";

const stats = [
  {
    title: "Total Memos Processed",
    value: "156",
    change: "+12%",
    changeType: "positive",
    description: "This month",
    icon: (
      <svg className="h-6 w-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    title: "Average Processing Time",
    value: "4.2",
    change: "-0.3",
    changeType: "positive",
    description: "Days per memo",
    icon: (
      <svg className="h-6 w-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    title: "Committee Efficiency",
    value: "87%",
    change: "+5%",
    changeType: "positive",
    description: "Meeting targets",
    icon: (
      <svg className="h-6 w-6 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
        <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
      </svg>
    ),
  },
  {
    title: "Decision Implementation",
    value: "72%",
    change: "+8%",
    changeType: "positive",
    description: "On schedule",
    icon: (
      <svg className="h-6 w-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
      </svg>
    ),
  },
];

const recentActivities = [
  {
    id: 1,
    action: "Memo Approved",
    description: "Infrastructure Development Proposal",
    user: "H.E. The President",
    time: "2 hours ago",
    type: "approval",
  },
  {
    id: 2,
    action: "Meeting Scheduled",
    description: "Budget Committee Review",
    user: "Cabinet Secretariat",
    time: "4 hours ago",
    type: "schedule",
  },
  {
    id: 3,
    action: "Action Letter Sent",
    description: "To Ministry of Health",
    user: "Secretariat Office",
    time: "1 day ago",
    type: "action",
  },
  {
    id: 4,
    action: "Decision Implemented",
    description: "Education Policy Reform",
    user: "Ministry of Education",
    time: "2 days ago",
    type: "completion",
  },
];

const typeColors = {
  approval: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  schedule: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  action: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  completion: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
};

export default function ReportsDashboard() {
  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {stat.title}
                </p>
                <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
                  {stat.value}
                </p>
              </div>
              <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
                {stat.icon}
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <span
                className={`text-sm font-medium ${
                  stat.changeType === "positive"
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                }`}
              >
                {stat.change}
              </span>
              <span className="ml-1 text-sm text-gray-500 dark:text-gray-400">
                {stat.description}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Activities */}
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="border-b border-gray-200 p-6 dark:border-gray-800">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Recent Activities
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                    <span className={`text-xs font-medium ${typeColors[activity.type]}`}>
                      {activity.type.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {activity.action}
                      </p>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {activity.time}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {activity.description}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      by {activity.user}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Reports */}
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="border-b border-gray-200 p-6 dark:border-gray-800">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Quick Reports
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {[
                { name: "Monthly Performance Report", type: "PDF", date: "Jan 2024" },
                { name: "Committee Efficiency Analysis", type: "Excel", date: "This Week" },
                { name: "Decision Implementation Tracker", type: "PDF", date: "Q4 2023" },
                { name: "User Activity Summary", type: "CSV", date: "Last Month" },
              ].map((report, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg border border-gray-200 p-4 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {report.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {report.type} • {report.date}
                    </p>
                  </div>
                  <button className="rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-600">
                    Download
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Performance Charts Section */}
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="border-b border-gray-200 p-6 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Performance Metrics
          </h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Memo Processing Time */}
            <div>
              <h3 className="mb-4 text-sm font-medium text-gray-900 dark:text-white">
                Average Processing Time (Days)
              </h3>
              <div className="space-y-3">
                {[
                  { committee: "Infrastructure", days: 3.2, trend: "down" },
                  { committee: "Finance", days: 4.8, trend: "up" },
                  { committee: "Social Services", days: 5.1, trend: "stable" },
                  { committee: "Security", days: 2.9, trend: "down" },
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {item.committee}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {item.days} days
                      </span>
                      <span
                        className={`text-xs ${
                          item.trend === "down"
                            ? "text-green-600"
                            : item.trend === "up"
                            ? "text-red-600"
                            : "text-gray-600"
                        }`}
                      >
                        {item.trend === "down" ? "↘" : item.trend === "up" ? "↗" : "→"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Decision Implementation Rate */}
            <div>
              <h3 className="mb-4 text-sm font-medium text-gray-900 dark:text-white">
                Decision Implementation Rate
              </h3>
              <div className="space-y-3">
                {[
                  { ministry: "Transport", rate: 85, trend: "up" },
                  { ministry: "Health", rate: 92, trend: "up" },
                  { ministry: "Education", rate: 78, trend: "stable" },
                  { ministry: "Energy", rate: 65, trend: "down" },
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {item.ministry}
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-20 rounded-full bg-gray-200 dark:bg-gray-700">
                        <div
                          className="h-2 rounded-full bg-green-500"
                          style={{ width: `${item.rate}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {item.rate}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}