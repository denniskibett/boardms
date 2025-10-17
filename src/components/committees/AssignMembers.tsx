"use client";
import React, { useState } from "react";

const committees = [
  { id: "infrastructure", name: "Infrastructure & Energy Committee" },
  { id: "finance", name: "Budget & Finance Committee" },
  { id: "social", name: "Social Services Committee" },
  { id: "security", name: "Security & Administration Committee" },
];

const users = [
  { id: "1", name: "John Kamau", title: "Cabinet Secretary", ministry: "Transport", currentCommittees: ["infrastructure"] },
  { id: "2", name: "Dr. Sarah Mwangi", title: "Cabinet Secretary", ministry: "Health", currentCommittees: ["social"] },
  { id: "3", name: "Peter Njeru", title: "Cabinet Secretary", ministry: "Agriculture", currentCommittees: [] },
  { id: "4", name: "Grace Omondi", title: "Cabinet Secretary", ministry: "ICT", currentCommittees: ["infrastructure"] },
  { id: "5", name: "James Mbugua", title: "Permanent Secretary", ministry: "Treasury", currentCommittees: ["finance"] },
];

export default function AssignMembers() {
  const [selectedCommittee, setSelectedCommittee] = useState("");
  const [assignments, setAssignments] = useState<Record<string, string[]>>({});

  const handleAssignment = (userId: string, assign: boolean) => {
    if (!selectedCommittee) return;

    setAssignments(prev => {
      const currentAssignments = prev[selectedCommittee] || [];
      let newAssignments;

      if (assign) {
        newAssignments = [...currentAssignments, userId];
      } else {
        newAssignments = currentAssignments.filter(id => id !== userId);
      }

      return {
        ...prev,
        [selectedCommittee]: newAssignments
      };
    });
  };

  const isUserInCommittee = (userId: string) => {
    if (!selectedCommittee) return false;
    return assignments[selectedCommittee]?.includes(userId) || 
           users.find(u => u.id === userId)?.currentCommittees.includes(selectedCommittee);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xs border border-gray-200 dark:border-gray-700">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Committee Member Assignment
        </h2>
      </div>

      <div className="p-6">
        {/* Committee Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Select Committee
          </label>
          <select
            value={selectedCommittee}
            onChange={(e) => setSelectedCommittee(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="">Choose a committee...</option>
            {committees.map(committee => (
              <option key={committee.id} value={committee.id}>
                {committee.name}
              </option>
            ))}
          </select>
        </div>

        {selectedCommittee && (
          <div>
            <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-4">
              Available Members
            </h3>
            <div className="space-y-3">
              {users.map(user => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                >
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {user.name}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {user.title} • {user.ministry}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {isUserInCommittee(user.id) ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                        Member
                      </span>
                    ) : null}
                    <button
                      onClick={() => handleAssignment(user.id, !isUserInCommittee(user.id))}
                      className={`px-4 py-2 text-sm font-medium rounded-lg ${
                        isUserInCommittee(user.id)
                          ? "text-red-700 bg-red-100 hover:bg-red-200 dark:text-red-300 dark:bg-red-900 dark:hover:bg-red-800"
                          : "text-brand-700 bg-brand-100 hover:bg-brand-200 dark:text-brand-300 dark:bg-brand-900 dark:hover:bg-brand-800"
                      }`}
                    >
                      {isUserInCommittee(user.id) ? "Remove" : "Assign"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!selectedCommittee && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Select a committee</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Choose a committee to view and assign members
            </p>
          </div>
        )}
      </div>
    </div>
  );
}