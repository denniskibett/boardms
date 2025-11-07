// app/(admin)/cabinet/tier2-agenda/page.tsx
"use client";
import React, { useState } from "react";

export default function Tier2AgendaPage() {
  const [cabinetAgenda, _setCabinetAgenda] = useState([
    {
      id: "1",
      committee: "Infrastructure & Energy",
      memoId: "MEM-001",
      title: "Infrastructure Development Proposal for Northern Corridor",
      recommendation: "APPROVE",
      committeeNotes: "Comprehensive plan with clear implementation strategy",
      priority: "high",
      attachments: ["committee-report.pdf", "technical-assessment.docx"],
    },
    {
      id: "2",
      committee: "Social Services", 
      memoId: "MEM-002",
      title: "Healthcare Funding Allocation Q1 2024",
      recommendation: "APPROVE",
      committeeNotes: "Well-structured allocation with measurable outcomes",
      priority: "medium",
      attachments: ["health-budget-breakdown.pdf"],
    }
  ]);

  const generateTier2Book = () => {
    // Simulate PDF generation for cabinet
    alert("Tier 2 Cabinet Agenda Book generated successfully!");
  };

  const generateCabinetRelease = () => {
    // Simulate cabinet release generation
    alert("Cabinet Release document generated!");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Tier 2 Cabinet Agenda Book
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Final agenda compilation for full cabinet meeting
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={generateTier2Book}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Generate PDF
          </button>
          <button 
            onClick={generateCabinetRelease}
            className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600"
          >
            Generate Cabinet Release
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="border-b border-gray-200 p-6 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Cabinet Agenda Items
          </h2>
        </div>
        
        <div className="p-6">
          <div className="space-y-6">
            {cabinetAgenda.map((item) => (
              <div key={item.id} className="rounded-lg border border-gray-200 p-6 dark:border-gray-700">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      {item.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Committee: {item.committee} • Memo: {item.memoId}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      item.recommendation === "APPROVE" 
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                        : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                    }`}>
                      {item.recommendation}
                    </span>
                    <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                      {item.priority}
                    </span>
                  </div>
                </div>
                
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Committee Recommendation:
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {item.committeeNotes}
                  </p>
                </div>
                
                {item.attachments.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Supporting Documents:
                    </h4>
                    <div className="flex gap-2">
                      {item.attachments.map((file, index) => (
                        <span key={index} className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                          {file}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="mt-4 flex gap-3">
                  <button className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700">
                    View Details
                  </button>
                  <button className="rounded-lg bg-brand-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-600">
                    Add to Minutes
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}