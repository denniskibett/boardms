// app/components/agendas/AgendaBookViewer.tsx
"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Agenda {
  id: string;
  name: string;
  description: string;
  status: string;
  sort_order: number;
  presenter_name: string;
  ministry_id: string | null;
  memo_id: string | null;
  cabinet_approval_required: boolean;
  meeting_id: string;
  created_at: string;
  updated_at: string;
}

interface AgendaFile {
  id: string;
  agenda_id: string;
  file_name: string;
  file_type: string;
  file_url: string;
  file_size: number;
  uploaded_at: string;
  uploader_id: string;
  annotations: Annotation[];
}

interface Annotation {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  comment: string;
  author: string;
  created_at: string;
}

interface AgendaBookViewerProps {
  agendaId: string;
}

export default function AgendaBookViewer({ agendaId }: AgendaBookViewerProps) {
  const router = useRouter();
  const [agendas, setAgendas] = useState<Agenda[]>([]);
  const [files, setFiles] = useState<AgendaFile[]>([]);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [newAnnotation, setNewAnnotation] = useState<Partial<Annotation> | null>(null);

  useEffect(() => {
    fetchAgendas();
    fetchFiles();
  }, [agendaId]);

  const fetchAgendas = async () => {
    try {
      const response = await fetch('/api/agendas');
      const data = await response.json();
      setAgendas(data);
    } catch (error) {
      console.error('Error fetching agendas:', error);
    }
  };

  const fetchFiles = async () => {
    try {
      const response = await fetch(`/api/agenda-files?agendaId=${agendaId}`);
      const data = await response.json();
      setFiles(data);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching files:', error);
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('agendaId', agendaId);

    try {
      const response = await fetch('/api/agenda-files', {
        method: 'POST',
        body: formData,
      });
      const newFile = await response.json();
      setFiles(prev => [...prev, newFile]);
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  const handleAddAnnotation = async (annotation: Partial<Annotation>) => {
    if (!files[currentFileIndex]) return;

    try {
      const response = await fetch('/api/annotations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...annotation,
          file_id: files[currentFileIndex].id,
        }),
      });
      
      const newAnnotation = await response.json();
      
      // Update local state
      setFiles(prev => prev.map((file, index) => 
        index === currentFileIndex 
          ? { ...file, annotations: [...file.annotations, newAnnotation] }
          : file
      ));
      
      setNewAnnotation(null);
    } catch (error) {
      console.error('Error adding annotation:', error);
    }
  };

  const renderFileViewer = () => {
    if (isLoading) {
      return <div className="flex items-center justify-center h-96">Loading...</div>;
    }

    if (files.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-96 text-gray-500">
          <p>No files uploaded for this agenda</p>
          <input
            type="file"
            onChange={handleFileUpload}
            className="mt-4"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
          />
        </div>
      );
    }

    const currentFile = files[currentFileIndex];

    return (
      <div className="h-full flex flex-col">
        {/* File navigation */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setCurrentFileIndex(prev => Math.max(0, prev - 1))}
              disabled={currentFileIndex === 0}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm">
              File {currentFileIndex + 1} of {files.length}
            </span>
            <button
              onClick={() => setCurrentFileIndex(prev => Math.min(files.length - 1, prev + 1))}
              disabled={currentFileIndex === files.length - 1}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">{currentFile.file_name}</span>
            <input
              type="file"
              onChange={handleFileUpload}
              className="text-sm"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            />
          </div>
        </div>

        {/* File content area */}
        <div className="flex-1 relative bg-gray-100 overflow-auto">
          {/* This is where you'd integrate with a document viewer */}
          {/* For now, showing a placeholder */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-white p-8 rounded-lg shadow-lg max-w-2xl w-full">
              <h3 className="text-xl font-bold mb-4">{currentFile.file_name}</h3>
              <p className="text-gray-600 mb-4">
                File type: {currentFile.file_type} • Size: {(currentFile.file_size / 1024 / 1024).toFixed(2)} MB
              </p>
              
              {/* Document preview placeholder */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg h-96 flex items-center justify-center">
                <p className="text-gray-500">
                  Document preview for {currentFile.file_type} files
                </p>
              </div>

              {/* Annotations display */}
              {currentFile.annotations.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-semibold mb-2">Annotations:</h4>
                  {currentFile.annotations.map(annotation => (
                    <div key={annotation.id} className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mb-2">
                      <p className="text-sm">{annotation.comment}</p>
                      <p className="text-xs text-gray-500 mt-1">- {annotation.author}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Add annotation button */}
              <button
                onClick={() => setNewAnnotation({ x: 50, y: 50, width: 200, height: 100, comment: '' })}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Add Annotation
              </button>

              {/* New annotation form */}
              {newAnnotation && (
                <div className="mt-4 p-4 border rounded bg-white">
                  <textarea
                    value={newAnnotation.comment || ''}
                    onChange={(e) => setNewAnnotation(prev => ({ ...prev, comment: e.target.value }))}
                    placeholder="Enter your annotation..."
                    className="w-full p-2 border rounded mb-2"
                    rows={3}
                  />
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleAddAnnotation(newAnnotation)}
                      className="px-3 py-1 bg-green-500 text-white rounded"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setNewAnnotation(null)}
                      className="px-3 py-1 bg-gray-500 text-white rounded"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar - Agenda Items */}
      <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
        <div className="p-6">
          <button 
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6"
          >
            ← Back to Meetings
          </button>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Cabinet Meeting
          </h1>
          <p className="text-sm text-gray-600 mb-6">
            January 2024 • Conference Room A
          </p>

          <div className="space-y-2">
            {agendas.map((agenda) => (
              <div
                key={agenda.id}
                className={`p-4 rounded-lg border cursor-pointer ${
                  agendaId === agenda.id 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
                onClick={() => router.push(`/agendas/${agenda.id}/book`)}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">{agenda.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">{agenda.description}</p>
                    {agenda.presenter_name && (
                      <p className="text-xs text-gray-400 mt-1">
                        Presenter: {agenda.presenter_name}
                      </p>
                    )}
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    agenda.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                    agenda.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {agenda.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content - File Viewer */}
      <div className="flex-1 flex flex-col">
        {renderFileViewer()}
      </div>
    </div>
  );
}