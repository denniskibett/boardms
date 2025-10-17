// app/(admin)/committees/[id]/tier1-agenda/page.tsx
"use client";
import React, { useState } from "react";
import { useParams } from "next/navigation";

export default function Tier1AgendaPage() {
  const params = useParams();
  const committeeId = params.id;
  
  const [agendaItems, setAgendaItems] = useState([
    {
      id: "1",
      memoId: "MEM-001",
      title: "Infrastructure Development Proposal for Northern Corridor",
      ministry: "Ministry of Transport",
      priority: "high",
      status: "pending_review",
      attachments: ["project-plan.pdf", "budget-breakdown.docx"],
    },
    {
      id: "2", 
      memoId: "MEM-006",
      title: "Agricultural Subsidy Program",
      ministry: "Ministry of Agriculture", 
      priority: "medium",
      status: "under_review",
      attachments: ["subsidy-framework.pdf"],
    }
  ]);

  const generateTier1Book = () => {
    // Simulate PDF generation
    alert("Tier 1 Agenda Book generated successfully!");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Tier 1 Agenda Book - Infrastructure Committee
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Compile committee agenda items for upcoming meeting
          </p>
        </div>
        <div className="flex gap-3">
          <button className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700">
            Add Memo
          </button>
          <button 
            onClick={generateTier1Book}
            className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600"
          >
            Generate Agenda Book
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="border-b border-gray-200 p-6 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Agenda Items for Committee Review
          </h2>
        </div>
        
        <div className="p-6">
          <div className="space-y-4">
            {agendaItems.map((item) => (
              <div key={item.id} className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                        {item.title}
                      </h3>
                      <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                        {item.priority}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Ministry: {item.ministry} • Memo: {item.memoId}
                    </p>
                    
                    {item.attachments.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Attachments:</p>
                        <div className="flex gap-2">
                          {item.attachments.map((file, index) => (
                            <span key={index} className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                              {file}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="ml-4 flex gap-2">
                    <button className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700">
                      Review
                    </button>
                    <button className="rounded-lg bg-red-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-600">
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {agendaItems.length === 0 && (
            <div className="py-12 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No agenda items</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Add memos to create the committee agenda book
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}