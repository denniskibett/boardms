"use client";
import React from "react";

const myCommittees = [
  {
    id: "infrastructure",
    name: "Infrastructure & Energy Committee",
    role: "Member",
    chair: "H.E. Deputy President",
    members: 12,
    activeMemos: 5,
    nextMeeting: "2024-01-18",
    myTasks: 3,
  },
  {
    id: "development",
    name: "National Development Council",
    role: "Alternate Member",
    chair: "H.E. The President",
    members: 20,
    activeMemos: 12,
    nextMeeting: "2024-01-30",
    myTasks: 1,
  },
];

export default function MyCommitteesList() {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      {myCommittees.map((committee) => (
        <div
          key={committee.id}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-xs border border-gray-200 dark:border-gray-700 p-6"
        >
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {committee.name}
            </h3>
            <div className="flex flex-col items-end gap-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                {committee.role}
              </span>
              {committee.myTasks > 0 && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300">
                  {committee.myTasks} tasks
                </span>
              )}
            </div>
          </div>
          
          <div className="space-y-3 mb-4">
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
              Chair: {committee.chair}
            </div>
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
              </svg>
              {committee.members} members • {committee.activeMemos} active memos
            </div>
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              Next meeting: {new Date(committee.nextMeeting).toLocaleDateString()}
            </div>
          </div>

          <div className="flex gap-2">
            <button className="flex-1 px-4 py-2 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600">
              View Committee
            </button>
            <button className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600">
              Meeting Materials
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}