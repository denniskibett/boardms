"use client";
import React from 'react';

interface SystemErrorModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onClose: () => void;
}

export default function SystemErrorModal({ isOpen, title, message, onClose }: SystemErrorModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center mb-4">
          <div className="flex-shrink-0">
            <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm">!</span>
            </div>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white ml-3">
            {title}
          </h3>
        </div>
        
        <div className="mb-6">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {message}
          </p>
        </div>
        
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 focus:outline-hidden focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}