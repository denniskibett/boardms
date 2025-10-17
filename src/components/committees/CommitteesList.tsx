// app/components/committees/CommitteesList.tsx
"use client";
import React from "react";
import Link from "next/link";

const committees = [
  {
    id: "infrastructure",
    name: "Infrastructure & Energy Committee",
    chair: "H.E. Deputy President",
    members: 12,
    activeMemos: 5,
    nextMeeting: "2024-01-18",
    cluster: "Infrastructure",
  },
  {
    id: "finance",
    name: "Budget & Finance Committee",
    chair: "CS National Treasury",
    members: 10,
    activeMemos: 3,
    nextMeeting: "2024-01-19",
    cluster: "Finance",
  },
  {
    id: "social",
    name: "Social Services Committee",
    chair: "CS Ministry of Health",
    members: 15,
    activeMemos: 8,
    nextMeeting: "2024-01-22",
    cluster: "Social Services",
  },
  {
    id: "security",
    name: "Security & Administration Committee",
    chair: "CS Ministry of Interior",
    members: 8,
    activeMemos: 2,
    nextMeeting: "2024-01-25",
    cluster: "Security",
  },
  {
    id: "development",
    name: "National Development Council",
    chair: "H.E. The President",
    members: 20,
    activeMemos: 12,
    nextMeeting: "2024-01-30",
    cluster: "Development",
  },
];

export default function CommitteesList() {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {committees.map((committee) => (
        <div
          key={committee.id}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-xs border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {committee.name}
            </h3>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
              {committee.cluster}
            </span>
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
              {committee.members} members
            </div>
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              {committee.activeMemos} active memos
            </div>
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              Next: {new Date(committee.nextMeeting).toLocaleDateString()}
            </div>
          </div>

          <div className="flex gap-2">
            <Link
              href={`/committees/${committee.id}`}
              className="flex-1 text-center px-4 py-2 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600"
            >
              View Committee
            </Link>
            <Link
              href={`/committees/${committee.id}/members`}
              className="flex-1 text-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            >
              Members
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}