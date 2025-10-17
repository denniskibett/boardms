// app/components/meetings/MeetingMinutesDetail.tsx
"use client";
import React from "react";
import { useRouter } from "next/navigation";

interface MeetingMinutesDetailProps {
  minuteId: string;
}

export default function MeetingMinutesDetail({ minuteId }: MeetingMinutesDetailProps) {
  const router = useRouter();
  
  // Mock data - in real app, fetch by minuteId
  const minute = {
    id: minuteId,
    meetingTitle: "Infrastructure Committee Meeting",
    committee: "Infrastructure & Energy",
    date: "2024-01-11",
    status: "approved",
    attendees: [
      "H.E. Rigathi Gachagua (Chair)",
      "Hon. Kipchumba Murkomen",
      "Hon. Davis Chirchir", 
      "Hon. Njuguna Ndung'u",
      "Hon. Musalia Mudavadi"
    ],
    decisions: [
      {
        id: "1",
        title: "Infrastructure Development Proposal",
        decision: "APPROVED",
        decisionDetails: "Approved with modifications to implementation timeline",
        actionItems: [
          "Ministry of Transport to commence implementation by Feb 1st",
          "Treasury to release first tranche of funds by Jan 20th"
        ]
      },
      {
        id: "2",
        title: "Energy Sector Reforms",
        decision: "APPROVED",
        decisionDetails: "Approved the proposed energy sector reforms",
        actionItems: [
          "Ministry of Energy to draft implementation framework",
          "Public consultation to be completed by March 31st"
        ]
      }
    ],
    nextMeeting: "2024-02-15",
    preparedBy: "Cabinet Secretariat",
    documents: [
      "meeting-minutes.pdf",
      "attendance-sheet.docx",
      "presentation-slides.pptx"
    ]
  };

  const generateActionLetters = () => {
    alert("Action letters generated for all approved decisions!");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <button 
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 mb-4"
          >
            ← Back to Minutes List
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {minute.meetingTitle}
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {minute.committee} • {new Date(minute.date).toLocaleDateString()}
          </p>
        </div>
        <button 
          onClick={generateActionLetters}
          className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600"
        >
          Generate Action Letters
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Meeting Details */}
        <div className="lg:col-span-1">
          <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="border-b border-gray-200 p-6 dark:border-gray-800">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Meeting Details
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Date</h3>
                  <p className="text-sm text-gray-900 dark:text-white">{new Date(minute.date).toLocaleDateString()}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Prepared By</h3>
                  <p className="text-sm text-gray-900 dark:text-white">{minute.preparedBy}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Next Meeting</h3>
                  <p className="text-sm text-gray-900 dark:text-white">{new Date(minute.nextMeeting).toLocaleDateString()}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Status</h3>
                  <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-300">
                    {minute.status.charAt(0).toUpperCase() + minute.status.slice(1)}
                  </span>
                </div>
              </div>
              
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Attendees</h3>
                <div className="space-y-2">
                  {minute.attendees.map((attendee, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <div className="h-2 w-2 rounded-full bg-green-500"></div>
                      {attendee}
                    </div>
                  ))}
                </div>
              </div>

              {minute.documents.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Documents</h3>
                  <div className="space-y-2">
                    {minute.documents.map((doc, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">{doc}</span>
                        <button className="text-brand-500 hover:text-brand-600">Download</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Decisions & Action Items */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="border-b border-gray-200 p-6 dark:border-gray-800">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Decisions & Action Items
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                {minute.decisions.map((decision) => (
                  <div key={decision.id} className="border-b border-gray-200 pb-6 last:border-b-0 last:pb-0 dark:border-gray-700">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        {decision.title}
                      </h3>
                      <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-300">
                        {decision.decision}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      {decision.decisionDetails}
                    </p>
                    
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Action Items:
                      </h4>
                      <ul className="space-y-2">
                        {decision.actionItems.map((action, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gray-400"></span>
                            {action}
                          </li>
                        ))}
                      </ul>
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