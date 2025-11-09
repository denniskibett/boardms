'use client';

import React, { useState, useEffect } from 'react';
import { X, Upload, Download, Trash2, FileText } from 'lucide-react';
import FileIcon from './FileIcon';

interface AgendaDocument {
  id: string;
  agenda_id: string;
  name: string; // This will be stored as string, not integer
  file_type: string;
  file_url: string;
  file_size: number;
  uploaded_by: string;
  uploaded_at: string;
  metadata: any;
}

interface Agenda {
  id: string;
  name: string;
  description?: string;
  ministry_id?: string;
  presenter_name?: string;
  sort_order: number;
  status: string;
  cabinet_approval_required: boolean;
  documents: AgendaDocument[];
}

interface AgendaSlideOverProps {
  agenda: Agenda | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (agenda: Agenda) => void;
}

export default function AgendaSlideOver({ agenda, isOpen, onClose, onSave }: AgendaSlideOverProps) {
  const [formData, setFormData] = useState<Partial<Agenda>>({});
  const [uploading, setUploading] = useState(false);
  const [documents, setDocuments] = useState<AgendaDocument[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (agenda) {
      setFormData({
        name: agenda.name || '',
        description: agenda.description || '',
        presenter_name: agenda.presenter_name || '',
        status: agenda.status || 'draft',
        cabinet_approval_required: agenda.cabinet_approval_required || false
      });
      setDocuments(agenda.documents || []);
    }
  }, [agenda]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agenda) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/agenda/${agenda.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const updatedAgenda = await response.json();
        onSave(updatedAgenda);
        onClose();
      } else {
        const errorData = await response.json();
        alert(`Failed to update agenda: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Failed to update agenda:', error);
      alert('Failed to update agenda. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !agenda) return;

    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('agendaId', agenda.id);
        formData.append('name', file.name); // This should be stored as string

        const response = await fetch('/api/agenda/documents', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const newDoc = await response.json();
          setDocuments(prev => [...prev, newDoc]);
        } else {
          const errorData = await response.json();
          alert(`Failed to upload file: ${errorData.error}`);
        }
      }
    } catch (error) {
      console.error('Failed to upload file:', error);
      alert('Failed to upload file. Please try again.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      const response = await fetch(`/api/agenda/documents?documentId=${documentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setDocuments(prev => prev.filter(doc => doc.id !== documentId));
      } else {
        const errorData = await response.json();
        alert(`Failed to delete document: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Failed to delete document:', error);
      alert('Failed to delete document. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
        onClick={onClose}
      />
      
      {/* Slide Over Panel */}
      <div className="fixed inset-y-0 right-0 max-w-full flex">
        <div className="w-screen max-w-2xl transform transition-transform duration-300 ease-in-out translate-x-0">
          <div className="h-full flex flex-col bg-white dark:bg-gray-800 shadow-xl">
            {/* Header */}
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {agenda ? `Edit Agenda: ${agenda.name}` : 'Create Agenda'}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Update agenda details and upload supporting documents
                  </p>
                </div>
                <button
                  type="button"
                  className="rounded-md p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  onClick={onClose}
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Form Content */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
              <div className="px-6 py-6 space-y-6">
                {/* Agenda Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Agenda Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    placeholder="Enter agenda item name"
                  />
                </div>

                {/* Presenter Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Presenter Name
                  </label>
                  <input
                    type="text"
                    value={formData.presenter_name || ''}
                    onChange={(e) => setFormData({ ...formData, presenter_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    placeholder="Enter presenter name"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    rows={4}
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    placeholder="Enter agenda item description"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status || 'draft'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="draft">Draft</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="in progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                {/* Cabinet Approval */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="cabinet_approval"
                    checked={formData.cabinet_approval_required || false}
                    onChange={(e) => setFormData({ ...formData, cabinet_approval_required: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="cabinet_approval" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                    Requires Cabinet Approval
                  </label>
                </div>

                {/* File Upload Section */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Upload Supporting Documents
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      multiple
                      onChange={handleFileUpload}
                      disabled={uploading}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900 dark:file:text-blue-300"
                      accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png,.txt"
                    />
                    {uploading && (
                      <div className="flex items-center text-sm text-gray-500">
                        <Upload className="h-4 w-4 animate-pulse mr-1" />
                        Uploading...
                      </div>
                    )}
                  </div>
                </div>

                {/* Documents List */}
                {documents.length > 0 && (
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Attached Documents ({documents.length})
                    </label>
                    <div className="space-y-3">
                      {documents.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
                        >
                          <div className="flex items-center space-x-3 flex-1 min-w-0">
                            <FileIcon fileType={doc.file_type} className="h-5 w-5 text-gray-400 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                                {doc.name}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {(doc.file_size / 1024 / 1024).toFixed(2)} MB • {new Date(doc.uploaded_at).toLocaleDateString()} • {doc.file_type.toUpperCase()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 flex-shrink-0 ml-3">
                            <a
                              href={doc.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 text-blue-600 hover:text-blue-500 transition-colors"
                              title="Download"
                            >
                              <Download className="h-4 w-4" />
                            </a>
                            <button
                              type="button"
                              onClick={() => handleDeleteDocument(doc.id)}
                              className="p-1 text-red-600 hover:text-red-500 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex-shrink-0 px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving || !formData.name}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}