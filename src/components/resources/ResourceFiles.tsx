// components/resources/ResourceFiles.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { X, Download, Trash2, File, Eye, Upload, Search, Filter } from 'lucide-react';
import { useResources } from '@/hooks/useResources';

interface ResourceFilesProps {
  resourceId: number;
  onClose: () => void;
  onUpload: () => void;
}

interface ResourceFile {
  id: number;
  name: string;
  display_name: string;
  file_type: string;
  file_url: string;
  file_size: number;
  uploaded_at: string;
  ministry_name?: string;
  uploaded_by_name?: string;
  metadata?: any;
}

export default function ResourceFiles({ resourceId, onClose, onUpload }: ResourceFilesProps) {
  const { fetchResourceFiles, deleteFile } = useResources();
  const [files, setFiles] = useState<ResourceFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingFile, setDeletingFile] = useState<number | null>(null);

  const loadFiles = async () => {
    try {
      setLoading(true);
      const filesData = await fetchResourceFiles(resourceId);
      setFiles(filesData);
    } catch (err) {
      setError('Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFiles();
  }, [resourceId]);

  const handleDownload = async (file: ResourceFile) => {
    try {
      const response = await fetch(file.file_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Download failed. Please try again.');
    }
  };

  const handleDeleteFile = async (fileId: number, fileName: string) => {
    if (!confirm(`Are you sure you want to delete "${fileName}"? This action cannot be undone.`)) {
      return;
    }

    setDeletingFile(fileId);
    try {
      const success = await deleteFile(fileId);
      if (success) {
        setFiles(prev => prev.filter(f => f.id !== fileId));
        alert('File deleted successfully');
      }
    } finally {
      setDeletingFile(null);
    }
  };

  const handleViewFile = (file: ResourceFile) => {
    window.open(file.file_url, '_blank');
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'pdf': return '📄';
      case 'word': return '📝';
      case 'excel': return '📊';
      case 'powerpoint': return '📑';
      case 'image': return '🖼️';
      case 'archive': return '📦';
      default: return '📎';
    }
  };

  const filteredFiles = files.filter(file =>
    file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    file.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    file.ministry_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Resource Files
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {files.length} file{files.length !== 1 ? 's' : ''} • Manage documents
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onUpload}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Upload className="w-4 h-4" />
              Upload File
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search files..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>

        {/* Files List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
              <button
                onClick={loadFiles}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="text-center py-12">
              <File className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No files found
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                {searchTerm ? 'Try adjusting your search' : 'Get started by uploading your first file'}
              </p>
              {!searchTerm && (
                <button
                  onClick={onUpload}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  Upload File
                </button>
              )}
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {filteredFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="text-2xl">
                      {getFileIcon(file.file_type)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-white truncate">
                        {file.display_name}
                      </h4>
                      <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400 mt-1">
                        <span className="truncate">{file.name}</span>
                        <span>•</span>
                        <span>{formatFileSize(file.file_size)}</span>
                        {file.ministry_name && (
                          <>
                            <span>•</span>
                            <span className="text-blue-600 dark:text-blue-400">
                              {file.ministry_name}
                            </span>
                          </>
                        )}
                        <span>•</span>
                        <span>{new Date(file.uploaded_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleViewFile(file)}
                      className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      title="View file"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDownload(file)}
                      className="p-2 text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                      title="Download file"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteFile(file.id, file.display_name)}
                      disabled={deletingFile === file.id}
                      className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 disabled:opacity-50 transition-colors"
                      title="Delete file"
                    >
                      {deletingFile === file.id ? (
                        <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
          <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
            <span>
              Showing {filteredFiles.length} of {files.length} files
            </span>
            <button
              onClick={loadFiles}
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}