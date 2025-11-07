// app/components/agendas/AgendaBookViewer.tsx
"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";

interface AgendaBookViewerProps {
  agendaId: string;
}

export default function AgendaBookViewer({ agendaId }: AgendaBookViewerProps) {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(0);
  
  // Mock data - in real app, fetch by agendaId
  const agendaBook = {
    id: agendaId,
    title: "Infrastructure Committee - January 2024 Agenda Book",
    committee: "Infrastructure & Energy",
    meetingDate: "2024-01-18",
    type: "tier1",
    pages: [
      {
        type: "cover",
        title: "Infrastructure Committee Meeting",
        subtitle: "January 2024 Agenda Book",
        date: "January 18, 2024",
        time: "10:00 AM",
        location: "Conference Room A"
      },
      {
        type: "agenda",
        title: "Meeting Agenda",
        items: [
          { time: "10:00-10:15", title: "Opening Remarks", presenter: "Chair" },
          { time: "10:15-10:45", title: "Infrastructure Development Proposal", presenter: "Ministry of Transport" },
          { time: "10:45-11:15", title: "Energy Sector Updates", presenter: "Ministry of Energy" },
          { time: "11:15-11:30", title: "Closing Remarks", presenter: "Chair" }
        ]
      },
      {
        type: "memo",
        title: "Infrastructure Development Proposal",
        memoId: "MEM-001",
        ministry: "Ministry of Transport",
        summary: "Comprehensive infrastructure development plan covering transport, energy, and digital infrastructure along the Northern Corridor economic zone.",
        attachments: ["project-plan.pdf", "budget-breakdown.docx"]
      },
      {
        type: "memo", 
        title: "Energy Sector Investment Strategy",
        memoId: "MEM-007",
        ministry: "Ministry of Energy",
        summary: "Strategy for renewable energy investments and grid modernization across the country.",
        attachments: ["energy-strategy.pdf"]
      }
    ]
  };

  const nextPage = () => {
    if (currentPage < agendaBook.pages.length - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const downloadBook = () => {
    alert("Agenda book downloaded as PDF!");
  };

  const renderPage = (page: any) => {
    switch (page.type) {
      case "cover":
        return (
          <div className="text-center py-12">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              {page.title}
            </h1>
            <h2 className="text-xl text-gray-600 dark:text-gray-400 mb-8">
              {page.subtitle}
            </h2>
            <div className="space-y-2 text-gray-500 dark:text-gray-400">
              <p>Date: {page.date}</p>
              <p>Time: {page.time}</p>
              <p>Location: {page.location}</p>
            </div>
          </div>
        );
      
      case "agenda":
        return (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              {page.title}
            </h2>
            <div className="space-y-4">
              {page.items.map((item: any, index: number) => (
                <div key={index} className="flex border-b border-gray-200 pb-4 last:border-b-0 dark:border-gray-700">
                  <div className="w-32 flex-shrink-0">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {item.time}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      {item.title}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Presented by: {item.presenter}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      
      case "memo":
        return (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {page.title}
            </h2>
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Memo: {page.memoId} • Ministry: {page.ministry}
            </div>
            <div className="prose dark:prose-invert max-w-none">
              <p className="text-gray-700 dark:text-gray-300 mb-6">
                {page.summary}
              </p>
            </div>
            {page.attachments && page.attachments.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                  Supporting Documents
                </h3>
                <div className="space-y-2">
                  {page.attachments.map((doc: string, index: number) => (
                    <div key={index} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg dark:bg-gray-800">
                      <span className="text-sm text-gray-600 dark:text-gray-400">{doc}</span>
                      <button className="text-brand-500 hover:text-brand-600 text-sm">
                        View
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <button 
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 mb-4"
          >
            ← Back to Agenda
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {agendaBook.title}
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {agendaBook.committee} • {new Date(agendaBook.meetingDate).toLocaleDateString()}
          </p>
        </div>
        <button 
          onClick={downloadBook}
          className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600"
        >
          Download PDF
        </button>
      </div>

      {/* Book Viewer */}
      <div className="bg-white rounded-2xl border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
        <div className="border-b border-gray-200 p-6 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Agenda Book
            </h2>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Page {currentPage + 1} of {agendaBook.pages.length}
              </span>
            </div>
          </div>
        </div>

        <div className="p-8 min-h-[600px] flex items-center justify-center">
          <div className="w-full max-w-4xl mx-auto">
            <div className="bg-white border-2 border-gray-200 rounded-lg p-8 shadow-lg dark:bg-gray-800 dark:border-gray-600">
              {renderPage(agendaBook.pages[currentPage])}
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 p-6 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <button
              onClick={prevPage}
              disabled={currentPage === 0}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Previous
            </button>
            <button
              onClick={nextPage}
              disabled={currentPage === agendaBook.pages.length - 1}
              className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}