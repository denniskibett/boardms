"use client";
import React from "react";

const workflowData = [
  { stage: "Draft", count: 8, color: "bg-gray-400" },
  { stage: "Submitted", count: 12, color: "bg-blue-500" },
  { stage: "Committee Review", count: 6, color: "bg-yellow-500" },
  { stage: "Cabinet Review", count: 4, color: "bg-purple-500" },
  { stage: "Approved", count: 23, color: "bg-green-500" },
  { stage: "Implemented", count: 18, color: "bg-teal-500" },
];

export default function WorkflowChart() {
  const total = workflowData.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xs border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
        Workflow Overview
      </h3>
      
      {/* Bar Chart */}
      <div className="space-y-4">
        {workflowData.map((item, index) => {
          const percentage = (item.count / total) * 100;
          return (
            <div key={index} className="flex items-center gap-4">
              <div className="w-32 text-sm font-medium text-gray-700 dark:text-gray-300">
                {item.stage}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                  <span>{item.count} memos</span>
                  <span>{percentage.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${item.color} transition-all duration-500`}
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-2 gap-4 text-xs">
          {workflowData.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
              <span className="text-gray-600 dark:text-gray-400">{item.stage}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}