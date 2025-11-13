'use client';

import React, { useRef, useState } from 'react';
import { Upload, FileText, X, Loader2 } from 'lucide-react';

interface DocumentUploadProps {
  onUpload: (file: File) => void;
  meetingId?: string;
}

export default function DocumentUpload({ onUpload, meetingId }: DocumentUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = [
        'application/pdf', 
        'application/msword', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'image/jpeg',
        'image/png',
        'image/gif',
        'text/plain'
      ];
      
      const allowedExtensions = ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx', '.jpg', '.jpeg', '.png', '.gif', '.txt'];
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      
      if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
        alert('Please upload a PDF, Word, PowerPoint, Excel, image, or text document');
        return;
      }

      // Validate file size (50MB)
      if (file.size > 50 * 1024 * 1024) {
        alert('File size must be less than 50MB');
        return;
      }

      setIsUploading(true);
      setUploadProgress(0);

      try {
        // Simulate upload progress
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => {
            if (prev >= 90) {
              clearInterval(progressInterval);
              return 90;
            }
            return prev + 10;
          });
        }, 200);

        await onUpload(file);
        
        clearInterval(progressInterval);
        setUploadProgress(100);
        
        // Reset after successful upload
        setTimeout(() => {
          setIsUploading(false);
          setUploadProgress(0);
        }, 500);

      } catch (error) {
        setIsUploading(false);
        setUploadProgress(0);
        // Error is handled in the parent component
      } finally {
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    }
  };

  const cancelUpload = () => {
    setIsUploading(false);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.txt"
        className="hidden"
        disabled={isUploading}
      />
      
      {isUploading ? (
        <div className="flex items-center space-x-3 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
          <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
          <div className="flex-1 w-32">
            <div className="w-full bg-blue-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
          <button
            onClick={cancelUpload}
            className="text-blue-600 hover:text-blue-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={!meetingId}
          className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          title={!meetingId ? "Please select a meeting first" : "Upload document"}
        >
          <Upload size={16} />
          <span>Upload Document</span>
        </button>
      )}
    </div>
  );
}