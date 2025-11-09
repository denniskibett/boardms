// app/components/documents/DocumentViewer.tsx
"use client";
import React, { useState } from 'react';
import { FileText, Download, X, MessageSquare } from 'lucide-react';

interface DocumentViewerProps {
  document: any;
  onClose: () => void;
}

export default function DocumentViewer({ document, onClose }: DocumentViewerProps) {
  const [annotations, setAnnotations] = useState<any[]>([]);
  const [isAddingAnnotation, setIsAddingAnnotation] = useState(false);

  // This would integrate with actual document viewing libraries
  // For PDF: PDF.js
  // For images: Simple image viewer
  // For Office docs: Microsoft Office Viewer or similar

  return (
    <div className="fixed inset-0 z-50 bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center">
          <FileText className="h-5 w-5 mr-2" />
          <h2 className="text-lg font-semibold">{document.name}</h2>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-gray-100 rounded">
            <MessageSquare className="h-4 w-4" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded">
            <Download className="h-4 w-4" />
          </button>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Document Content */}
      <div className="flex-1 p-4">
        <div className="max-w-4xl mx-auto">
          {/* Document preview area */}
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-8 min-h-[600px] flex items-center justify-center">
            <div className="text-center">
              <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                Document preview for {document.file_type}
              </p>
              <p className="text-sm text-gray-400 mt-2">
                Integrated document viewer would appear here
              </p>
            </div>
          </div>

          {/* Annotations sidebar could be added here */}
        </div>
      </div>
    </div>
  );
}