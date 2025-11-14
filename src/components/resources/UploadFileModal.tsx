// components/resources/UploadFileModal.tsx
"use client";

import React, { useState, useRef, useEffect } from 'react';
import { X, Upload, File, Loader2, Building2, Folder } from 'lucide-react';
import { useResources } from '@/hooks/useResources';

interface UploadFileModalProps {
  resourceId: number;
  onClose: () => void;
  onSuccess: () => void;
}

interface Ministry {
  id: number;
  name: string;
}

interface ResourceDetails {
  id: number;
  name: string;
  display_name: string;
  year: number;
  resource_type_name: string;
}

export default function UploadFileModal({ resourceId, onClose, onSuccess }: UploadFileModalProps) {
  const { uploadFile } = useResources();
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [ministryId, setMinistryId] = useState('');
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [resourceDetails, setResourceDetails] = useState<ResourceDetails | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch resource details and ministries on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch resource details
        const resourceResponse = await fetch(`/api/resources/${resourceId}`);
        if (resourceResponse.ok) {
          const resourceData = await resourceResponse.json();
          setResourceDetails(resourceData);
        }

        // Fetch ministries
        const ministriesResponse = await fetch('/api/ministries');
        if (ministriesResponse.ok) {
          const ministriesData = await ministriesResponse.json();
          setMinistries(ministriesData);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, [resourceId]);

  const handleFileSelect = (file: File) => {
    if (file) {
      setSelectedFile(file);
      if (!displayName) {
        setDisplayName(file.name.replace(/\.[^/.]+$/, "")); // Remove extension for display name
      }
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile) {
      alert('Please select a file to upload');
      return;
    }

    if (!displayName.trim()) {
      alert('Please enter a display name for the file');
      return;
    }

    if (!resourceDetails) {
      alert('Resource details not loaded. Please try again.');
      return;
    }

    setIsUploading(true);

    try {
      const success = await uploadFile(
        resourceId,
        selectedFile,
        ministryId ? parseInt(ministryId) : undefined,
        displayName.trim()
      );

      if (success) {
        onSuccess();
        onClose();
      }
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFolderStructure = () => {
    if (!resourceDetails) return null;
    
    return (
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-sm">
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 mb-1">
          <Folder className="w-4 h-4" />
          <span>File will be saved to:</span>
        </div>
        <div className="font-mono text-xs bg-white dark:bg-gray-800 p-2 rounded border">
          <div className="text-blue-600 dark:text-blue-400">resources/</div>
          <div className="ml-2 text-green-600 dark:text-green-400">{resourceDetails.resource_type_name}/</div>
          <div className="ml-4 text-purple-600 dark:text-purple-400">{resourceDetails.year}/</div>
          <div className="ml-6 text-orange-600 dark:text-orange-400">{resourceDetails.name}/</div>
          <div className="ml-8 text-gray-800 dark:text-gray-200">
            {selectedFile ? selectedFile.name : 'your-file.pdf'}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Upload File
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            disabled={isUploading}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Resource Info */}
          {resourceDetails && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
                <Folder className="w-4 h-4" />
                <span className="font-medium">{resourceDetails.display_name}</span>
              </div>
              <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                {resourceDetails.resource_type_name} • {resourceDetails.year}
              </div>
            </div>
          )}

          {/* File Upload Area */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select File *
            </label>
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                dragActive
                  ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
                disabled={isUploading}
              />
              
              {selectedFile ? (
                <div className="space-y-2">
                  <File className="w-12 h-12 text-green-500 mx-auto" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white truncate">
                      {selectedFile.name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {formatFileSize(selectedFile.size)}
                    </p>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Click or drag to change file
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      Drop your file here
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      or click to browse
                    </p>
                  </div>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    Supports PDF, Word, Excel, PowerPoint, Images
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Display Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Display Name *
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              placeholder="Enter a descriptive name for this file"
              required
              disabled={isUploading}
            />
          </div>

          {/* Ministry Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Ministry (Optional)
            </label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                value={ministryId}
                onChange={(e) => setMinistryId(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                disabled={isUploading}
              >
                <option value="">Select Ministry</option>
                {ministries.map(ministry => (
                  <option key={ministry.id} value={ministry.id}>
                    {ministry.name}
                  </option>
                ))}
              </select>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Selecting a ministry will prefix the filename with ministry name
            </p>
          </div>

          {/* Folder Structure Preview */}
          {getFolderStructure()}

          {/* Footer */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600 transition-colors"
              disabled={isUploading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedFile || !displayName.trim() || isUploading || !resourceDetails}
              className="flex items-center gap-2 flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isUploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              {isUploading ? 'Uploading...' : 'Upload File'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}